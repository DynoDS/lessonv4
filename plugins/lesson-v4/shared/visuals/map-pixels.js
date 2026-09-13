'use strict';

// The two map treatments that work on the shipped image's own pixels rather
// than on top of it: filling a country inside its printed border, and turning
// the flat world into a globe.
//
// Both used to live in the board's own map code and ran through the sharp image
// library before any slide was drawn, which is why a worksheet could not shade
// Brazil (it was refused on paper, "drawn on the board only") and the
// globe-to-flat explanation could not reach a sheet, the wall or a book at all.
// A map is one drawing on every surface since 13 September 2026, and a drawing
// has to be made in one synchronous step from its spec, so the pixel work is
// done here in plain code: read the PNG, change the pixels, write a PNG back
// into the picture. No coastline or border is ever drawn; every pixel still
// comes from the asset in builder/assets/maps.
//
//   decodePng(buffer)                       -> { width, height, data (RGBA) }
//   encodePng({ width, height, data })      -> buffer
//   filledRegionPng(assetPath, seed, rgb)   -> PNG buffer, cached
//   globePng(assetPath, centralLon, sizePx) -> PNG buffer, cached

const fs = require('fs');
const zlib = require('zlib');

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// A pixel counts as open sea or open land (fillable) when it is this close to
// white; a border line is darker and stops the fill. Taken unchanged from the
// board's fill, which was tuned on south-america.png.
const OPEN_PIXEL = 235;

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

// Enough of PNG for the maps this package ships: 8 bits a channel, not
// interlaced, greyscale, RGB, palette, grey with alpha or RGBA. Anything else
// is refused by name, because a map drawn from pixels misread is a map of
// nowhere.
function decodePng(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('MAP_ASSET_UNSUPPORTED: the map file is not a PNG, so its pixels cannot be worked on.');
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colourType = 0;
  let interlace = 0;
  let palette = null;
  let transparency = null;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      bitDepth = body[8];
      colourType = body[9];
      interlace = body[12];
    } else if (type === 'PLTE') {
      palette = body;
    } else if (type === 'tRNS') {
      transparency = body;
    } else if (type === 'IDAT') {
      idat.push(body);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }
  const channelsFor = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
  const channels = channelsFor[colourType];
  if (bitDepth !== 8 || interlace !== 0 || !channels || (colourType === 3 && !palette)) {
    throw new Error(
      'MAP_ASSET_UNSUPPORTED: the map PNG is ' + bitDepth + '-bit, colour type ' + colourType +
        (interlace ? ', interlaced' : '') + '; only 8-bit, non-interlaced maps can be shaded or turned into a globe.'
    );
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * channels);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = pixels.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? out[x - channels] : 0;
      const up = prev[x];
      const upLeft = x >= channels ? prev[x - channels] : 0;
      let value = line[x];
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += (left + up) >> 1;
      else if (filter === 4) value += paeth(left, up, upLeft);
      out[x] = value & 255;
    }
    prev = out;
  }
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const s = i * channels;
    const d = i * 4;
    if (colourType === 6) {
      pixels.copy(data, d, s, s + 4);
    } else if (colourType === 2) {
      data[d] = pixels[s]; data[d + 1] = pixels[s + 1]; data[d + 2] = pixels[s + 2]; data[d + 3] = 255;
    } else if (colourType === 3) {
      const index = pixels[s];
      data[d] = palette[index * 3]; data[d + 1] = palette[index * 3 + 1]; data[d + 2] = palette[index * 3 + 2];
      data[d + 3] = transparency && index < transparency.length ? transparency[index] : 255;
    } else if (colourType === 0) {
      data[d] = data[d + 1] = data[d + 2] = pixels[s]; data[d + 3] = 255;
    } else {
      data[d] = data[d + 1] = data[d + 2] = pixels[s]; data[d + 3] = pixels[s + 1];
    }
  }
  return { width, height, data };
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(bytes) {
  let c = -1;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, body) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, crc]);
}

