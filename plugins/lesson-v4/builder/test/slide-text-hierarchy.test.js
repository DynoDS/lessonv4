'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { COLOURS } = require('../src/styles');
const { presentationRuns, validatePresentationSpec } = require('../src/presentation-text');
const { setTaughtWords } = require('../src/answer-text');
const { drawContent } = require('../src/content');
const { drawSlide } = require('../src/templates');
const { expandTeachLayouts } = require('../src/teach-layouts');
const { validateLesson } = require('../src/validate');
const { pictureColour } = require('../../shared/text/criteria-marks');
const PptxGenJS = require('../src/require-global')('pptxgenjs');
const JSZip = require('../src/require-global')('jszip');
const ZONE = { x: 1, y: 1, w: 8, h: 4, class: 'A' };
function captured(data) {
  const texts = [], shapes = [];
  const slide = {
    addText: (text, options) => texts.push({ text, options }),
    addShape: (type, options) => shapes.push({ type, options }),
    addImage: () => {}
  };
  drawContent(new PptxGenJS(), slide, ZONE, data, { slideIndex: 0, imageDims: {} });
  return { texts, shapes };
}
function visible(runs) { return typeof runs === 'string' ? runs : runs.map(r => r.text).join(''); }
function teach(lines) {
  return { slides: [{ template: 'teach-layout', layout: 'lead-three-cards',
    headerStyle: 'title', title: 'What changes?', lead: 'The layers protect the centre.', lines }] };
}
test('regular prose changes weight only; omitted weight keeps the previous bold contract', () => {
  const plain = { type: 'text', value: 'The same existing words.', fontSize: 30 };
  const before = captured(plain).texts[0];
  const after = captured({ ...plain, textWeight: 'regular' }).texts[0];
  assert.equal(before.options.bold, true);
  assert.equal(after.options.bold, false);
  for (const key of ['x','y','w','h','fontFace','fontSize','align','margin','fit','objectName']) {
    assert.deepEqual(after.options[key], before.options[key], key);
  }
  assert.equal(visible(after.text), plain.value);
});
test('key-line is orange and bold inside regular prose; taught words inside it remain green', () => {
  setTaughtWords(['plaque']);
  try {
    const value = 'The plaque stays on your teeth.';
    const data = { type: 'text', value, textWeight: 'regular',
      emphasis: [{ text: 'plaque stays', role: 'key-line' }] };
    const result = captured(data).texts[0];
    assert.equal(visible(result.text), value);
    const taught = result.text.find(r => r.text === 'plaque');
    assert.equal(taught.options.color, '007A3D');
    assert.equal(taught.options.bold, true);
    const orange = result.text.find(r => r.text.includes('stays'));
    assert.equal(orange.options.color, 'A94700');
    assert.equal(orange.options.bold, true);
    assert.equal(result.text.find(r => r.text === 'The ').options.bold, false);
  } finally { setTaughtWords([]); }
});
test('three separate explanation cards may each carry one orange phrase; card geometry is retained', () => {
  const values = ['You feel nothing at all.', 'The nerves can feel.', 'The hole is already deep.'];
  const original = expandTeachLayouts(teach(values));
  const styled = expandTeachLayouts(teach(values.map(value => ({ value, textWeight: 'regular',
    emphasis: [{ text: value, role: 'key-line' }] }))));
  function strip(node) {
    if (Array.isArray(node)) return node.map(strip);
    if (!node || typeof node !== 'object') return node;
    return Object.fromEntries(Object.entries(node).filter(([k]) => !['textWeight','emphasis'].includes(k)).map(([k,v]) => [k,strip(v)]));
  }
  assert.deepEqual(strip(styled), original);
});
test('one whole orange line may coexist with key-line spans; two whole orange lines still fail', () => {
  assert.doesNotThrow(() => expandTeachLayouts(teach([
    { value: 'The main point.', orange: true },
    { value: 'The next explanation.', emphasis: [{ text: 'next explanation', role: 'key-line' }] },
    'The last explanation.'
  ])));
  assert.throws(() => expandTeachLayouts(teach([
    { value: 'A.', orange: true }, { value: 'B.', orange: true }, 'C.'
  ])), /at most one whole orange/);
});
test('invalid weights and two orange spans in one card fail before rendering', () => {
  assert.match(validatePresentationSpec('Some words.', { type:'text',textWeight:'small' }), /textWeight must/);
  assert.match(validatePresentationSpec('A B', { type:'text',emphasis:[{text:'A',role:'key-line'},{text:'B',role:'key-line'}] }), /at most one key-line/);
  const check = validateLesson({ lessonName:'Invalid',slides:[{template:'body-full',title:'Test',body:{type:'text',value:'Some words.',textWeight:12}}]}, process.cwd());
  assert.ok(check.errors.some(e => /textWeight must/.test(e)));
});
test('a regular green model answer supports selective bold with the existing reveal and stress markers', () => {
  const value = '||The germs feed and **they make acid.**';
  const result = captured({type:'text',value,textWeight:'regular'}).texts[0];
  assert.equal(visible(result.text), 'The germs feed and they make acid.');
  assert.ok(result.text.every(r => r.options.color === '007A3D'));
  assert.equal(result.text.find(r => r.text === 'The germs feed and ').options.bold,false);
  assert.equal(result.text.find(r => r.text === 'they make acid.').options.bold,true);
});
test('a regular orange source supports same-colour bold without inventing another hue', () => {
  const result = captured({type:'text',value:'They go **without shoes.**',color:COLOURS.textOrange,textWeight:'regular'}).texts[0];
  assert.equal(visible(result.text),'They go without shoes.');
  assert.ok(result.text.every(r => r.options.color === 'A94700'));
  assert.equal(result.text[0].options.bold,false);
  assert.equal(result.text[1].options.bold,true);
});
test('source-text forwards regular weight and explicit source orange through the real template route', () => {
  const spec={slides:[{template:'teach-layout',layout:'source-text',headerStyle:'title',title:'The source',
    extract:{value:'They go **without shoes.**',textWeight:'regular',orange:true},
    lines:[{value:'An explanation.',orange:true}]}]};
  const expanded=expandTeachLayouts(spec).slides[0];
  const texts=[];
  drawSlide(new PptxGenJS(),{addText:(text,options)=>texts.push({text,options}),addShape:()=>{},addImage:()=>{}},expanded,{slideIndex:0,imageDims:{}});
  const result=texts.find(t=>visible(t.text)==='They go without shoes.');
  assert.ok(result);
  assert.equal(result.options.color,'A94700');
  assert.equal(result.options.bold,false);
  assert.equal(result.text[1].options.bold,true);
  assert.equal(result.text[1].options.color,'A94700');
  const plain=expandTeachLayouts({slides:[{template:'teach-layout',layout:'source-text',title:'A passage',extract:'Same words.'}]}).slides[0];
  assert.equal(plain.body.items[0].color,undefined);
});
test('same-colour stress coexists with modern vocabulary and orange emphasis', () => {
  const value='Parliament asked for a report to hear what children said.';
  const result=captured({type:'text',value,textWeight:'regular',emphasis:[
    {text:'Parliament',role:'vocabulary'}, {text:'a report',role:'stress'},
    {text:'what children said.',role:'key-line'}]}).texts[0];
  const run=(words)=>result.text.find(r=>r.text===words).options;
  assert.equal(visible(result.text),value);
  assert.deepEqual(run('a report'),{color:COLOURS.body,bold:true});
  assert.equal(run('Parliament').color,COLOURS.textGreen);
  assert.equal(run('what children said.').color,COLOURS.textOrange);
});
test('a picture-part label and matching figure fill retain the same original palette', () => {
  assert.equal(COLOURS.green,'00B050');assert.equal(COLOURS.orange,'E46C0A');
  const { describeLayout }=require('../../shared/visuals/place-value-chart-svg');
  const { profileFor }=require('../../shared/visuals/surface-profiles');
  const board=profileFor('slides',{widthPt:7.8*72,heightPt:2.8*72});
  const figure=describeLayout({columns:['T','O'],rows:[{cells:['4','5'],highlight:['T']}]},board);
  assert.equal(figure.texts.find(t=>t.role==='digit').fill,'#00B050');
  assert.equal(figure.rings[0].stroke,'#00B050');
  const result=captured({type:'text',value:'((hundreds)) and ((tens))',textWeight:'regular'}).texts[0];
  for(const word of ['hundreds','tens']) {
    const expected=pictureColour(word).replace('#','');
    assert.equal(result.text.find(r=>r.text===word).options.color,expected);
  }
  // Plain explicit figure-label/digit ink is not a semantic vocabulary marker.
  assert.equal(captured({type:'text',value:'3',color:COLOURS.green}).texts[0].options.color,COLOURS.green);
  assert.equal(captured({type:'text',value:'tens',color:COLOURS.orange}).texts[0].options.color,COLOURS.orange);
});
test('the final PPTX contains the approved ink and original font size in native text', async () => {
  const pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';
  const slide=pptx.addSlide();
  drawSlide(pptx,slide,{template:'body-full',headerStyle:'title',title:'Native text',body:{type:'text',
    value:'Plaque: some words matter.',fontSize:30,textWeight:'regular',emphasis:[
      {text:'Plaque',role:'vocabulary'},{text:'matter',role:'key-line'}]}},{slideIndex:0,imageDims:{}});
  const zip=await JSZip.loadAsync(await pptx.write({outputType:'nodebuffer'}));
  const xml=await zip.file('ppt/slides/slide1.xml').async('string');
  const runs=Array.from(xml.matchAll(/<a:r>([\s\S]*?)<\/a:r>/g),m=>m[1]);
  const regular=runs.find(r=>r.includes('<a:t>: some words </a:t>'));
  const important=runs.find(r=>r.includes('<a:t>matter</a:t>'));
  assert.ok(regular);assert.match(regular,/sz="3000"/);assert.doesNotMatch(regular,/b="1"/);
  assert.match(important,/sz="3000"/);assert.match(important,/b="1"/);assert.match(important,/A94700/);
  assert.match(xml,/007A3D/);
  assert.ok(!xml.includes('E46C0A'));
});
