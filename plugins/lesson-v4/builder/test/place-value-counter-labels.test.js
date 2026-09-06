'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { tightSvg, cacheKey, counterValue, labelledCounterGrid } = require('../../shared/visuals/place-value-chart-svg');
const { drawPlaceValueChart } = require('../src/content/place-value-chart');

const chart = () => ({columns:['Th','H','T','O'],rows:[{cells:['2','4','3','5'],counters:{Th:2,H:4,T:3,O:5},counterLabels:true}]});
function capture(data, zone={x:0,y:0,w:8,h:3}) {
  const texts=[], shapes=[];
  const slide={addText:(text,options)=>texts.push({text,options}),addShape:(shape,options)=>shapes.push({shape,options}),addTable:()=>{}};
  drawPlaceValueChart({shapes:{OVAL:'oval',RECTANGLE:'rect'}},slide,zone,data);
  return {texts,shapes};
}
test('native counters carry the correct value on every counter',()=>{
  const {texts,shapes}=capture(chart());
  for(const [label,count] of [['1000',2],['100',4],['10',3],['1',5]]) assert.equal(texts.filter(t=>t.text===label).length,count);
  assert.equal(shapes.filter(s=>s.shape==='oval').length,14);
  for(const t of texts) assert.ok(t.options.fontSize>=9);
});
test('SVG values, zero placeholders and cache identity survive',()=>{
  const data=chart();data.rows[0].counters.H=0;data.rows[0].cells[1]='0';
  const svg=tightSvg(data).svg;
  assert.equal((svg.match(/>1000<\/text>/g)||[]).length,2);
  assert.equal((svg.match(/>100<\/text>/g)||[]).length,0);
  assert.match(svg,/>0<\/text>/);
  const plain=structuredClone(data);delete plain.rows[0].counterLabels;
  assert.notEqual(cacheKey(data),cacheKey(plain));
  assert.doesNotMatch(tightSvg(plain).svg,/>1000<\/text>/);
});
test('plain chart does not gain labels',()=>{
  const data=chart();delete data.rows[0].counterLabels;
  assert.equal(capture(data).texts.length,0);
});
test('decimal values and full column names share the canonical value',()=>{
  assert.equal(counterValue('Thousands'),'1000');assert.equal(counterValue('t'),'0.1');
  assert.equal(counterValue('h'),'0.01');assert.throws(()=>counterValue('unknown'),/UNKNOWN_COLUMN/);
});
test('a label too small to read fails rather than shrinking silently',()=>{
  assert.throws(()=>labelledCounterGrid(.2,.2,9,'1000',9,1/72),/LABELS_DO_NOT_FIT/);
});
