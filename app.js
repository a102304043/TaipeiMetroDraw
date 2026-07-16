
(() => {
'use strict';

/* ============================================================
   §1 DATA — 路線與站點資料
   座標系：1500x1800、網格 U=50、座標吸附 25 的倍數
   station.id ＝ codes 第一個站碼的小寫（實體站唯一）
   dir ＝ 站名 label 的 8 方位
   （目前為試點：文湖線＋板南線；其餘 8 線於 Step 6 補入）
   ============================================================ */
const STATIONS = [
  // --- 文湖線 BR（南段：動物園 → 忠孝復興） ---
  {id:'br01', name:'動物園',       x:1250, y:1375, codes:{BR:'BR01'}, dir:'E'},
  {id:'br02', name:'木柵',         x:1200, y:1325, codes:{BR:'BR02'}, dir:'E'},
  {id:'br03', name:'萬芳社區',     x:1150, y:1275, codes:{BR:'BR03'}, dir:'E'},
  {id:'br04', name:'萬芳醫院',     x:1100, y:1225, codes:{BR:'BR04'}, dir:'E'},
  {id:'br05', name:'辛亥',         x:1050, y:1175, codes:{BR:'BR05'}, dir:'E'},
  {id:'br06', name:'麟光',         x:1050, y:1100, codes:{BR:'BR06'}, dir:'E'},
  {id:'br07', name:'六張犁',       x:1050, y:1025, codes:{BR:'BR07'}, dir:'E'},
  {id:'br08', name:'科技大樓',     x:1050, y:950,  codes:{BR:'BR08'}, dir:'E'},
  {id:'r05',  name:'大安',         x:1050, y:875,  codes:{R:'R05', BR:'BR09'}, dir:'E'},
  {id:'br10', name:'忠孝復興',     x:1050, y:800,  codes:{BR:'BR10', BL:'BL15'}, dir:'SE'},
  // --- 文湖線 BR（北段：南京復興 → 南港展覽館） ---
  {id:'g16',  name:'南京復興',     x:1050, y:725,  codes:{G:'G16', BR:'BR11'}, dir:'E'},
  {id:'br12', name:'中山國中',     x:1050, y:650,  codes:{BR:'BR12'}, dir:'E'},
  {id:'br13', name:'松山機場',     x:1050, y:575,  codes:{BR:'BR13'}, dir:'E'},
  {id:'br14', name:'大直',         x:1100, y:525,  codes:{BR:'BR14'}, dir:'NW'},
  {id:'br15', name:'劍南路',       x:1150, y:475,  codes:{BR:'BR15'}, dir:'N'},
  {id:'br16', name:'西湖',         x:1225, y:475,  codes:{BR:'BR16'}, dir:'N'},
  {id:'br17', name:'港墘',         x:1300, y:475,  codes:{BR:'BR17'}, dir:'N'},
  {id:'br18', name:'文德',         x:1375, y:475,  codes:{BR:'BR18'}, dir:'N'},
  {id:'br19', name:'內湖',         x:1450, y:500,  codes:{BR:'BR19'}, dir:'W'},
  {id:'br20', name:'大湖公園',     x:1450, y:550,  codes:{BR:'BR20'}, dir:'W'},
  {id:'br21', name:'葫洲',         x:1450, y:600,  codes:{BR:'BR21'}, dir:'W'},
  {id:'br22', name:'東湖',         x:1450, y:650,  codes:{BR:'BR22'}, dir:'W'},
  {id:'br23', name:'南港軟體園區', x:1450, y:700,  codes:{BR:'BR23'}, dir:'W'},
  {id:'bl23', name:'南港展覽館',   x:1450, y:750,  codes:{BL:'BL23', BR:'BR24'}, dir:'W'},
  // --- 板南線 BL（西南段：頂埔 → 江子翠，45° 斜線） ---
  {id:'bl01', name:'頂埔',         x:200,  y:1200, codes:{BL:'BL01', LB:'LB01'}, dir:'E'},
  {id:'bl02', name:'永寧',         x:250,  y:1150, codes:{BL:'BL02'}, dir:'E'},
  {id:'bl03', name:'土城',         x:300,  y:1100, codes:{BL:'BL03'}, dir:'E'},
  {id:'bl04', name:'海山',         x:350,  y:1050, codes:{BL:'BL04'}, dir:'E'},
  {id:'bl05', name:'亞東醫院',     x:400,  y:1000, codes:{BL:'BL05'}, dir:'E'},
  {id:'bl06', name:'府中',         x:450,  y:950,  codes:{BL:'BL06'}, dir:'E'},
  {id:'bl07', name:'板橋',         x:500,  y:900,  codes:{BL:'BL07', Y:'Y16'}, dir:'E'},
  {id:'bl08', name:'新埔',         x:550,  y:850,  codes:{BL:'BL08'}, dir:'E'},
  {id:'bl09', name:'江子翠',       x:600,  y:800,  codes:{BL:'BL09'}, dir:'N'},
  // --- 板南線 BL（市中心：龍山寺 → 忠孝復興，y=800 橫貫） ---
  {id:'bl10', name:'龍山寺',       x:675,  y:800,  codes:{BL:'BL10'}, dir:'S'},
  {id:'g12',  name:'西門',         x:750,  y:800,  codes:{G:'G12', BL:'BL11'}, dir:'S'},
  {id:'r10',  name:'台北車站',     x:825,  y:800,  codes:{R:'R10', BL:'BL12', A:'A1'}, dir:'S'},
  {id:'bl13', name:'善導寺',       x:900,  y:800,  codes:{BL:'BL13'}, dir:'N'},
  {id:'o07',  name:'忠孝新生',     x:975,  y:800,  codes:{O:'O07', BL:'BL14'}, dir:'S'},
  // --- 板南線 BL（東段：忠孝敦化 → 南港展覽館） ---
  {id:'bl16', name:'忠孝敦化',     x:1100, y:800,  codes:{BL:'BL16'}, dir:'N'},
  {id:'bl17', name:'國父紀念館',   x:1150, y:800,  codes:{BL:'BL17'}, dir:'S'},
  {id:'bl18', name:'市政府',       x:1200, y:800,  codes:{BL:'BL18'}, dir:'N'},
  {id:'bl19', name:'永春',         x:1250, y:800,  codes:{BL:'BL19'}, dir:'S'},
  {id:'bl20', name:'後山埤',       x:1300, y:800,  codes:{BL:'BL20'}, dir:'N'},
  {id:'bl21', name:'昆陽',         x:1350, y:800,  codes:{BL:'BL21'}, dir:'S'},
  {id:'bl22', name:'南港',         x:1400, y:800,  codes:{BL:'BL22'}, dir:'S'},
];

/* segments 元素：station id 或 [x,y] 純轉折點 */
const LINES = [
  {id:'BR', name:'文湖線', width:9, segments:[[
    'br01','br02','br03','br04','br05','br06','br07','br08','r05','br10',
    'g16','br12','br13','br14','br15','br16','br17','br18',[1425,475],
    'br19','br20','br21','br22','br23','bl23',
  ]]},
  {id:'BL', name:'板南線', width:9, segments:[[
    'bl01','bl02','bl03','bl04','bl05','bl06','bl07','bl08','bl09',
    'bl10','g12','r10','bl13','o07','br10',
    'bl16','bl17','bl18','bl19','bl20','bl21','bl22','bl23',
  ]]},
];

/* 每線站數 assert（與計畫附錄比對；試點先驗證 BR/BL） */
const EXPECTED_COUNTS = {BR:24, BL:23};

/* --- 派生資料（init 一次） --- */
const S = Object.fromEntries(STATIONS.map(s => [s.id, s]));
for (const line of LINES){
  const ids = [];
  for (const seg of line.segments)
    for (const p of seg)
      if (typeof p === 'string' && !ids.includes(p)) ids.push(p);
  line.stationIds = ids;
  for (const id of ids){
    const st = S[id];
    if (!st) { console.error(`資料錯誤：找不到站 ${id}（${line.id}）`); continue; }
    (st.lines ??= []).push(line.id);
  }
}
for (const s of STATIONS) s.isTransfer = (s.lines?.length ?? 0) > 1;
for (const [lid, n] of Object.entries(EXPECTED_COUNTS)){
  const line = LINES.find(l => l.id === lid);
  console.assert(line && line.stationIds.length === n,
    `站數 assert 失敗：${lid} 應為 ${n}，實際 ${line?.stationIds.length}`);
}

/* ============================================================
   §2 Store — localStorage 包裝（Safari 無痕降級記憶體模式）
   ============================================================ */
const Store = (() => {
  const KEY = 'tmd.v1';
  const DEFAULTS = {
    version: 1,
    settings: { excludeVisited:false, excludeTaoyuan:false, skin:'classic', mode:'auto', sound:false, vibrate:true },
    visited: [],
    history: [],
  };
  let mem = null; // localStorage 不可用時的記憶體備援
  function load(){
    if (mem) return mem;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULTS);
      const data = JSON.parse(raw);
      return { ...structuredClone(DEFAULTS), ...data, settings: { ...DEFAULTS.settings, ...(data.settings||{}) } };
    } catch { return mem = structuredClone(DEFAULTS); }
  }
  function save(data){
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch { mem = data; }
  }
  return { load, save };
})();

