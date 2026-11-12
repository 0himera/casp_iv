import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { createMockServer, validate } from './mock-api.mjs';

const spec=JSON.parse(readFileSync(new URL('../api/openapi.json',import.meta.url),'utf8'));
const fixture=JSON.parse(readFileSync(new URL('../api/fixtures/shipment.json',import.meta.url),'utf8'));
const schema=(name,value)=>validate(value,spec.components.schemas[name]);
async function session(t) {
  const server=createMockServer({operationDelayMs:10});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
  const base=`http://127.0.0.1:${server.address().port}/api/v1`;
  const call=async(path,body,role='logistician',key=randomUUID())=>{
    const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{
      'Content-Type':'application/json','Authorization':`Bearer demo-${role}`,'Idempotency-Key':key},
      ...(body===undefined?{}:{body:JSON.stringify(body)})});
    const value=await response.json();
    if(!response.ok) schema('ErrorResponse',value);
    return {status:response.status,value};
  };
  const get=async(role)=>{const r=await call('/shipments/shp_demo_001',undefined,role);assert.equal(r.status,200);schema('Shipment',r.value);return r.value;};
  const complete=async(result)=>{
    assert.equal(result.status,202);schema('Operation',result.value);
    await new Promise(resolve=>setTimeout(resolve,20));
    const op=await call(`/operations/${result.value.id}`);
    schema('Operation',op.value);assert.equal(op.value.status,'simulated');assert.equal(op.value.transaction_hash,null);
    return get();
  };
  return {call,get,complete};
}

test('fixture, schema references and all date fields are valid',()=>{
  schema('Shipment',fixture);
  const walk=value=>{
    if(value && typeof value==='object') {
      if(value.$ref) assert.ok(spec.components.schemas[value.$ref.split('/').at(-1)]);
      for(const child of Object.values(value)) walk(child);
    }
  };walk(spec);
});

test('storm → route → three approvals → document invalidation',async t=>{
  const {call,get,complete}=await session(t);
  let s=await get();
  const normalRisk=s.forecast.miss_probability;
  const storm=await call('/demo/scenarios',{shipment_id:s.id,scenario:'storm',expected_revision:s.revision});
  assert.equal(storm.status,200);s=storm.value;schema('Shipment',s);
  assert.ok(s.forecast.miss_probability>normalRisk);
  s=await complete(await call(`/shipments/${s.id}/route-selection`,{
    route_id:'route_makh',forecast_id:s.forecast.id,expected_revision:s.revision}));
  assert.equal(s.passport.version,2);assert.equal(s.selected_route_id,'route_makh');
  assert.equal(s.passport.status,'collecting');assert.ok(s.passport.attestations.every(a=>a.status==='invalidated'));
  for(const role of ['logistician','carrier','customs'])
    s=await complete(await call(`/shipments/${s.id}/attestations`,{decision:'approved',expected_revision:s.revision},role));
  assert.equal(s.passport.status,'ready');
  const previousHash=s.passport.documents_hash;
  s=await complete(await call(`/shipments/${s.id}/document-revisions`,{
    document_id:'doc_invoice',filename:'invoice-v2.txt',content_base64:Buffer.from('changed invoice').toString('base64'),expected_revision:s.revision}));
  assert.equal(s.passport.version,3);assert.equal(s.passport.status,'collecting');
  assert.notEqual(s.passport.documents_hash,previousHash);
  assert.equal(s.documents[0].sha256,createHash('sha256').update('changed invoice').digest('hex'));
  assert.equal(s.documents[0].version,2);
});

test('stale revision, idempotency replay and body conflict',async t=>{
  const {call,get,complete}=await session(t);let s=await get();
  const body={decision:'approved',expected_revision:s.revision},key=randomUUID();
  const first=await call(`/shipments/${s.id}/attestations`,body,'customs',key);
  const replay=await call(`/shipments/${s.id}/attestations`,body,'customs',key);
  assert.equal(replay.value.id,first.value.id);
  const conflict=await call(`/shipments/${s.id}/attestations`,{...body,decision:'rejected'},'customs',key);
  assert.equal(conflict.status,409);assert.equal(conflict.value.error.code,'IDEMPOTENCY_CONFLICT');
  s=await complete(first);assert.equal(s.passport.status,'ready');
  const stale=await call(`/shipments/${s.id}/attestations`,body,'customs');
  assert.equal(stale.status,409);assert.equal(stale.value.error.code,'STALE_REVISION');
  const completedReplay=await call(`/shipments/${s.id}/attestations`,body,'customs',key);
  assert.equal(completedReplay.value.id,first.value.id);
  assert.equal((await get()).revision,s.revision);
});

test('role enforcement, rejection, unknown objects and invalid file',async t=>{
  const {call,get,complete}=await session(t);let s=await get('carrier');
  assert.deepEqual(s.allowed_actions,['attest']);
  const denied=await call(`/shipments/${s.id}/route-selection`,{route_id:'route_makh',forecast_id:s.forecast.id,expected_revision:s.revision},'carrier');
  assert.equal(denied.status,403);
  s=await complete(await call(`/shipments/${s.id}/attestations`,{decision:'rejected',expected_revision:s.revision},'customs'));
  assert.equal(s.passport.status,'blocked');
  const file=await call(`/shipments/${s.id}/document-revisions`,{document_id:'doc_invoice',filename:'x',content_base64:'????',expected_revision:s.revision});
  assert.equal(file.status,422);
  assert.equal((await call('/shipments/not-real')).status,404);
  assert.equal((await call(`/shipments/${s.id}/attestations`,{decision:'approved',role:'customs',expected_revision:s.revision})).status,422);
});

test('missing data is null; forecast mismatch cannot select a route',async t=>{
  const {call,get}=await session(t);let s=await get();
  const stale=await call(`/shipments/${s.id}/route-selection`,{route_id:'route_makh',forecast_id:'old',expected_revision:s.revision});
  assert.equal(stale.status,409);assert.equal(stale.value.error.code,'STALE_FORECAST');
  s=(await call('/demo/scenarios',{shipment_id:s.id,scenario:'missing_data',expected_revision:s.revision})).value;
  schema('Shipment',s);assert.equal(s.forecast.miss_probability,null);assert.equal(s.routes[0].eta.p50,null);
  const unavailable=await call(`/shipments/${s.id}/route-selection`,{route_id:'route_makh',forecast_id:s.forecast.id,expected_revision:s.revision});
  assert.equal(unavailable.status,409);assert.equal(unavailable.value.error.code,'ROUTE_UNAVAILABLE');
  schema('ShipmentList',(await call('/shipments')).value);schema('Health',(await call('/health')).value);
});
