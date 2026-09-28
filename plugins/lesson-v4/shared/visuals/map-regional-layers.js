'use strict';
// Internal extension of map-svg, never a second registered map helper.
const fs = require('fs');
const maps = require('./map-annotations');
const pixels = require('./map-pixels');
const { profileFor } = require('./surface-profiles');
const { textWidthEm } = require('../text/comic-glyph-width');
// In ems of the name size: gapEm between the map and a locator under it;
// rowEm one line of a name; minMapEm the narrowest map worth drawing;
// maxLabelEm the widest a name runs before it wraps; swatchEm the key's
// square. insetShare: the world locator's share of the picture's width.
// openPixel: how near white a raster pixel must be to count as open land or
// sea rather than a drawn line. marginEm: the most white margin beside the
// map a name out at sea may use.
const C = Object.freeze({ gapEm: .65, rowEm: 1.2, minMapEm: 7, maxLabelEm: 8, swatchEm: 1.1, insetShare: .6, maxLabels: 24, maxLayers: 12, openPixel: 200, marginEm: 6 });
// Interior anchors read against the actual 472 x 649 shipped raster: each is
// the point deepest inside that country's own drawn outline. A name is placed
// inside the country around it when it fits, and otherwise out at sea with a
// leader to it. These identify places only; they are not coastlines, borders
// or region extents. French Guiana is absent on purpose: the shipped raster
// draws no coastline for it, so its land reads as sea and a label there would
// point children at the ocean.
const COUNTRIES = Object.freeze({
 Brazil: [314/472,226/649], Colombia: [89/472,93/649], Peru: [107/472,241/649],
 Ecuador: [47/472,138/649], Bolivia: [181/472,272/649], Venezuela: [181/472,56/649],
 Guyana: [230/472,70/649], Suriname: [258/472,82/649], Argentina: [190/472,400/649],
 Chile: [148/472,338/649], Paraguay: [218/472,319/649], Uruguay: [249/472,427/649]
});

