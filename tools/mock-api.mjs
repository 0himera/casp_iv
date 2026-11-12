// Local, single-session frontend mock. No real documents, keys or chain calls.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const spec = JSON.parse(readFileSync(new URL('api/openapi.json', root), 'utf8'));
const seed = JSON.parse(readFileSync(new URL('api/fixtures/shipment.json', root), 'utf8'));
const now = () => new Date().toISOString();
const hash = value => createHash('sha256').update(value).digest('hex');
const roles = ['logistician', 'carrier', 'customs'];
const err = (status, code, message) => Object.assign(new Error(message), { status, code });

// Validates the subset of JSON Schema used in the checked-in API contract.
export function validate(value, schema, path = '$') {
  if (schema.$ref) return validate(value, spec.components.schemas[schema.$ref.split('/').at(-1)], path);
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (!types.some(t => t === type || (t === 'integer' && type === 'number' && Number.isInteger(value))))
    throw err(422, 'VALIDATION_ERROR', `${path}: invalid type`);
  if (value === null) return;
  if (schema.enum && !schema.enum.includes(value)) throw err(422, 'VALIDATION_ERROR', `${path}: invalid enum`);
  if (typeof value === 'number' && (!Number.isFinite(value) || value < (schema.minimum ?? -Infinity) || value > (schema.maximum ?? Infinity)))
    throw err(422, 'VALIDATION_ERROR', `${path}: invalid range`);
  if (typeof value === 'string') {
    if (value.length < (schema.minLength ?? 0) || value.length > (schema.maxLength ?? Infinity) ||
        (schema.pattern && !new RegExp(schema.pattern).test(value)) ||
        (schema.format === 'date-time' && Number.isNaN(Date.parse(value))))
      throw err(422, 'VALIDATION_ERROR', `${path}: invalid string`);
  }
  if (type === 'array') {
    if (value.length < (schema.minItems ?? 0) || value.length > (schema.maxItems ?? Infinity))
      throw err(422, 'VALIDATION_ERROR', `${path}: invalid length`);
    value.forEach((v,i) => validate(v,schema.items,`${path}[${i}]`));
  }
  if (type === 'object') {
    for (const key of schema.required ?? []) if (!(key in value)) throw err(422,'VALIDATION_ERROR',`${path}.${key}: required`);
    for (const [key,v] of Object.entries(value)) {
      if (!schema.properties[key] && schema.additionalProperties === false) throw err(422,'VALIDATION_ERROR',`${path}.${key}: unknown field`);
      if (schema.properties[key]) validate(v,schema.properties[key],`${path}.${key}`);
    }
  }
}

