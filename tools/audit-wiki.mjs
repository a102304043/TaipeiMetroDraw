// 稽核 wiki-map.json：列出所有「非預設解析」與其描述，供人工確認是否錯配
import { readFileSync } from 'node:fs';
const map = JSON.parse(readFileSync(new URL('./wiki-map.json', import.meta.url), 'utf-8'));
for (const [name, v] of Object.entries(map)){
  const isDefault = v.title === `${name}站`;
  const flag = !isDefault ? '★' : (v.desc && !/捷運|輕軌/.test(v.desc) ? '？' : ' ');
  if (flag !== ' ') console.log(`${flag} ${name} → ${v.title}｜${v.desc || '(無描述)'}`);
}