// Sourced geography for this raster, offered by name so no lesson has to trace
// (or invent) an outline. How the raster was registered: its drawn borders
// were fitted to Natural Earth 1:50m admin-0 country boundaries (public
// domain). A Lambert azimuthal equal-area projection centred 60.41W 28.25S,
// x = 515.25*X + 215.85, y = -534.89*Y + 379.49 (unit-sphere X, Y, raster
// pixels) matches them with a median error of 0 px and 90th percentile 3 px
// over 9,291 border samples; equirectangular, Mercator and Miller fits were
// 2-4 times worse. Layers are projected with that fit, then given as
// fractions of 472 x 649.
const REGISTRATION = 'Projected onto the shipped 472 x 649 south-america raster with the Lambert azimuthal equal-area fit (centre 60.41W 28.25S) found by matching the raster\'s drawn borders to Natural Earth 1:50m country boundaries (median error 0 px, 90th percentile 3 px).';
const REGIONS = Object.freeze({
 'Amazon rainforest': Object.freeze({
  meaning: 'rainforest',
  source: Object.freeze({
   citation: 'Dinerstein et al. (2017) Ecoregions 2017, RESOLVE, CC BY 4.0 (via the UNEP-WCMC Resolve_Ecoregions service). Union of the 24 lowland tropical moist forest ecoregions of Amazonia and the Guianas: Caqueta, Guianan Highlands, Guianan lowland, Guianan piedmont and Guianan freshwater swamp forests, Gurupa, Iquitos, Marajó, Monte Alegre and Purus várzea, Japurá-Solimões-Negro, Juruá-Purus, Madeira-Tapajós, Napo, Negro-Branco, Purus-Madeira, Solimões-Japurá, Southwest Amazon, Tapajós-Xingu, Tocantins/Pindare, Uatumã-Trombetas, Ucayali and Xingu-Tocantins-Araguaia moist forests, and Rio Negro campinarana. Andean montane, dry forest and savanna ecoregions are excluded. This is forest extent, not the Amazon drainage area.',
   registration: REGISTRATION + ' Gaps under 0.15 degrees closed, clipped to the raster\'s drawn land (so French Guiana, which the raster does not draw, is left out), simplified to 66 points (4.7% area difference from the source).'
  }),
  points: Object.freeze([
   [0.1071,0.2601],[0.1403,0.2842],[0.133,0.2988],[0.1547,0.325],[0.1725,0.3249],[0.1876,0.3611],
   [0.2101,0.3726],[0.2122,0.3521],[0.216,0.3696],[0.236,0.359],[0.285,0.3826],[0.307,0.3752],
   [0.3635,0.423],[0.402,0.4314],[0.4007,0.4104],[0.4223,0.4034],[0.4182,0.3883],[0.4319,0.3925],
   [0.4268,0.3804],[0.4442,0.3892],[0.441,0.3697],[0.4648,0.3461],[0.5119,0.3417],[0.509,0.3274],
   [0.5357,0.3253],[0.5507,0.3454],[0.5697,0.3337],[0.5064,0.3088],[0.5174,0.2939],[0.4942,0.2743],
   [0.5697,0.308],[0.5827,0.3327],[0.6025,0.3148],[0.6469,0.3338],[0.6553,0.2956],[0.672,0.3006],
   [0.6635,0.3114],[0.6841,0.2967],[0.6936,0.2647],[0.7177,0.2665],[0.7668,0.2281],[0.7138,0.2006],
   [0.6672,0.2252],[0.674,0.2125],[0.6526,0.2154],[0.6436,0.1998],[0.6228,0.208],[0.6088,0.207],
   [0.664,0.1711],[0.6375,0.1281],[0.6091,0.1533],[0.5837,0.1533],[0.5922,0.1064],[0.5213,0.1063],
   [0.5066,0.0901],[0.4918,0.0941],[0.4862,0.0747],[0.4224,0.063],[0.403,0.0756],[0.422,0.0815],
   [0.3516,0.0802],[0.31,0.1164],[0.2293,0.1489],[0.1798,0.1537],[0.1409,0.1779],[0.1145,0.2117]
  ].map(p => Object.freeze(p)))
 })
});
const LINES = Object.freeze({
 Equator: Object.freeze({
  source: Object.freeze({
   citation: 'Latitude 0 degrees, sampled every 3 degrees of longitude from 81W to 33W: from the Pacific, through Ecuador, Colombia and Brazil, and out across the Atlantic to the edge of the map.',
   registration: REGISTRATION + ' The projection curves the parallel slightly, so it is a 17-point line rather than a straight rule.'
  }),
  points: Object.freeze([
   [0.0554,0.2024],[0.1133,0.197],[0.1716,0.1924],[0.2301,0.1887],[0.2887,0.1859],[0.3475,0.1839],
   [0.4064,0.1828],[0.4654,0.1824],[0.5243,0.183],[0.5832,0.1844],[0.6419,0.1866],[0.7006,0.1897],
   [0.759,0.1936],[0.8171,0.1984],[0.875,0.204],[0.9326,0.2105],[0.9897,0.2178]
  ].map(p => Object.freeze(p)))
 })
});
const CONTINENTS = [
 {text:'North America',at:[.2,.25]}, {text:'South America',at:[.33,.65]},
 {text:'Europe',at:[.52,.23]}, {text:'Africa',at:[.54,.52]},
 {text:'Asia',at:[.73,.3]}, {text:'Australia',at:[.85,.73]}, {text:'Antarctica',at:[.53,.93]}
];
const esc = v => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function fail(s) { throw new Error('MAP_LAYERS_INVALID: '+s); }
function pair(v) { if (!Array.isArray(v)||v.length!==2||v.some(n=>!Number.isFinite(n)||n<0||n>1)) fail('positions must be picture fractions'); return v.slice(); }
function list(v,name,max) { if(v==null)return []; if(!Array.isArray(v)||v.length>max)fail(name+' accepts at most '+max+' entries'); return v; }
function text(v) { if(typeof v!=='string'||!v.trim()||v.length>100)fail('labels need 1-100 characters'); return v.trim(); }
function source(v) { if(!v||typeof v!=='object'||!v.citation||!v.registration)fail('each geographic layer needs source.citation and source.registration explaining alignment to this raster'); return v; }
function resolve(d) {
 if(d.map!=='south-america')fail('regional-layers currently requires south-america');
 if(d.basin||d.selectedCountry)fail('use explicit independent layers; basin is not rainforest extent');
 const countryLabels=list(d.countryLabels,'countryLabels',C.maxLabels).map(v=>{
   if(typeof v==='string') { if(!COUNTRIES[v])fail('unknown country '+v); return {text:v,at:COUNTRIES[v]}; }
   return {text:text(v.text),at:pair(v.at)};
 });
 const mapLabels=list(d.mapLabels,'mapLabels',C.maxLabels).map(v=>({text:text(v.text),at:pair(v.at)}));
 // A name picks a sourced layer shipped for this raster; an object brings its
 // own trace and must say where it came from and how it was aligned.
 const named=(v,table,kind)=>{
   if(typeof v!=='string')return v;
   if(!table[v])fail('unknown '+kind+' '+v+'; named '+kind+'s are: '+Object.keys(table).join(', '));
   return {text:v,...table[v],points:table[v].points.map(p=>p.slice())};
 };
 const referenceLines=list(d.referenceLines,'referenceLines',C.maxLayers).map(v=>named(v,LINES,'line')).map(v=>{
   source(v.source); if(!Array.isArray(v.points)||v.points.length<2)fail('reference lines need at least two points');
   return {...v,text:text(v.text),points:v.points.map(pair)};
 });
 const regionLayers=list(d.regionLayers,'regionLayers',C.maxLayers).map(v=>named(v,REGIONS,'region')).map(v=>{
   source(v.source); if(v.meaning!=='rainforest'&&v.meaning!=='region')fail('region meaning must be rainforest or region');
   if(v.meaning==='rainforest'&&/basin/i.test(JSON.stringify(v.source)))fail('a basin source cannot establish rainforest extent');
   if(!Array.isArray(v.points)||v.points.length<3)fail('regions need at least three traced points');
   return {...v,text:text(v.text),points:v.points.map(pair)};
 });
 // view: the part of the map to show, [left, top, right, bottom] as fractions
 // of the raster, so a lesson about the Amazon can show northern South America
 // large enough for its country names instead of the whole continent small.
 let view=[0,0,1,1];
 if(d.view!=null){ if(!Array.isArray(d.view)||d.view.length!==4)fail('view is [left, top, right, bottom] as fractions of the map');
   view=[...pair(d.view.slice(0,2)),...pair(d.view.slice(2))];
   if(view[2]-view[0]<.2||view[3]-view[1]<.2)fail('view must show at least a fifth of the map each way'); }
 const worksheet=d.worksheetMode==='regional-marking';
 // The world locator is asked for, not assumed: it takes a third of the space
 // from the map it explains.
 return {mode:'regional-layers',key:d.map,view,countryLabels,mapLabels,referenceLines,regionLayers:worksheet?[]:regionLayers,locator:d.locator===true,worksheet,annotations:worksheet?[]:maps.resolveAnnotations(d),entry:maps.mapEntry(d.map)};
}
function wrap(s,w,T,bold) {
 const rows=[]; let row='';
 for(const word of s.split(/\s+/)) {
   if(textWidthEm(word,bold)*T>w)return null;
   const next=row?row+' '+word:word;
   if(row&&textWidthEm(next,bold)*T>w){rows.push(row);row=word;}else row=next;
 }
 if(row)rows.push(row);return rows;
}

