'use strict';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

function ordinalSuffix(day) {
  const j = day % 10, k = day % 100;
  if (k >= 11 && k <= 13) return 'th';
  if (j === 1) return 'st';
  if (j === 2) return 'nd';
  if (j === 3) return 'rd';
  return 'th';
}

function formatUKDate(date) {
  const d = date || new Date();
  return `${DAYS[d.getDay()]} ${d.getDate()}${ordinalSuffix(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

module.exports = { formatUKDate };
