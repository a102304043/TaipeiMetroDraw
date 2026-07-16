// 資料驗證工具：node tools/verify-data.mjs
// 從 index.html 抽出 STATIONS/LINES，逐線比對「官方站名順序」（2026-07-16 查證），
// 並檢查座標網格吸附、octilinear 幾何、相對地理方位。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf-8');
const m = html.match(/\/\* DATA:BEGIN[\s\S]*?\*\/([\s\S]*?)\/\* DATA:END \*\//);
if (!m) { console.error('找不到 DATA:BEGIN/END 標記'); process.exit(1); }
const { STATIONS, LINES } = new Function(m[1] + '; return { STATIONS, LINES };')();
// 與 app 相同的未通車站過濾（enabled:false 不入線）
{
  const byId = Object.fromEntries(STATIONS.map(s => [s.id, s]));
  for (const line of LINES)
    line.segments = line.segments.map(
      seg => seg.filter(p => typeof p !== 'string' || byId[p]?.enabled !== false));
}

/* ============ Canonical：官方站名順序（計畫附錄，2026-07-16 查證） ============ */
// 每線一或多個 segment；segment = 依行駛方向的站名序列
const CANON = {
  BR: [['動物園','木柵','萬芳社區','萬芳醫院','辛亥','麟光','六張犁','科技大樓','大安','忠孝復興','南京復興','中山國中','松山機場','大直','劍南路','西湖','港墘','文德','內湖','大湖公園','葫洲','東湖','南港軟體園區','南港展覽館']],
  R:  [['象山','台北101/世貿','信義安和','大安','大安森林公園','東門','中正紀念堂','台大醫院','台北車站','中山','雙連','民權西路','圓山','劍潭','士林','芝山','明德','石牌','唭哩岸','奇岩','北投','復興崗','忠義','關渡','竹圍','紅樹林','淡水'],
       ['北投','新北投']],
  G:  [['新店','新店區公所','七張','大坪林','景美','萬隆','公館','台電大樓','古亭','中正紀念堂','小南門','西門','北門','中山','松江南京','南京復興','台北小巨蛋','南京三民','松山'],
       ['七張','小碧潭']],
  O:  [['南勢角','景安','永安市場','頂溪','古亭','東門','忠孝新生','松江南京','行天宮','中山國小','民權西路','大橋頭','台北橋','菜寮','三重','先嗇宮','頭前庄','新莊','輔大','丹鳳','迴龍'],
       ['大橋頭','三重國小','三和國中','徐匯中學','三民高中','蘆洲']],
  BL: [['頂埔','永寧','土城','海山','亞東醫院','府中','板橋','新埔','江子翠','龍山寺','西門','台北車站','善導寺','忠孝新生','忠孝復興','忠孝敦化','國父紀念館','市政府','永春','後山埤','昆陽','南港','南港展覽館']],
  Y:  [['大坪林','十四張','秀朗橋','景平','景安','中和','橋和','中原','板新','板橋','新埔民生','頭前庄','幸福','新北產業園區']],
  A:  [['台北車站','三重','新北產業園區','新莊副都心','泰山','泰山貴和','體育大學','長庚醫院','林口','山鼻','坑口','機場第一航廈','機場第二航廈','機場旅館','大園','橫山','領航','高鐵桃園站','桃園體育園區','興南','環北','老街溪']],
  V:  [['紅樹林','竿蓁林','淡金鄧公','淡江大學','淡金北新','新市一路','淡水行政中心','濱海義山','濱海沙崙','淡海新市鎮','崁頂'],
       ['濱海沙崙','台北海洋大學','沙崙','淡水漁人碼頭']],
  K:  [['雙城','玫瑰中國城','台北小城','耕莘安康院區','景文科大','安康','陽光運動公園','新和國小','十四張']],
  LB: [['頂埔','媽祖田','長壽山','橫溪','龍埔','三峽','臺北大學','鶯歌車站','陶瓷老街','國華','永吉公園','鶯桃福德']],
};
// 相對地理方位 sanity（schematic 允許變形，但方位不能反）
const GEO = [
  ['動物園','y>','忠孝復興'],   // 動物園在南
  ['頂埔','x<','台北車站'],     // 頂埔在西南
  ['頂埔','y>','台北車站'],
  ['南港展覽館','x>','台北車站'],
  ['淡水','y<','台北車站'],     // 淡水在北
  ['淡水','x<','台北車站'],
  ['新店','y>','台北車站'],     // 新店在南
  ['迴龍','x<','民權西路'],     // 迴龍在西
  ['蘆洲','y<','大橋頭'],       // 蘆洲支線往北
  ['老街溪','x<','泰山貴和'],   // 機捷往西南
  ['老街溪','y>','林口'],
  ['鶯桃福德','x<','頂埔'],     // 三鶯線往西南
  ['崁頂','y<','紅樹林'],       // 淡海輕軌往北
  ['雙城','y>','十四張'],       // 安坑輕軌往南
];

/* ============ 檢查 ============ */
const S = Object.fromEntries(STATIONS.map(s => [s.id, s]));
const byName = {};
for (const s of STATIONS) (byName[s.name] ??= []).push(s);
let errors = 0, warns = 0;
const err = msg => { console.error('✗', msg); errors++; };
const warn = msg => { console.warn('△', msg); warns++; };

// 1. id 唯一、座標吸附 25、codes 與 id 一致
const seen = new Set();
for (const s of STATIONS){
  if (seen.has(s.id)) err(`站 id 重複：${s.id}`);
  seen.add(s.id);
  if (s.x % 25 || s.y % 25) err(`${s.name}(${s.id}) 座標未吸附 25 格：(${s.x},${s.y})`);
  const first = Object.values(s.codes)[0];
  const norm = c => c.toLowerCase().replace(/[^a-z0-9]/g,'').replace(/^([a-z]+)0*(\d)/, '$1$2');
  if (norm(first) !== norm(s.id))
    warn(`${s.name} id「${s.id}」與第一個站碼「${first}」不一致`);
}
// 2. 站點座標重複（兩站疊在同一點）
const pos = new Map();
for (const s of STATIONS){
  const k = `${s.x},${s.y}`;
  if (pos.has(k)) err(`座標重疊：${s.name} 與 ${pos.get(k)} 都在 (${k})`);
  pos.set(k, s.name);
}
// 3. 逐線比對站名順序（僅檢查已建置的線）
for (const line of LINES){
  const canonSegs = CANON[line.id];
  if (!canonSegs){ warn(`線 ${line.id} 沒有 canonical 資料`); continue; }
  if (line.segments.length !== canonSegs.length)
    err(`${line.name} segment 數不符：資料 ${line.segments.length}、canonical ${canonSegs.length}`);
  line.segments.forEach((seg, i) => {
    const names = seg.filter(p => typeof p === 'string').map(id => S[id]?.name ?? `<未知:${id}>`);
    const canon = canonSegs[i] ?? [];
    const a = names.join('→'), b = canon.join('→');
    if (a !== b){
      err(`${line.name} segment ${i+1} 站名/順序不符：`);
      console.error(`  資料     : ${a}`);
      console.error(`  canonical: ${b}`);
    }
  });
}
// 4. octilinear：相鄰點必須水平/垂直/45°
for (const line of LINES){
  for (const seg of line.segments){
    const pts = seg.map(p => typeof p === 'string' ? [S[p]?.x, S[p]?.y, S[p]?.name] : [...p, '(轉折點)']);
    for (let i = 1; i < pts.length; i++){
      const dx = pts[i][0]-pts[i-1][0], dy = pts[i][1]-pts[i-1][1];
      if (!(dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)))
        err(`${line.name} 非 octilinear：${pts[i-1][2]}(${pts[i-1][0]},${pts[i-1][1]}) → ${pts[i][2]}(${pts[i][0]},${pts[i][1]})，dx=${dx} dy=${dy}`);
      if (dx === 0 && dy === 0)
        err(`${line.name} 相鄰點重合：${pts[i-1][2]} 與 ${pts[i][2]}`);
    }
  }
}
// 5. 相對地理方位（兩站都已建置才檢查）
const one = name => {
  const arr = byName[name];
  if (!arr) return null;
  if (arr.length > 1) warn(`站名「${name}」出現 ${arr.length} 次`);
  return arr[0];
};
for (const [na, op, nb] of GEO){
  const a = one(na), b = one(nb);
  if (!a || !b) continue;
  const [axis, cmp] = [op[0], op[1]];
  const va = a[axis], vb = b[axis];
  const ok = cmp === '<' ? va < vb : va > vb;
  if (!ok) err(`地理方位錯誤：${na}.${axis}(${va}) 應 ${cmp} ${nb}.${axis}(${vb})`);
}
// 6. 未被任何線引用的站
const used = new Set(LINES.flatMap(l => l.segments.flat().filter(p => typeof p === 'string')));
for (const s of STATIONS)
  if (!used.has(s.id) && s.enabled !== false) warn(`站 ${s.name}(${s.id}) 未被任何線引用`);

/* ============ 總結 ============ */
const total = STATIONS.length;
console.log(`\n檢查完成：${LINES.length} 條線、${total} 站（已建置）`);
console.log(errors ? `✗ ${errors} 個錯誤、${warns} 個警告` : `✓ 全部通過（${warns} 個警告）`);
process.exit(errors ? 1 : 0);