// The raster's own areas: every run of open pixels bounded by a drawn line is
// one area (a country, or the sea, which is the area touching the corner).
// Read once from the shipped file, so a name is tested against the borders
// the child actually sees rather than against anyone's idea of them.
let AREAS=null;
function areas() {
 if(AREAS)return AREAS;
 const img=pixels.decodePng(fs.readFileSync(maps.assetPathFor('south-america')));
 const {width:w,height:h,data}=img, ch=data.length/(w*h);
 const id=new Int32Array(w*h).fill(-1);
 for(let i=0;i<w*h;i++){const o=i*ch;if((data[o]+data[o+1]+data[o+2])/3>=C.openPixel&&(ch<4||data[o+3]>128))id[i]=0;}
 let next=1;const q=new Int32Array(w*h);
 for(let s=0;s<w*h;s++){ if(id[s]!==0)continue; let head=0,tail=0;q[tail++]=s;id[s]=next;
   while(head<tail){const i=q[head++],x=i%w;
     for(const j of [x>0?i-1:-1,x<w-1?i+1:-1,i-w,i+w]) if(j>=0&&j<w*h&&id[j]===0){id[j]=next;q[tail++]=j;}}
   next++; }
 AREAS={w,h,id,sea:id[0]};return AREAS;
}
// Whether every pixel of a raster-pixel box is in area `want`. Outside the
// shown view is the picture's white margin, which counts as open sea.
function boxIn(A,b,want,v) {
 const x0=Math.floor(b.x),y0=Math.floor(b.y),x1=Math.ceil(b.x+b.w),y1=Math.ceil(b.y+b.h);
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   if(x<v[0]||y<v[1]||x>=v[2]||y>=v[3]){if(want!==A.sea)return false;continue;}
   if(A.id[y*A.w+x]!==want)return false;}
 return true;
}
const hit=(a,b,pad)=>a.x<b.x+b.w+pad&&b.x<a.x+a.w+pad&&a.y<b.y+b.h+pad&&b.y<a.y+a.h+pad;
// Where a leader from `a` meets box `b`: the nearest point of the box.
const leaderEnd=(a,b)=>[Math.min(Math.max(a[0],b.x),b.x+b.w),Math.min(Math.max(a[1],b.y),b.y+b.h)];
const cross=(p,q,r,t)=>{const d=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 return d(p,q,r)*d(p,q,t)<0&&d(r,t,p)*d(r,t,q)<0;};
// Whether segment p-q passes through box b (shrunk a little, so a leader may
// start at its own label's edge).
const through=(p,q,b)=>{const x0=b.x+.5,y0=b.y+.5,x1=b.x+b.w-.5,y1=b.y+b.h-.5;if(x1<=x0||y1<=y0)return false;
 const inside=a=>a[0]>x0&&a[0]<x1&&a[1]>y0&&a[1]<y1; if(inside(p)||inside(q))return true;
 const c=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];return c.some((a,i)=>cross(p,q,a,c[(i+1)%4]));};