function encodePng(image) {
  const { width, height, data } = image;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Fill the open pixels reachable from a seed, stopping at the printed border,
// so a country is coloured in exactly as far as the real map draws it.
function fillRegion(image, seed, colour) {
  const { width, height, data } = image;
  const start = seed.y * width + seed.x;
  const seen = new Uint8Array(width * height);
  const stack = [start];
  seen[start] = 1;
  const isOpen = (index) => {
    const p = index * 4;
    return data[p] > OPEN_PIXEL && data[p + 1] > OPEN_PIXEL && data[p + 2] > OPEN_PIXEL;
  };
  while (stack.length) {
    const index = stack.pop();
    if (!isOpen(index)) continue;
    const p = index * 4;
    data[p] = colour.r;
    data[p + 1] = colour.g;
    data[p + 2] = colour.b;
    const x = index % width;
    const neighbours = [index - 1, index + 1, index - width, index + width];
    neighbours.forEach((next, direction) => {
      if (next < 0 || next >= width * height || seen[next]) return;
      if ((direction === 0 && x === 0) || (direction === 1 && x === width - 1)) return;
      seen[next] = 1;
      if (isOpen(next)) stack.push(next);
    });
  }
  return image;
}

// Inverse orthographic sampling. The source pixels are the shipped
// equirectangular world map; no coastline or border is recreated here, each
// pixel of the globe is looked up at its real longitude and latitude.
function projectEquirectangularToOrthographic(raw, info, centralLongitude, size) {
  const width = size;
  const height = width;
  const channels = 4;
  const out = Buffer.alloc(width * height * channels);
  const radius = width / 2 - 3;
  const centre = width / 2;
  const lambda0 = (Number(centralLongitude || 0) * Math.PI) / 180;
  for (let y = 0; y < height; y += 1) {
    const ny = (y + 0.5 - centre) / radius;
    for (let x = 0; x < width; x += 1) {
      const nx = (x + 0.5 - centre) / radius;
      const rr = nx * nx + ny * ny;
      const dest = (y * width + x) * channels;
      if (rr > 1) continue;
      const z = Math.sqrt(Math.max(0, 1 - rr));
      const latitude = Math.asin(-ny);
      let longitude = lambda0 + Math.atan2(nx, z);
      while (longitude < -Math.PI) longitude += 2 * Math.PI;
      while (longitude >= Math.PI) longitude -= 2 * Math.PI;
      const sx = Math.min(info.width - 1, Math.max(0, Math.round(((longitude + Math.PI) / (2 * Math.PI)) * (info.width - 1))));
      const sy = Math.min(info.height - 1, Math.max(0, Math.round(((Math.PI / 2 - latitude) / Math.PI) * (info.height - 1))));
      const source = (sy * info.width + sx) * info.channels;
      out[dest] = raw[source];
      out[dest + 1] = raw[source + 1];
      out[dest + 2] = raw[source + 2];
      out[dest + 3] = 255;
    }
  }
  return { data: out, info: { width, height, channels } };
}

// A build draws the same map many times (every slide of a progressive reveal,
// every copy of a stick-in piece), and the pixels never change, so each result
// is made once per process.
const cache = new Map();

function once(key, make) {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
}

function readAsset(assetPath) {
  return once('decoded:' + assetPath, () => decodePng(fs.readFileSync(assetPath)));
}

function filledRegionPng(assetPath, seed, colour) {
  return once(`fill:${assetPath}:${seed.x},${seed.y}:${colour.r},${colour.g},${colour.b}`, () => {
    const source = readAsset(assetPath);
    const copy = { width: source.width, height: source.height, data: Buffer.from(source.data) };
    return encodePng(fillRegion(copy, seed, colour));
  });
}

function globePng(assetPath, centralLongitude, sizePx) {
  return once(`globe:${assetPath}:${centralLongitude}:${sizePx}`, () => {
    const source = readAsset(assetPath);
    const projected = projectEquirectangularToOrthographic(
      source.data, { width: source.width, height: source.height, channels: 4 }, centralLongitude, sizePx
    );
    return encodePng({ width: sizePx, height: sizePx, data: projected.data });
  });
}

module.exports = {
  decodePng,
  encodePng,
  fillRegion,
  projectEquirectangularToOrthographic,
  filledRegionPng,
  globePng,
};
