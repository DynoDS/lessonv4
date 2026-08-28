"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { calibrationScale, CALIBRATION_BAR_MM, clientScript } = require("../src/calibrate");

test("a bar that measures exactly right needs no correction", () => {
  assert.equal(calibrationScale(100, 100), 1);
});

test("a bar that draws too large is scaled down", () => {
  // Declared 100mm, actually 125mm on the glass: shrink to 0.8.
  assert.equal(calibrationScale(100, 125), 0.8);
});

test("a bar that draws too small is scaled up", () => {
  assert.equal(calibrationScale(100, 80), 1.25);
});

test("a nonsense measurement is rejected rather than producing a broken page", () => {
  assert.throws(() => calibrationScale(100, 0), /measured/i);
  assert.throws(() => calibrationScale(100, -5), /measured/i);
  assert.throws(() => calibrationScale(0, 100), /declared/i);
});

test("the calibration bar is 100mm, which is easy to read off any ruler", () => {
  assert.equal(CALIBRATION_BAR_MM, 100);
});

// The client script is a plain string, never executed by Node directly.
// To prove it actually persists and restores calibration (not just that it
// mentions the right words) we run its text through a fake browser: a
// Map-backed localStorage and stub DOM elements, wired up the same way
// index.html would wire them.
function makeFakeBrowser({ localStorage } = {}) {
  const store = new Map();
  const fakeLocalStorage = localStorage || {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };

  function makeElement(id) {
    const listeners = {};
    return {
      id,
      value: "",
      textContent: "",
      addEventListener(event, handler) {
        listeners[event] = handler;
      },
      click() {
        if (listeners.click) listeners.click();
      },
      setCustomValidity() {},
      reportValidity() {},
    };
  }

  const elements = {
    "scale-readout": makeElement("scale-readout"),
    "measured-mm": makeElement("measured-mm"),
    "calibrate-go": makeElement("calibrate-go"),
    "calibrate-reset": makeElement("calibrate-reset"),
  };

  const documentListeners = {};
  const fakeDocument = {
    documentElement: { style: { setProperty() {} } },
    getElementById: (id) => elements[id] || null,
    addEventListener(event, handler) {
      documentListeners[event] = handler;
    },
  };

  const run = new Function("document", "localStorage", clientScript());
  run(fakeDocument, fakeLocalStorage);

  return {
    elements,
    store,
    // Fires the same event the real page fires once the DOM is ready,
    // which is when the script reads any stored scale and wires the buttons.
    ready: () => documentListeners.DOMContentLoaded(),
  };
}

test("a: with nothing stored, the applied scale is 1", () => {
  const browser = makeFakeBrowser();
  browser.ready();
  assert.equal(browser.elements["scale-readout"].textContent, "not calibrated yet");
});

test("b: measuring 125mm against the 100mm bar stores and applies 0.8", () => {
  const browser = makeFakeBrowser();
  browser.ready();
  browser.elements["measured-mm"].value = "125";
  browser.elements["calibrate-go"].click();

  assert.equal(browser.store.get("worksheet-studio-scale"), "0.8");
  assert.equal(browser.elements["scale-readout"].textContent, "calibrated: 0.8000");
});

test("c: a fresh page load reads back a stored scale without re-measuring", () => {
  // Simulates the reload: a first browser calibrates, then a brand new
  // page (a new run of the script, a new set of DOM stubs) opens against
  // the same storage and must show the correction immediately.
  const first = makeFakeBrowser();
  first.ready();
  first.elements["measured-mm"].value = "125";
  first.elements["calibrate-go"].click();

  const store = first.store;
  const reload = makeFakeBrowser({
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
  });
  reload.ready();

  assert.equal(reload.elements["scale-readout"].textContent, "calibrated: 0.8000");
});

test("d: resetting clears storage and returns the applied scale to 1", () => {
  const browser = makeFakeBrowser();
  browser.ready();
  browser.elements["measured-mm"].value = "125";
  browser.elements["calibrate-go"].click();
  assert.equal(browser.store.get("worksheet-studio-scale"), "0.8");

  browser.elements["calibrate-reset"].click();

  assert.equal(browser.store.has("worksheet-studio-scale"), false);
  assert.equal(browser.elements["scale-readout"].textContent, "not calibrated yet");
});

test("e: a corrupt stored value degrades to 1 rather than NaN", () => {
  const store = new Map([["worksheet-studio-scale", "banana"]]);
  const browser = makeFakeBrowser({
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
  });
  browser.ready();

  assert.equal(browser.elements["scale-readout"].textContent, "not calibrated yet");
});

test("f: a throwing localStorage degrades to uncalibrated but working, buttons stay wired", () => {
  const throwingLocalStorage = {
    getItem() {
      throw new Error("storage disabled");
    },
    setItem() {
      throw new Error("storage disabled");
    },
    removeItem() {
      throw new Error("storage disabled");
    },
  };
  const browser = makeFakeBrowser({ localStorage: throwingLocalStorage });

  // Must not throw and abort before the buttons get wired up.
  assert.doesNotThrow(() => browser.ready());
  assert.equal(browser.elements["scale-readout"].textContent, "not calibrated yet");

  // The button click still runs and shows the correction for this
  // session, even though it cannot be saved.
  browser.elements["measured-mm"].value = "125";
  assert.doesNotThrow(() => browser.elements["calibrate-go"].click());
  assert.equal(browser.elements["scale-readout"].textContent, "calibrated: 0.8000");
});