/* ============================================================
   §3 Geometry — 圓角折線與 bbox 工具
   ============================================================ */
function roundedPathD(pts, r = 18){
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++){
    const [x0,y0] = pts[i-1], [x1,y1] = pts[i], [x2,y2] = pts[i+1];
    const v1 = [x1-x0, y1-y0], v2 = [x2-x1, y2-y1];
    const l1 = Math.hypot(...v1), l2 = Math.hypot(...v2);
    const cross = v1[0]*v2[1] - v1[1]*v2[0];
    if (Math.abs(cross) < 1e-6) continue;      // 共線點：直接穿過
    const rr = Math.min(r, l1/2, l2/2);
    const pA = [x1 - v1[0]/l1*rr, y1 - v1[1]/l1*rr];
    const pB = [x1 + v2[0]/l2*rr, y1 + v2[1]/l2*rr];
    d += ` L ${pA[0]} ${pA[1]} Q ${x1} ${y1} ${pB[0]} ${pB[1]}`;
  }
  const [xe,ye] = pts[pts.length-1];
  d += ` L ${xe} ${ye}`;
  return d;
}

function segToPoints(seg){
  return seg.map(p => typeof p === 'string' ? [S[p].x, S[p].y] : p);
}

/* ============================================================
   §4 MapRenderer — 啟動時一次建完所有 SVG 節點
   ============================================================ */
