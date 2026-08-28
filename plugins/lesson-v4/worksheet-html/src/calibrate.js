"use strict";

// Making a monitor show true physical size.
//
// CSS physical units assume 96dpi, which almost no real monitor is, so a page
// set to 210mm wide is not 210mm on the glass. There is no way for a browser
// to discover the true figure, so a person measures it once with a ruler and
// we remember the correction.

const CALIBRATION_BAR_MM = 100;
const STORAGE_KEY = "worksheet-studio-scale";

function calibrationScale(declaredMm, measuredMm) {
  if (!(declaredMm > 0)) {
    throw new Error(`declared length must be positive, got ${declaredMm}`);
  }
  if (!(measuredMm > 0)) {
    throw new Error(`measured length must be positive, got ${measuredMm}`);
  }
  return declaredMm / measuredMm;
}

// Returned as a string because the studio page is assembled in Node and this
// runs in the browser. Kept small and dependency-free on purpose.
function clientScript() {
  return `
  var KEY = ${JSON.stringify(STORAGE_KEY)};
  var BAR_MM = ${CALIBRATION_BAR_MM};

  function currentScale() {
    try {
      var stored = parseFloat(localStorage.getItem(KEY));
      return stored > 0 ? stored : 1;
    } catch (err) {
      // Storage can throw synchronously in some browser configurations
      // (private browsing, disabled cookies). Fall back to uncalibrated
      // rather than letting the page break.
      return 1;
    }
  }

  function applyScale(scale) {
    document.documentElement.style.setProperty('--true-size-scale', scale);
    var readout = document.getElementById('scale-readout');
    if (readout) {
      readout.textContent = scale === 1
        ? 'not calibrated yet'
        : 'calibrated: ' + scale.toFixed(4);
    }
  }

  function calibrate() {
    var input = document.getElementById('measured-mm');
    if (!input) return;
    var measured = parseFloat(input.value);
    if (!(measured > 0)) {
      input.setCustomValidity('Measure the bar with a ruler and type the length in millimetres.');
      input.reportValidity();
      return;
    }
    input.setCustomValidity('');
    var scale = BAR_MM / measured;
    try {
      localStorage.setItem(KEY, String(scale));
    } catch (err) {
      // The correction still applies for this page view, it just will
      // not survive a reload.
    }
    applyScale(scale);
  }

  function resetCalibration() {
    try {
      localStorage.removeItem(KEY);
    } catch (err) {
      // Nothing to clean up if storage cannot be touched.
    }
    applyScale(1);
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyScale(currentScale());
    var go = document.getElementById('calibrate-go');
    if (go) go.addEventListener('click', calibrate);
    var reset = document.getElementById('calibrate-reset');
    if (reset) reset.addEventListener('click', resetCalibration);
  });
  `;
}

module.exports = { CALIBRATION_BAR_MM, STORAGE_KEY, calibrationScale, clientScript };
