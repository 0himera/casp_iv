import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const schemas = JSON.parse(readFileSync(new URL('api/openapi.json', root), 'utf8')).components.schemas;
function ts(s) {
  if (s.$ref) return s.$ref.split('/').at(-1);
  if (s.enum) return s.enum.map(x => JSON.stringify(x)).join(' | ');
  if (Array.isArray(s.type)) return s.type.map(type => ts({ ...s, type })).join(' | ');
  if (s.type === 'object') return '{\n' + Object.entries(s.properties).map(([k,v]) =>
    `  ${k}${s.required?.includes(k) ? '' : '?'}: ${ts(v)};`).join('\n') + '\n}';
  if (s.type === 'array') return `Array<${ts(s.items)}>`;
  return s.type === 'integer' ? 'number' : s.type;
}
writeFileSync(new URL('api/types.ts', root), '// Generated from openapi.json. Run node tools/generate-types.mjs.\n\n' +
  Object.entries(schemas).map(([name, schema]) => `export type ${name} = ${ts(schema)};`).join('\n\n') + '\n');
