'use strict';

function safePart(value) {
  const cleaned = String(value == null ? '' : value)
    .replace(/[^A-Za-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'text';
}

function coord(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 1000) : 0;
}

function fitGroupId(zone, role) {
  return [
    safePart(role),
    coord(zone && zone.x),
    coord(zone && zone.y),
    coord(zone && zone.w),
    coord(zone && zone.h)
  ].join('-');
}

function growFitObjectName(groupId, ceilingPt, label) {
  const ceiling = Math.max(1, Math.min(999, Math.floor(Number(ceilingPt) || 1)));
  return 'GROWFIT__' + safePart(groupId) + '__' + ceiling + '__' + safePart(label);
}

module.exports = { fitGroupId, growFitObjectName };