const SVG_NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('map');
const gLines    = document.getElementById('g-lines');
const gStations = document.getElementById('g-stations');
const gLabels   = document.getElementById('g-labels');
const gDebug    = document.getElementById('g-debug');

function el(tag, attrs){
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k,v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

/* label 8 方位 → 錨點與偏移 */
const DIRS = {
  E:  {ox: 1, oy: 0,   anchor:'start',  dy:'0.35em'},
  W:  {ox:-1, oy: 0,   anchor:'end',    dy:'0.35em'},
  N:  {ox: 0, oy:-1,   anchor:'middle', dy:'0'},
  S:  {ox: 0, oy: 1,   anchor:'middle', dy:'0.9em'},
  NE: {ox: .75, oy:-.75, anchor:'start',  dy:'0'},
  NW: {ox:-.75, oy:-.75, anchor:'end',    dy:'0'},
  SE: {ox: .75, oy: .75, anchor:'start',  dy:'0.9em'},
  SW: {ox:-.75, oy: .75, anchor:'end',    dy:'0.9em'},
};

function renderMap(){
  // 線
  for (const line of LINES){
    const g = el('g', {class:'line', 'data-line':line.id});
    for (const seg of line.segments){
      g.appendChild(el('path', {
        d: roundedPathD(segToPoints(seg)),
        stroke: `var(--line-${line.id})`,
        'stroke-width': line.width,
      }));
    }
    gLines.appendChild(g);
  }
  // 站點與 label（只渲染已入線的站）
  const drawn = new Set(LINES.flatMap(l => l.stationIds));
  for (const s of STATIONS){
    if (!drawn.has(s.id)) continue;
    const gs = el('g', {class:'st', 'data-id':s.id});
    gs.appendChild(el('circle', {
      class: 'dot' + (s.isTransfer ? ' transfer' : ''),
      cx:s.x, cy:s.y, r: s.isTransfer ? 10 : 7,
      stroke: s.isTransfer ? 'var(--ink)' : `var(--line-${s.lines[0]})`,
    }));
    gs.appendChild(el('circle', {class:'hit', cx:s.x, cy:s.y, r:22}));
    gStations.appendChild(gs);

    const d = DIRS[s.dir] ?? DIRS.E;
    const o = s.isTransfer ? 18 : 14;
    const t = el('text', {
      class: 'lbl' + (s.isTransfer ? ' transfer' : ''),
      x: s.x + d.ox*o, y: s.y + d.oy*o,
      dy: d.dy, 'text-anchor': d.anchor,
      'data-id': s.id,
    });
    t.textContent = s.name;
    gLabels.appendChild(t);
  }
}

/* 內容 bbox ＋ padding → 靜態 viewBox（Step 3 將由 Camera 接管） */
function contentBBox(){
  let x0=Infinity, y0=Infinity, x1=-Infinity, y1=-Infinity;
  for (const line of LINES)
    for (const seg of line.segments)
      for (const [x,y] of segToPoints(seg)){
        x0=Math.min(x0,x); y0=Math.min(y0,y); x1=Math.max(x1,x); y1=Math.max(y1,y);
      }
  return {x:x0, y:y0, w:x1-x0, h:y1-y0};
}
function fitContent(pad = 90){
  const b = contentBBox();
  svg.setAttribute('viewBox', `${b.x-pad} ${b.y-pad} ${b.w+pad*2} ${b.h+pad*2}`);
}

/* ?debug=labels — label 重疊偵測（建檔期工具） */
function debugLabels(){
  const labels = [...gLabels.querySelectorAll('.lbl')];
  const boxes = labels.map(t => ({id:t.dataset.id, b:t.getBBox()}));
  let n = 0;
  for (let i=0;i<boxes.length;i++) for (let j=i+1;j<boxes.length;j++){
    const a=boxes[i].b, b=boxes[j].b;
    if (a.x < b.x+b.width && b.x < a.x+a.width && a.y < b.y+b.height && b.y < a.y+a.height){
      n++;
      console.warn(`label 重疊：${boxes[i].id} × ${boxes[j].id}`);
      for (const bb of [a,b])
        gDebug.appendChild(el('rect', {class:'debug-overlap', x:bb.x, y:bb.y, width:bb.width, height:bb.height}));
    }
  }
  console.info(`debug=labels：檢查 ${labels.length} 個 label，重疊 ${n} 組`);
}

/* ============================================================
   §8 UI — 模式套用與 toast
   ============================================================ */
const state = Store.load();

function applyMode(){
  document.documentElement.dataset.mode = state.settings.mode;
  document.documentElement.dataset.skin = state.settings.skin;
}

const toastEl = document.getElementById('toast');
let toastTimer = 0;
function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

/* ============================================================
   §9 init
   ============================================================ */
applyMode();
renderMap();
fitContent();
if (new URLSearchParams(location.search).get('debug') === 'labels') debugLabels();

document.getElementById('draw-btn').addEventListener('click', () => {
  toast('抽選引擎建置中，敬請期待 🚇');
});
document.getElementById('btn-history').addEventListener('click', () => toast('歷史紀錄建置中'));
document.getElementById('btn-settings').addEventListener('click', () => toast('設定建置中'));

})();
