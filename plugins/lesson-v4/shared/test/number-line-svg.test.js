'use strict';
// Run after installation: node --test shared/test/number-line-svg.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const helper = require('../visuals/number-line-svg');
const base = {start:'0',end:'1000',intervals:10};
test('equal geometry, exact arrows, no calculated intermediate values',()=>{
  const out=helper.tightSvg({...base,arrows:[{index:3,label:'A'}]});
  const r=out.rows[0], gap=(r.x2-r.x1)/10;
  r.ticks.forEach((t,i)=>assert.ok(Math.abs(t.x-(r.x1+gap*i))<1e-9));
  assert.equal(r.arrows[0].x,r.ticks[3].x);
  assert.deepEqual(r.labels.map(l=>l.text),['0','1000']);
  assert.ok(!out.svg.includes('>300<'));
});
test('estimation line has only endpoint ticks and clear response space',()=>{
  const out=helper.tightSvg({...base,showTicks:false,answer:{at:600},tickLabels:[{index:6,text:'600'}]});
  assert.equal((out.svg.match(/<line /g)||[]).length,3);
  assert.deepEqual(out.rows[0].labels.map(l=>l.text),['0','1000']);
  assert.ok(out.rows[0].writeBox.h>=80);
});
test('aligned comparison lines have identical endpoints and span',()=>{
  const out=helper.describeLayout({lines:[base,{start:'−20 000',end:'30 000',intervals:5}]});
  assert.equal(out.rows[0].x1,out.rows[1].x1);
  assert.equal(out.rows[0].x2,out.rows[1].x2);
  assert.ok(out.rows[0].bottom<out.rows[1].top);
});
test('long labels wrap at a readable floor inside the picture',()=>{
  const out=helper.describeLayout({start:'−100 000 000 centimetres',end:'200 000 000 centimetres',intervals:20,
    arrows:[{index:0,label:'W'},{index:1,label:'M'},{index:20,label:'Z'}]});
  for (const r of out.rows) {
    for (const b of [...r.labels,...r.arrows.map(a=>a.labelBox)]) {
      assert.ok(b.x>=0 && b.y>=0);
      assert.ok(b.x+b.w<=out.w+1e-9 && b.y+b.h<=out.h);
    }
    assert.ok(r.labels.every(l=>l.fs>=24));
    assert.ok(r.writeBox.w>0);
  }
});
test('dense arrow labels use separate measured tiers',()=>{
  const r=helper.describeLayout({...base,intervals:100,arrows:[{index:50,label:'W'},{index:51,label:'M'}]}).rows[0];
  assert.notEqual(r.arrows[0].tier,r.arrows[1].tier);
});
test('bad scales and ambiguous arrows fail clearly',()=>{
  for (const intervals of [0,-1,2.5,NaN,101]) assert.throws(()=>helper.tightSvg({...base,intervals}));
  assert.throws(()=>helper.tightSvg({...base,arrows:[{index:11,label:'A'}]}));
  assert.throws(()=>helper.tightSvg({...base,arrows:[{index:3,label:'A'},{index:3,label:'B'}]}));
  assert.throws(()=>helper.tightSvg({...base,start:''}));
  assert.throws(()=>helper.tightSvg({lines:[base,base,base]}));
});
test('only explicitly supplied teaching labels can print',()=>{
  const out=helper.tightSvg({...base,questionState:false,tickLabels:[{index:5,text:'five hundred'}]});
  assert.deepEqual(out.rows[0].labels.map(l=>l.text),['0','1000','five hundred']);
  assert.notEqual(helper.cacheKey(base),helper.cacheKey({...base,showTicks:false}));
});
test('a given interior label, a blank endpoint and a caption reach the child copy; an unmarked label does not',()=>{
  // A Year 4 line gave 9,500 and 9,800 and left 10,000 for the child. The piece
  // could print only its endpoints, so it gave the answer and dropped the given.
  const out=helper.tightSvg({start:'9,500',end:'10,000',endBlank:true,intervals:5,questionState:true,
    tickLabels:[{index:3,text:'9,800',given:true},{index:4,text:'9,900'}],caption:'Each interval is worth 100.'});
  const texts=out.rows[0].labels.map(l=>l.text);
  assert.deepEqual(texts,['9,500','9,800']);
  assert.ok(!out.svg.includes('>10,000<') && !out.svg.includes('>9,900<'));
  assert.ok(out.svg.includes('>Each interval is worth 100.<'));
  assert.ok(out.rows[0].captionBox.y+out.rows[0].captionBox.h<=out.h);
});
