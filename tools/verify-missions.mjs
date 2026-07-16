// 招牌任務驗證：node tools/verify-missions.mjs [--table]
// 檢查：覆蓋率（enabled 站全有）、文字唯一性、長度上限、模板句式偵測
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf-8');

const dm = html.match(/\/\* DATA:BEGIN[\s\S]*?\*\/([\s\S]*?)\/\* DATA:END \*\//);
const { STATIONS } = new Function(dm[1] + '; return { STATIONS };')();
const mm = html.match(/MISSIONS:BEGIN[\s\S]*?\*\/([\s\S]*?)\/\* MISSIONS:END \*\//);
if (!mm) { console.error('找不到 MISSIONS:BEGIN/END 標記'); process.exit(1); }
const { STATION_MISSIONS } = new Function(mm[1] + '; return { STATION_MISSIONS };')();

let errors = 0, warns = 0;
const err = m => { console.error('✗', m); errors++; };
const warn = m => { console.warn('△', m); warns++; };

const enabled = STATIONS.filter(s => s.enabled !== false);
const byId = Object.fromEntries(STATIONS.map(s => [s.id, s]));

// 1. 覆蓋率
for (const s of enabled)
  if (!STATION_MISSIONS[s.id]) err(`缺招牌任務：${s.name}（${s.id}）`);
// 2. 沒有多餘/未知 id
for (const id of Object.keys(STATION_MISSIONS))
  if (!byId[id]) warn(`任務對到未知站 id：${id}`);
// 3. 唯一性
const seen = new Map();
for (const [id, t] of Object.entries(STATION_MISSIONS)){
  if (seen.has(t)) err(`任務文字重複：${byId[id]?.name} 與 ${byId[seen.get(t)]?.name}——「${t}」`);
  seen.set(t, id);
}
// 4. 長度
for (const [id, t] of Object.entries(STATION_MISSIONS)){
  if (t.length > 36) err(`超過 36 字（${t.length}）：${byId[id]?.name}——「${t}」`);
  if (t.length < 8) warn(`過短（${t.length}）：${byId[id]?.name}——「${t}」`);
}
// 5. 模板句式偵測：相同前 6 字出現 >= 4 次
const heads = {};
for (const t of Object.values(STATION_MISSIONS))
  heads[t.slice(0, 6)] = (heads[t.slice(0, 6)] ?? 0) + 1;
for (const [h, n] of Object.entries(heads))
  if (n >= 4) warn(`疑似模板句式：${n} 條任務以「${h}」開頭`);

if (process.argv.includes('--table')){
  console.log('\n=== 全表 ===');
  for (const s of enabled)
    console.log(`${s.name}：${STATION_MISSIONS[s.id] ?? '（缺）'}`);
}

console.log(`\n檢查完成：${enabled.length} 站、${Object.keys(STATION_MISSIONS).length} 條任務`);
console.log(errors ? `✗ ${errors} 個錯誤、${warns} 個警告` : `✓ 全部通過（${warns} 個警告）`);
process.exit(errors ? 1 : 0);
