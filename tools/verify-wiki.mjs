// Wiki 條目對照表建置：node tools/verify-wiki.mjs
// 逐站測試 zh.wikipedia REST summary，找出每站「type=standard 且主題正確」的條目標題。
// 單線程＋間隔＋429 退避；結果快取於 tools/wiki-map.json（可增量重跑）。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cachePath = join(root, 'tools', 'wiki-map.json');
const html = readFileSync(join(root, 'index.html'), 'utf-8');
const m = html.match(/\/\* DATA:BEGIN[\s\S]*?\*\/([\s\S]*?)\/\* DATA:END \*\//);
const { STATIONS } = new Function(m[1] + '; return { STATIONS };')();

const API = 'https://zh.wikipedia.org/api/rest_v1/page/summary/';
const HEADERS = { 'Accept-Language': 'zh-tw', 'User-Agent': 'TaipeiMetroDraw/1.0 (build-time check; contact: github.com/a102304043/TaipeiMetroDraw)' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const TOPIC_HINT = ['捷運', '車站', '輕軌', '鐵路', 'metro', '地鐵'];
const PLACE_HINT = ['臺北', '台北', '新北', '桃園', '淡水', '三峽', '鶯歌', '蘆洲', '中和', '新店',
  '土城', '板橋', '新莊', '安坑', '林口', '中壢', '大園', '龜山', '蘆竹', '淡海', '內湖', '文山',
  '三重', '泰山', '汐止', '北投', '士林', '信義', '萬華'];

async function probe(title){
  for (let attempt = 0; attempt < 4; attempt++){
    try {
      const r = await fetch(API + encodeURIComponent(title.replaceAll(' ', '_')), { headers: HEADERS });
      if (r.status === 429){ await sleep(2500 * (attempt + 1)); continue; }
      if (!r.ok) return { ok:false, why:String(r.status) };
      const j = await r.json();
      if (j.type !== 'standard') return { ok:false, why:j.type };
      const text = (j.description ?? '') + (j.extract ?? '');
      const good = TOPIC_HINT.some(h => text.toLowerCase().includes(h)) && PLACE_HINT.some(h => text.includes(h));
      return { ok: good, why: good ? 'OK' : 'topic?', thumb: !!j.thumbnail, desc: j.description ?? '' };
    } catch (e) { await sleep(1500); }
  }
  return { ok:false, why:'429/err(retries exhausted)' };
}

function candidates(name){
  const list = [`${name}站`, `${name}站 (臺北市)`, `${name}站 (新北市)`, `${name}站 (桃園市)`,
    `${name}站 (台北市)`, `${name}站 (臺灣)`, `${name}站 (台灣)`, `${name}站 (桃園捷運)`,
    `${name}站 (新北捷運)`, `${name}車站`, `${name}車站 (臺灣)`];
  if (name.endsWith('站')) list.unshift(`${name}`);   // 台北車站、高鐵桃園站、鶯歌車站
  return [...new Set(list)];
}

const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf-8')) : {};
const pool = STATIONS.filter(s => s.enabled !== false);
const failures = [];
let done = 0;

for (const s of pool){
  if (cache[s.name]?.title){ done++; continue; }
  let found = null; const tried = [];
  for (const cand of candidates(s.name)){
    const r = await probe(cand);
    tried.push(`${cand}:${r.why}`);
    await sleep(250);
    if (r.ok){ found = { title: cand, thumb: r.thumb, desc: r.desc }; break; }
  }
  if (found){
    cache[s.name] = found;
    done++;
    process.stdout.write(`✓ ${done}/${pool.length} ${s.name} → ${found.title}${found.thumb ? '' : '（無縮圖）'}\n`);
  } else {
    failures.push(`${s.name} → ${tried.join(' | ')}`);
    process.stdout.write(`✗ ${s.name}\n`);
  }
  writeFileSync(cachePath, JSON.stringify(cache, null, 1));
}

const overrides = {};
let noThumb = 0;
for (const s of pool){
  const c = cache[s.name];
  if (!c) continue;
  if (!c.thumb) noThumb++;
  if (c.title !== `${s.name}站`) overrides[s.name] = c.title;
}
console.log(`\n=== 結果：${pool.length} 站，已解析 ${done}，覆寫 ${Object.keys(overrides).length} 筆，失敗 ${failures.length}，無縮圖 ${noThumb} ===`);
console.log('\nconst WIKI_TITLES = ' + JSON.stringify(overrides, null, 2).replace(/"([^"]+)"/g, "'$1'") + ';');
if (failures.length){ console.log('\n=== 失敗清單 ==='); failures.forEach(f => console.log('✗', f)); }