// Names go where an atlas puts them. A country's name sits inside its own
// borders when it fits there (with a white halo so it reads over shading),
// never across one; a country too small for its name is named out in the sea
// or the margin, on a leader to a dot inside it. A line is named on the line,
// at sea if there is room. A shaded region is named in a key in open sea, or
// under the map. Returns { failed: name } when a name cannot be placed at
// this size.
function placeNames(s,p,T,m,view,A,below,margin) {
 const k=m.w/((view[2]-view[0])*A.w);                 // points per raster pixel
 const toPt=b=>({x:m.x+(b.x/A.w-view[0])*A.w*k,y:m.y+(b.y/A.h-view[1])*A.h*k,w:b.w*k,h:b.h*k});
 const vx0=view[0]*A.w,vy0=view[1]*A.h,vx1=view[2]*A.w,vy1=view[3]*A.h;
 const V=[vx0,vy0,vx1,vy1];
 const inView=b=>b.x>=vx0&&b.y>=vy0&&b.x+b.w<=vx1&&b.y+b.h<=vy1;
 // Names out at sea may use the white margin the slot leaves beside the map.
 const inBounds=b=>b.x>=vx0-margin.l/k&&b.y>=vy0-margin.t/k&&b.x+b.w<=vx1+margin.r/k&&b.y+b.h<=vy1+margin.b/k;
 const row=C.rowEm*T, pad=.25*T, placed=[], out=[], leaders=[];
 const size=(t)=>{const lines=wrap(t,C.maxLabelEm*T,T,p.bold);if(!lines)return null;
   return {lines,w:(Math.max(...lines.map(l=>textWidthEm(l,p.bold)*T))+.3*T)/k,h:(lines.length*row)/k};};
 const free=(b)=>{const q=toPt(b);return !placed.some(o=>hit(o,q,pad));};
 const ring=(cx,cy,sz,ok,rMin)=>{ // nearest free spot around (cx,cy)
   for(let r=rMin;r<.6*A.w;r+=Math.max(2,.25*sz.h)){
     const steps=Math.max(16,Math.round(r/3));
     for(let i=0;i<steps;i++){const a=2*Math.PI*i/steps;
       const b={x:cx+r*Math.cos(a)-sz.w/2,y:cy+r*Math.sin(a)-sz.h/2,w:sz.w,h:sz.h};
       if(inBounds(b)&&ok(b)&&free(b))return b;}
   }
   return null;
 };
 const names=[...s.countryLabels.map(v=>({...v,kind:'country'})),...s.mapLabels.map(v=>({...v,kind:'free'}))];
 // Inside first, largest countries first, so the big names settle before the
 // sea fills with leaders.
 const sized=names.map(v=>({...v,sz:size(v.text),ax:v.at[0]*A.w,ay:v.at[1]*A.h}));
 if(sized.some(v=>!v.sz))return {failed:sized.find(v=>!v.sz).text};
 const later=[];
 for(const v of sized){
   const area=A.id[Math.round(v.ay)*A.w+Math.round(v.ax)];
   let b=null;
   // Room all round (the width of the name's halo), so a name inside a
   // country never touches its border.
   const e=Math.max(1,.07*T/k);
   if(v.kind==='country'&&area>0&&area!==A.sea)b=ring(v.ax,v.ay,v.sz,x=>inView(x)&&boxIn(A,{x:x.x-e,y:x.y-e,w:x.w+2*e,h:x.h+2*e},area,V),0);
   if(v.kind==='free')b=ring(v.ax,v.ay,v.sz,x=>boxIn(A,x,A.sea,V),0);
   if(b&&v.kind==='country'){ // keep a name near its middle, not wandering
     const d=Math.hypot(b.x+b.w/2-v.ax,b.y+b.h/2-v.ay); if(d>Math.max(b.w,b.h)*.9)b=null; }
   if(b){const q=toPt(b);placed.push(q);out.push({text:v.text,lines:v.sz.lines,...q,inside:true});}
   else later.push({...v,area});
 }
 // A line's name sits on the line, as near the middle as it can.
 // It is placed before any name that has to go out to sea, which can move.
 const lineNames=[];
 for(const v of s.referenceLines){
   const sz=size(v.text);if(!sz)return {failed:v.text};
   const raw=v.points.map(a=>[a[0]*A.w,a[1]*A.h]), pts=[];
   for(let i=1;i<raw.length;i++){const [a,b]=[raw[i-1],raw[i]],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2));
     for(let j=0;j<n;j++)pts.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);}
   pts.push(raw[raw.length-1]);
   for(let i=pts.length-1;i>=0;i--)if(pts[i][0]<vx0||pts[i][0]>vx1)pts.splice(i,1);
   const order=pts.map((a,i)=>i).sort((i,j)=>Math.abs(pts[i][0]-(vx0+vx1)/2)-Math.abs(pts[j][0]-(vx0+vx1)/2));
   // Out at sea if there is room; otherwise over the land beside the line,
   // haloed, as an atlas prints it.
   let b=null;
   for(const atSea of [true,false])for(const i of order){for(const dy of [-1,1])for(const f of [.5,.25,.75]){if(b)break;const a=pts[i];
     const c={x:a[0]-sz.w*f,y:dy<0?a[1]-sz.h-.15*T/k:a[1]+.15*T/k,w:sz.w,h:sz.h};
     if(inView(c)&&(!atSea||boxIn(A,c,A.sea,V))&&free(c)){b=c;break;}} if(b)break;}
   if(!b)return {failed:v.text};
   const q=toPt(b);placed.push(q);lineNames.push({text:v.text,lines:sz.lines,...q,line:true});
 }
 for(const v of later){
   if(v.kind!=='country'||!(v.area>0))return {failed:v.text};
   // A leader may not cross another leader or run through another name, and a
   // name may not sit on another's leader: crossed lines send a child to the
   // wrong country.
   const anchor=[m.x+(v.at[0]-view[0])/(view[2]-view[0])*m.w,m.y+(v.at[1]-view[1])/(view[3]-view[1])*m.h];
   const clear=x=>{const q=toPt(x),e=leaderEnd(anchor,q);
     return !leaders.some(l=>cross(anchor,e,l[0],l[1])||through(l[0],l[1],q))&&!placed.some(o=>through(anchor,e,o));};
   const b=ring(v.ax,v.ay,v.sz,x=>boxIn(A,x,A.sea,V)&&clear(x),Math.max(v.sz.w,v.sz.h)/2);
   if(!b)return {failed:v.text};
   const q=toPt(b);placed.push(q);leaders.push([anchor,leaderEnd(anchor,q)]);
   out.push({text:v.text,lines:v.sz.lines,...q,inside:false,anchor});
 }
 // The key, in open sea or the margin: bottom right first, where the
 // Atlantic is widest.
 // When the sea has no room, in a strip under the map instead.
 const sw=C.swatchEm*T, keys=[]; let kx=m.x;
 for(const v of s.regionLayers){
   const lines=wrap(v.text,C.maxLabelEm*T,T,p.bold);if(!lines)return {failed:v.text};
   const wPt=sw+.4*T+Math.max(...lines.map(l=>textWidthEm(l,p.bold)*T))+.4*T, hPt=Math.max(sw,lines.length*row)+.4*T;
   if(below){keys.push({text:v.text,lines,x:kx,y:m.y+m.h+.4*T,w:wPt,h:hPt});kx+=wPt+T;continue;}
   const sz={w:wPt/k,h:hPt/k};let b=null;
   const X0=vx0-margin.l/k,Y0=vy0-margin.t/k,X1=vx1+margin.r/k,Y1=vy1+margin.b/k;
   for(let y=Y1-sz.h;y>=Y0&&!b;y-=2)for(let x=X1-sz.w;x>=X0;x-=2){const c={x,y,...sz};if(boxIn(A,c,A.sea,V)&&free(c)&&!leaders.some(l=>through(l[0],l[1],toPt(c)))){b=c;break;}}
   if(!b)return {failed:v.text+" key"};
   const q=toPt(b);placed.push(q);keys.push({text:v.text,lines,...q});
 }
 return {labels:out,lineNames,keys};
}

