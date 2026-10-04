'use strict';
// Runs the before-and-after page's own script against a stand-in page and a
// stand-in store that behaves the way the real one says it does: what it hands
// back is frozen. Then does what Daniel did: opens the page with one answer
// already saved, clicks a choice on another sheet and types a note.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(process.argv[2], 'utf8');
const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];

const byId = {};
function element(tag) {
  const e = {
    tag, children: [], dataset: {}, attrs: {}, listeners: {}, style: {}, className: '', value: '', hidden: false,
    _id: '',
    set id(v) { this._id = v; byId[v] = this; }, get id() { return this._id; },
    set textContent(v) { this._text = v; if (v === '') this.children = []; }, get textContent() { return this._text; },
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k]; },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
    fire(type) { (this.listeners[type] || []).forEach((fn) => fn({ preventDefault() {} })); },
    focus() { document.activeElement = this; },
    classList: { toggle() {} },
    querySelectorAll(sel) {
      const cls = sel.replace('.', '');
      const found = [];
      const walk = (n) => n.children.forEach((c) => { if ((' ' + c.className + ' ').includes(' ' + cls + ' ')) found.push(c); walk(c); });
      walk(this);
      return found;
    }
  };
  return e;
}
const document = {
  activeElement: null,
  createElement: (tag) => element(tag),
  getElementById: (id) => byId[id],
  addEventListener() {}
};
for (const id of ['rows', 'tally', 'status', 'box', 'boxCap', 'boxA', 'boxB', 'boxClose', 'boxImg']) element('div').id = id;

function deepFreeze(o) { Object.values(o).forEach((v) => { if (v && typeof v === 'object') deepFreeze(v); }); return Object.freeze(o); }
const store = { look: { rows: { 'subtract-a-sheet-01': { c: 'after', n: '' } }, updatedAt: 'x' } };
const writes = [];
let listener = null;
const deliver = () => listener({ docs: [{ id: 'look', data: () => deepFreeze(JSON.parse(JSON.stringify(store.look))) }] });
const db = {
  collection: () => ({ onSnapshot: (next) => { listener = next; setTimeout(deliver, 0); return () => {}; } }),
  doc: () => ({ set: async (body) => { writes.push(JSON.parse(JSON.stringify(body))); store.look = JSON.parse(JSON.stringify(body)); setTimeout(deliver, 0); } })
};

const context = { document, window: { claude: { use: async () => db } }, localStorage: { getItem: () => null, setItem() {} },
  setTimeout, clearTimeout, console, Date, JSON, Object };
vm.createContext(context);
vm.runInContext(script, context);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  await wait(50);                                   // the page loads and receives the saved answers
  const row = byId['row-subtract-a-sheet-02'];
  const after = row.querySelectorAll('choice').find((b) => b.dataset.choice === 'after');
  after.fire('click');                              // "After is better" on the second sheet
  await wait(50);
  const note = byId['note-subtract-a-sheet-02'];
  note.focus(); note.value = 'The boxes are a better size now.';
  note.fire('input'); document.activeElement = null; note.fire('blur');   // types a note, clicks away
  await wait(50);
  const saved = (store.look.rows || {})['subtract-a-sheet-02'] || {};
  const pressed = after.getAttribute('aria-pressed') === 'true';
  console.log('writes made:', writes.length);
  console.log('choice shows as picked on the page:', pressed);
  console.log('choice saved:', saved.c === 'after');
  console.log('note saved:', saved.n === 'The boxes are a better size now.');
  console.log('note still in its box:', note.value === 'The boxes are a better size now.');
  const ok = pressed && saved.c === 'after' && saved.n === 'The boxes are a better size now.' && note.value !== '';
  console.log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
})();