export function createMockServer({ operationDelayMs = 1000 } = {}) {
  const shipment = structuredClone(seed);
  const operations = new Map();
  const idempotency = new Map();
  let scenario = 'normal';
  const refreshForecast = () => {
    shipment.forecast.id = `fc_${randomUUID()}`;
    shipment.forecast.generated_at = now();
    shipment.forecast.valid_until = new Date(Date.now()+15*60_000).toISOString();
    shipment.updated_at = now();
  };
  const hashes = () => {
    shipment.passport.documents_hash = hash(JSON.stringify(shipment.documents.map(d => [d.id,d.version,d.sha256]).sort()));
    const route = shipment.routes.find(r=>r.id===shipment.selected_route_id);
    // Hash only agreed plan fields, not fluctuating predictions/costs.
    shipment.passport.route_hash = hash(JSON.stringify([route.id,route.ports,route.modes,route.geometry]));
  };
  const readiness = () => {
    for (const a of shipment.passport.attestations)
      if (a.status === 'active' && Date.parse(a.valid_until) <= Date.parse(shipment.scenario_time)) a.status = 'expired';
    const active = shipment.passport.attestations.filter(a=>a.version===shipment.passport.version && a.status==='active');
    shipment.passport.status = active.some(a=>a.decision==='rejected') ? 'blocked' :
      roles.every(role=>active.some(a=>a.role===role && a.decision==='approved')) ? 'ready' : 'collecting';
  };
  const applyScenario = () => {
    shipment.routes = structuredClone(seed.routes);
    shipment.forecast.ready_at = structuredClone(seed.forecast.ready_at);
    shipment.forecast.quality = scenario === 'missing_data' ? 'missing' : 'synthetic';
    shipment.forecast.reasons = scenario === 'storm' ? ['Штормовое окно и задержка поезда в демонстрационном сценарии'] :
      scenario === 'missing_data' ? ['Нет актуальных входных данных; вероятность не рассчитана'] : structuredClone(seed.forecast.reasons);
    if (scenario === 'storm') {
      shipment.routes[0].eta = {p10:'2026-11-17T06:00:00Z',p50:'2026-11-17T08:00:00Z',p90:'2026-11-17T12:00:00Z'};
      shipment.routes[0].miss_probability=.84;
      shipment.routes[1].miss_probability=.25;
      shipment.forecast.ready_at={p10:'2026-11-13T11:00:00Z',p50:'2026-11-13T16:00:00Z',p90:'2026-11-14T02:00:00Z'};
    }
    const selected = shipment.routes.find(r=>r.id===shipment.selected_route_id);
    if (selected.id==='route_makh') {
      shipment.forecast.cargo_cutoff='2026-11-14T12:00:00Z';
      shipment.forecast.ready_at={p10:'2026-11-14T04:00:00Z',p50:'2026-11-14T08:00:00Z',p90:'2026-11-14T15:00:00Z'};
      if (scenario !== 'missing_data') shipment.forecast.reasons=['Альтернатива включает сухопутное плечо от текущей точки; вместимость условная'];
    } else shipment.forecast.cargo_cutoff=seed.forecast.cargo_cutoff;
    if (scenario==='missing_data') {
      shipment.forecast.ready_at={p10:null,p50:null,p90:null};
      for (const route of shipment.routes) {
        route.eta={p10:null,p50:null,p90:null}; route.miss_probability=null;
        route.feasible=false; route.infeasibility_reason='Нельзя подтвердить выполнимость без актуальных данных';
        route.capacity_status='unknown';
      }
    }
    for (const route of shipment.routes) route.requires_reapproval=route.id!==shipment.selected_route_id;
    shipment.forecast.miss_probability=selected.miss_probability;
    refreshForecast();
  };
  const event = (actor,title) => shipment.timeline.push({id:`evt_${randomUUID()}`,occurred_at:now(),actor,title,passport_version:shipment.passport.version});
  const revisePassport = () => {
    shipment.passport.version++;
    for (const a of shipment.passport.attestations) if (a.status==='active') a.status='invalidated';
    hashes(); readiness();
  };
  const settle = () => {
    for (const record of operations.values()) {
      if (record.operation.status !== 'queued' || Date.now() < record.readyAt) continue;
      try {
        record.apply();
        shipment.revision++;
        shipment.updated_at=now();
        readiness();
        record.operation.status='simulated';
        record.operation.result_revision=shipment.revision;
      } catch {
        record.operation.status='failed'; record.operation.error_code='MOCK_OPERATION_FAILED';
      }
      shipment.pending_operation_id=null;
    }
  };
  const view = role => {
    settle(); readiness();
    const copy=structuredClone(shipment);
    copy.allowed_actions=shipment.pending_operation_id ? [] : role==='logistician' ?
      ['select_route','replace_document','attest','run_scenario'] : ['attest'];
    return copy;
  };
  hashes(); refreshForecast();
  return createServer(async (req,res) => {
    const origin=req.headers.origin;
    if (['http://localhost:3000','http://127.0.0.1:3000',process.env.FRONTEND_ORIGIN].filter(Boolean).includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin',origin); res.setHeader('Vary','Origin');
    }
    res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, Idempotency-Key');
    res.setHeader('Cache-Control','no-store');
    const send = (status,value) => {res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
    try {
      if(req.method==='OPTIONS') {res.writeHead(204);res.end();return;}
      const path=new URL(req.url,'http://localhost').pathname;
      const token=req.headers.authorization;
      const role=roles.find(r=>token===`Bearer demo-${r}`);
      if (token && !role) throw err(401,'UNAUTHORIZED','Неизвестный demo bearer');
      if(req.method==='GET' && path==='/openapi.json') return send(200,spec);
      if (!path.startsWith('/api/v1/')) throw err(404,'NOT_FOUND','Путь не найден');
      const relative=path.slice('/api/v1'.length);
      settle();
      if(req.method==='GET') {
        if(relative==='/health') return send(200,{status:'ok',mode:'mock',api_version:'1.0.0'});
        if(relative==='/corridors') return send(200,{items:[
          {id:'alat-aktau',port_ids:['alat','aktau'],evidence:'East-West corridor connects Baku/Alat and Aktau'},
          {id:'alat-kuryk',port_ids:['alat','kuryk'],evidence:'East-West corridor connects Baku/Alat and Kuryk'},
          {id:'alat-turkmenbashi',port_ids:['alat','turkmenbashi'],evidence:'East-West corridor connects Baku/Alat and Turkmenbashi'},
          {id:'aktau-amirabad',port_ids:['aktau','amirabad'],evidence:'UNECE network lists Aktau–Amirabad'},
          {id:'aktau-makhachkala',port_ids:['aktau','makhachkala'],evidence:'UNECE network lists Aktau–Makhachkala'},
          {id:'kuryk-amirabad',port_ids:['kuryk','amirabad'],evidence:'Port operator announced line in 2021'},
          {id:'kuryk-anzali',port_ids:['kuryk','anzali'],evidence:'Port operator announced line in 2021'},
          {id:'kuryk-makhachkala',port_ids:['kuryk','makhachkala'],evidence:'2026 agreement to organize ferry service'}
        ]});
        if(relative==='/shipments') {
          const s=view(role??'logistician'), route=s.routes.find(r=>r.id===s.selected_route_id);
          return send(200,{items:[{id:s.id,title:s.title,origin:s.origin.name,destination:s.destination.name,
            movement_status:s.movement_status,eta:route.eta.p50,miss_probability:s.forecast.miss_probability,passport_status:s.passport.status}]});
        }
        if(relative===`/shipments/${shipment.id}`) return send(200,view(role??'logistician'));
        const operation=operations.get(relative.replace(/^\/operations\//,''));
        if(relative.startsWith('/operations/') && operation) return send(200,operation.operation);
        throw err(404,'NOT_FOUND','Объект не найден');
      }
      if(req.method!=='POST') throw err(404,'NOT_FOUND','Путь не найден');
      if(!role) throw err(401,'UNAUTHORIZED','Требуется demo bearer');
      const routes={
        [`/shipments/${shipment.id}/route-selection`]:['RouteSelectionRequest','select_route'],
        [`/shipments/${shipment.id}/document-revisions`]:['DocumentRevisionRequest','replace_document'],
        [`/shipments/${shipment.id}/attestations`]:['AttestationRequest','attest'],
        '/demo/scenarios':['ScenarioRequest','scenario']
      };
      const definition=routes[relative];
      if(!definition) throw err(404,'NOT_FOUND','Путь не найден');
      const key=req.headers['idempotency-key'];
      if(!key || key.length>128) throw err(400,'IDEMPOTENCY_KEY_REQUIRED','Нужен Idempotency-Key до 128 символов');
      if(!req.headers['content-type']?.startsWith('application/json')) throw err(400,'JSON_REQUIRED','Нужен application/json');
      const chunks=[];let size=0;
      for await (const chunk of req) {
        size+=chunk.length;
        if(size>1_500_000) throw err(413,'BODY_TOO_LARGE','Максимальный файл 1 MiB');
        chunks.push(chunk);
      }
      let body;
      try {body=JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch {throw err(400,'INVALID_JSON','Некорректный JSON');}
      validate(body,spec.components.schemas[definition[0]]);
      const cacheKey=`${role}:${relative}:${key}`;
      const payloadHash=hash(JSON.stringify(body));
      const cached=idempotency.get(cacheKey);
      if(cached) {
        if(cached.hash!==payloadHash) throw err(409,'IDEMPOTENCY_CONFLICT','Ключ уже использован с другим запросом');
        return send(cached.status,cached.value);
      }
      if(definition[1]!=='attest' && role!=='logistician') throw err(403,'FORBIDDEN','Действие доступно логисту');
      if(body.shipment_id && body.shipment_id!==shipment.id) throw err(404,'NOT_FOUND','Груз не найден');
      if(shipment.pending_operation_id) throw err(409,'OPERATION_PENDING','Дождитесь текущей операции');
      if(body.expected_revision!==shipment.revision) throw err(409,'STALE_REVISION','Обновите карточку груза');
      let apply;
      if(definition[1]==='scenario') {
        scenario=body.scenario; applyScenario(); shipment.revision++; event(role,`Сценарий: ${scenario}`);
        const response=view(role); idempotency.set(cacheKey,{hash:payloadHash,status:200,value:response});
        return send(200,response);
      }
      if(definition[1]==='select_route') {
        if(Date.parse(shipment.forecast.valid_until)<Date.now()) refreshForecast();
        const route=shipment.routes.find(r=>r.id===body.route_id);
        if(!route) throw err(404,'NOT_FOUND','Маршрут не найден');
        if(!route.feasible) throw err(409,'ROUTE_UNAVAILABLE',route.infeasibility_reason);
        if(route.id===shipment.selected_route_id) throw err(409,'ROUTE_ALREADY_SELECTED','Этот маршрут уже выбран');
        apply=()=>{shipment.selected_route_id=route.id;revisePassport();applyScenario();event(role,'Выбран новый маршрут; требуется повторное согласование');};
      }
      if(definition[1]==='replace_document') {
        const document=shipment.documents.find(d=>d.id===body.document_id);
        if(!document) throw err(404,'NOT_FOUND','Документ не найден');
        const bytes=Buffer.from(body.content_base64,'base64');
        if(!bytes.length || bytes.toString('base64')!==body.content_base64) throw err(422,'INVALID_BASE64','Нужен канонический base64 без data: prefix');
        if(bytes.length>1_048_576) throw err(413,'FILE_TOO_LARGE','Максимальный файл 1 MiB');
        apply=()=>{document.sha256=hash(bytes);document.filename=body.filename;document.version++;revisePassport();event(role,'Документ заменён; требуется повторное согласование');};
      }
      if(definition[1]==='attest') apply=()=>{
        for(const a of shipment.passport.attestations) if(a.role===role && a.status==='active') a.status='invalidated';
        shipment.passport.attestations.push({role,version:shipment.passport.version,decision:body.decision,status:'active',valid_until:'2026-11-14T08:00:00Z'});
        event(role,body.decision==='approved'?'Версия подтверждена (симуляция)':'Версия отклонена (симуляция)');
      };
      const operation={id:`op_${randomUUID()}`,shipment_id:shipment.id,status:'queued',kind:definition[1],network:'mock',
        transaction_hash:null,explorer_url:null,created_at:now(),result_revision:null,error_code:null};
      shipment.pending_operation_id=operation.id;
      operations.set(operation.id,{operation,apply,readyAt:Date.now()+operationDelayMs});
      idempotency.set(cacheKey,{hash:payloadHash,status:202,value:structuredClone(operation)});
      send(202,operation);
    } catch(e) {send(e.status??500,{error:{code:e.code??'INTERNAL_ERROR',message:e.status?e.message:'Ошибка mock API'}});}
  });
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const port=Number(process.env.PORT??4010);
  createMockServer().listen(port,'127.0.0.1',()=>console.log(`Caspian Flow mock: http://localhost:${port}/api/v1 (synthetic data, simulated chain)`));
}