function build(d,p,base) {
 p=typeof p==='string'?profileFor(p,{widthPt:500}):p;
 const s=resolve(d), W=p.widthPt, A=areas(), view=s.view;
 const aspect=((view[3]-view[1])*A.h)/((view[2]-view[0])*A.w);
 const ceiling=Math.min(p.heightPt||Infinity,d.heightMm?d.heightMm*72/25.4:Infinity);
 const gap=C.gapEm*p.minFontPt;
 // The map as large as the space allows: its shape is fixed, so it is the
 // width or the depth of the slot that runs out first.
 // The world locator goes beside the map when the slot is wider than the map
 // needs (a board slot usually is), and under it otherwise (a sheet).
 let locator=null, inset=null, mapW=W, Wm=W;
 if(s.locator){
   const worldAt=iw=>base({type:'map',map:'world-with-antarctica',presentation:'seven-continent-world',continentLabels:CONTINENTS,showEquator:true,showCompass:false},{...p,widthPt:iw,heightPt:null});
   const spare=Number.isFinite(ceiling)?W-ceiling/aspect-C.gapEm*p.fontPt:0;
   const beside=Math.min(spare,W*C.insetShare*.7);
   let ok=false;
   if(beside>=C.minMapEm*p.fontPt*1.6){try{inset=worldAt(beside);ok=inset.h<=ceiling;}catch(e){ok=false;}}
   if(ok){locator={w:beside,h:inset.h,beside:true};Wm=W-beside-gap;}
   else{inset=worldAt(W*C.insetShare);locator={w:W*C.insetShare,h:inset.h,beside:false};}
 }
 // Names at the surface's reading size if they fit, down to its floor if they
 // must: they are read from the back row. The key goes in open sea if there
 // is room, and otherwise in a strip under a slightly smaller map. A name
 // inside its own country reads better than a bigger one out at sea on a
 // leader, so the layout that keeps most names at home wins; then the one
 // with the key at sea (a bigger map); then the largest names.
 const sizes=[p.fontPt,p.fontPt-(p.fontPt-p.minFontPt)/3,p.fontPt-2*(p.fontPt-p.minFontPt)/3,p.minFontPt];
 // Last of all, a slightly smaller map, whose wider margins can take the
 // names of small coastal countries.
 let N=null,T=null,m=null,strip=0,margin=null,best=null;
 for(const shrink of [1,.94,.88,.82])for(const below of s.regionLayers.length?[false,true]:[false]){
   if(best&&(best.home===s.countryLabels.length||shrink<1))break;
   for(const t of sizes){
     const st=below?Math.max(C.swatchEm,Math.max(...s.regionLayers.map(v=>(wrap(v.text,C.maxLabelEm*t,t,p.bold)||[1,1]).length))*C.rowEm)*t+.8*t:0;
     const room=ceiling-(locator&&!locator.beside?locator.h+gap:0)-st;
     const mw=Math.min(Wm,room/aspect)*shrink;
     if(!(mw>=C.minMapEm*p.minFontPt))continue;
     // Room the slot leaves beside or above the map (its shape is fixed, so
     // one way usually has spare) is margin a name may sit in; unused margin
     // is cropped off afterwards.
     const cap=C.marginEm*p.fontPt, sx=Math.min(cap,(Wm-mw)/2), sy=Number.isFinite(ceiling)?Math.min(cap,(room-mw*aspect)/2):0;
     const mg={l:sx,r:sx,t:sy,b:sy}, mm={x:sx,y:sy,w:mw,h:mw*aspect};
     const n=placeNames(s,p,t,mm,view,A,below,mg);
     if(n.failed){if(!best)N=n,m=mm;continue;}
     const home=n.labels.filter(l=>l.inside).length;
     if(!best||home>best.home)best={n,t,home,m:mm,strip:st,margin:mg};
   }
 }
 if(!m&&!best)throw new Error('MAP_ZONE_TOO_SMALL: the regional map would be too small to read here; give it a larger slot.');
 if(best){N=best.n;T=best.t;m=best.m;strip=best.strip;margin=best.margin;}
 if(N.failed)throw new Error('MAP_LABELS_DO_NOT_FIT: "'+N.failed+'" cannot be placed on this '+Math.round(m.w)+' x '+Math.round(m.h)+'pt map at a readable size; give it a larger slot, name fewer places, or show a smaller part of the map with view.');
 // Crop to what was drawn, then move everything to start at 0,0.
 const all=[m,...N.labels,...N.lineNames,...N.keys];
 const bx=Math.min(...all.map(b=>b.x)), by=Math.min(...all.map(b=>b.y));
 const bw=Math.max(...all.map(b=>b.x+b.w))-bx, bh=Math.max(...all.map(b=>b.y+b.h))-by;
 [m,...N.labels,...N.lineNames,...N.keys].forEach(b=>{b.x-=bx;b.y-=by;if(b.anchor)b.anchor=[b.anchor[0]-bx,b.anchor[1]-by];});
 let Wt=bw, H=bh;
 if(locator&&locator.beside){Wt=bw+gap+locator.w;H=Math.max(bh,locator.h);locator.x=bw+gap;locator.y=H-locator.h;}
 else if(locator){Wt=Math.max(bw,locator.w);H=bh+gap+locator.h;locator.x=Math.max(0,Wt-locator.w);locator.y=bh+gap;}
 const ink=p.palette==='ink';
 // The stock raster, drawn at the size that makes the chosen view fill the
 // map box, then clipped to that view.
 const fullW=mapW/(view[2]-view[0]);
 const core=base({type:'map',map:'south-america',annotations:s.worksheet?[]:(d.annotations||[])},{...p,widthPt:fullW,heightPt:null});
 const vb=[view[0]*core.w,view[1]*core.h,(view[2]-view[0])*core.w,(view[3]-view[1])*core.h];
 const edge=ink?'#4D4D4D':'#2E7D45', fill=ink?'#BFBFBF':'#7CC48A', lineCol=ink?'#1A1A1A':'#C65911', textCol='#1A1A1A', leadCol=ink?'#4D4D4D':'#404040';
 const sw=Math.max(.8,.07*T), hatch=Math.max(4,.45*T), id='regional-hatch-'+(ink?'i':'c')+Math.round(T*10);
 // An opaque white ground under the whole picture: part-transparent edge
 // pixels (a cropped raster's edge rows, a box's anti-aliased side) come out
 // as a grey rule in some viewers, LibreOffice among them.
 const parts=[`<rect x="0" y="0" width="${Wt}" height="${H}" fill="#FFFFFF"/>`,`<svg x="${m.x}" y="${m.y}" width="${m.w}" height="${m.h}" viewBox="${vb.join(' ')}" preserveAspectRatio="none">${core.svg}</svg>`];
 const point=a=>[m.x+(a[0]-view[0])/(view[2]-view[0])*m.w,m.y+(a[1]-view[1])/(view[3]-view[1])*m.h];
 const shape=v=>v.points.map(a=>point(a).join(',')).join(' ');
 // A pale fill with a hatch over it: the borders underneath stay visible, and
 // the shading survives a photocopier as the hatch.
 const defs=`<defs><clipPath id="${id}-view"><rect x="${m.x}" y="${m.y}" width="${m.w}" height="${m.h}"/></clipPath><pattern id="${id}" width="${hatch}" height="${hatch}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${hatch}" height="${hatch}" fill="${fill}" fill-opacity="${ink?.45:.55}"/><line x1="0" y1="0" x2="0" y2="${hatch}" stroke="${edge}" stroke-width="${sw}" stroke-opacity=".8"/></pattern></defs>`;
 const geo=[];
 s.regionLayers.forEach(v=>geo.push(`<polygon points="${shape(v)}" fill="url(#${id})" stroke="${edge}" stroke-width="${sw*1.6}" stroke-dasharray="${.5*T} ${.3*T}" stroke-linejoin="round"/>`));
 s.referenceLines.forEach(v=>geo.push(`<polyline points="${shape(v)}" fill="none" stroke="${lineCol}" stroke-width="${Math.max(1,.12*T)}" stroke-dasharray="${.7*T} ${.45*T}"/>`));
 parts.push(`<g clip-path="url(#${id}-view)">${geo.join('')}</g>`);
 const font=esc(p.font), weight=p.bold?'bold':'normal';
 const words=(b,col,halo)=>b.lines.map((line,i)=>`<text x="${b.x+b.w/2}" y="${b.y+(i+.8)*C.rowEm*T}" text-anchor="middle" font-family="${font}" font-size="${T}" font-weight="${weight}" fill="${col}"${halo?` stroke="#FFFFFF" stroke-width="${.28*T}" stroke-linejoin="round" paint-order="stroke"`:''}>${esc(line)}</text>`).join('');
 N.labels.forEach(b=>{
   if(b.anchor){
     const cx=Math.min(Math.max(b.anchor[0],b.x),b.x+b.w), cy=Math.min(Math.max(b.anchor[1],b.y),b.y+b.h);
     parts.push(`<path d="M${b.anchor.join(' ')} L${cx} ${cy}" fill="none" stroke="${leadCol}" stroke-width="${Math.max(.8,.07*T)}"/>`);
     parts.push(`<circle cx="${b.anchor[0]}" cy="${b.anchor[1]}" r="${Math.max(1.5,.16*T)}" fill="${leadCol}"/>`);
   }
   parts.push(words(b,textCol,true));
 });
 N.lineNames.forEach(b=>parts.push(words(b,lineCol,true)));
 const swp=C.swatchEm*T;
 N.keys.forEach(k=>{
   parts.push(`<rect x="${k.x}" y="${k.y}" width="${k.w}" height="${k.h}" rx="${.2*T}" fill="#FFFFFF" stroke="${leadCol}" stroke-width="${Math.max(.8,.05*T)}"/>`);
   parts.push(`<rect x="${k.x+.2*T}" y="${k.y+(k.h-swp)/2}" width="${swp}" height="${swp}" fill="url(#${id})" stroke="${edge}" stroke-width="${sw*1.6}"/>`);
   const tw=k.w-swp-.6*T; parts.push(words({lines:k.lines,x:k.x+swp+.4*T,w:tw,y:k.y+(k.h-k.lines.length*C.rowEm*T)/2},textCol,false));
 });
 if(locator)parts.push(`<svg x="${locator.x}" y="${locator.y}" width="${locator.w}" height="${locator.h}">${inset.svg}</svg>`);
 const layout={w:Wt,h:H,map:m,labels:[...N.labels,...N.lineNames],keys:N.keys,locator,fontPt:T,profile:p,s};
 return {svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${Wt}" height="${H}" viewBox="0 0 ${Wt} ${H}">${defs}${parts.join('')}</svg>`,w:Wt,h:H,aspect:Wt/H,layout};
}
module.exports={resolve,build,COUNTRIES,CONTINENTS,REGIONS,LINES};
