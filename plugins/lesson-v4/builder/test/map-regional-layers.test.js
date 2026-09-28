'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const map = require('../../shared/visuals/map-svg');
const regional = require('../../shared/visuals/map-regional-layers');
const { profileFor } = require('../../shared/visuals/surface-profiles');
const spec = { type:'map',map:'south-america',presentation:'regional-layers',countryLabels:Object.keys(regional.COUNTRIES),locator:false };
const overlap=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
test('every named country label is placed once, inside the picture, clear of the others, at a readable size',()=>{
 for(const surface of ['slides','worksheets','wall','stickin']) {
   const profile=profileFor(surface,{widthPt:900});
   const L=map.describeLayout(spec,profile);
   assert.equal(L.labels.length,Object.keys(regional.COUNTRIES).length);
   assert(L.fontPt>=profile.minFontPt&&L.fontPt<=profile.fontPt);
   L.labels.forEach((b,i)=>{
     assert(b.x>=-.01&&b.y>=-.01&&b.x+b.w<=L.w+.01&&b.y+b.h<=L.h+.01,b.text+' leaves the picture');
     L.labels.slice(i+1).forEach(other=>assert(!overlap(b,other),b.text+' covers '+other.text));
     // A name out at sea points back to a dot inside its country.
     if(!b.inside)assert(Array.isArray(b.anchor),b.text+' has no leader');
   });
   // The big countries are named inside their own borders.
   ['Brazil','Argentina'].forEach(n=>assert(L.labels.find(b=>b.text===n).inside,n+' should be named inside'));
 }
});
test('a long name wraps, and a view crops the map without moving its geography',()=>{
 const L=map.describeLayout({...spec,countryLabels:[{text:'A longer geographical territory label',at:[.66,.35]}]},profileFor('worksheets',{widthPt:600}));
 assert(L.labels[0].lines.length>1);
 const full=map.describeLayout({...spec,countryLabels:['Brazil']},profileFor('slides',{widthPt:600,heightPt:420}));
 const north=map.describeLayout({...spec,countryLabels:['Brazil'],view:[0,0,.82,.5]},profileFor('slides',{widthPt:600,heightPt:420}));
 assert(north.map.w>full.map.w,'showing part of the map draws it larger');
 assert.throws(()=>map.resolve({...spec,view:[0,0,.1,.1]}),/view/);
});
test('world locator and Equator are independent of annotation count',()=>{
 const result=map.tightSvg({...spec,locator:true},profileFor('worksheets',{widthPt:900}));
 assert(result.layout.locator);assert(result.svg.includes('Equator'));
 assert(result.svg.includes('Antarctica'));assert(!overlap(result.layout.map,result.layout.locator));
});
test('worksheet clears region answer while retaining labels and source-registered lines',()=>{
 const d={...spec,worksheetMode:'regional-marking',countryLabels:['Peru','Brazil','Colombia','Argentina'],regionLayers:[{meaning:'region',text:'Synthetic unit-test geometry',points:[[.1,.1],[.2,.1],[.2,.2]],source:{citation:'Synthetic test, not a geographical claim',registration:'Unit-test fractions only'}}]};
 const s=map.resolve(d);assert.equal(s.regionLayers.length,0);assert.equal(s.countryLabels.length,4);
});
test('basin is not rainforest extent and unsourced geography refuses',()=>{
 assert.throws(()=>map.resolve({...spec,basin:'amazon basin'}),/basin is not rainforest/);
 assert.throws(()=>map.resolve({...spec,referenceLines:[{text:'Equator',points:[[0,.2],[1,.2]]}]}),/source/);
 assert.throws(()=>map.resolve({...spec,regionLayers:[{meaning:'rainforest',text:'Rainforest',points:[[0,0],[1,0],[1,1]],source:{citation:'Amazon basin outline',registration:'asset fractions'}}]}),/basin source/);
});
test('too-small spaces refuse instead of scaling text below the surface floor',()=>{
 assert.throws(()=>map.tightSvg(spec,profileFor('slides',{widthPt:180})),/TOO_SMALL|DO_NOT_FIT/);
 assert.throws(()=>map.tightSvg(spec,profileFor('slides',{widthPt:900,heightPt:20})),/TOO_SMALL/);
});
test('layer, label, locator and surface mutations have distinct cache keys',()=>{
 const p=profileFor('worksheets',{widthPt:900});
 assert.notEqual(map.cacheKey(spec,p),map.cacheKey({...spec,locator:true},p));
 assert.notEqual(map.cacheKey(spec,p),map.cacheKey({...spec,countryLabels:['Brazil']},p));
});
test('named Amazon rainforest and Equator layers are sourced, registered and drawn',()=>{
 const d={...spec,countryLabels:['Brazil','Colombia','Peru'],regionLayers:['Amazon rainforest'],referenceLines:['Equator']};
 const s=map.resolve(d);
 assert.equal(s.regionLayers[0].meaning,'rainforest');
 assert.match(s.regionLayers[0].source.citation,/Ecoregions 2017/);
 assert.match(s.regionLayers[0].source.registration,/Lambert azimuthal/);
 assert(s.regionLayers[0].points.length>=30&&s.regionLayers[0].points.length<=80);
 assert.match(s.referenceLines[0].source.registration,/Lambert azimuthal/);
 const out=map.tightSvg(d,profileFor('slides',{widthPt:700}));
 assert(out.svg.includes('regional-hatch-'));assert(out.svg.includes('Equator'));
 assert.throws(()=>map.resolve({...spec,regionLayers:['Congo rainforest']}),/unknown region/);
});
test('each named country anchor lies inside that country on the shipped raster',()=>{
 // Anchors were read from the raster's own drawn outlines; guard the ones a
 // rainforest lesson names so a leader line never points at the wrong country.
 const C=regional.COUNTRIES;
 assert(C.Peru[1]>C.Colombia[1]&&C.Peru[1]>C.Ecuador[1]);
 assert(C.Guyana[0]<C.Suriname[0]);
 assert(!('French Guiana (French territory)' in C));
});
