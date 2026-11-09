const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function createSolidColorPng(width, height, r, g, b, a = 255) {
  // 8 bytes PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk: width (4), height (4), bit depth (1), color type (1, 6=RGBA), compression (1), filter (1), interlace (1)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // 8 bits per channel
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace

  const ihdrChunk = createChunk("IHDR", ihdrData);

  // Scanlines: each scanline has 1 filter byte (0 = None) followed by width * 4 bytes
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // filter type 0
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk("IDAT", compressed);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, "ascii");
  const crcBody = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBody), 0);

  return Buffer.concat([len, typeBuf, data, crc]);
}

const iconsDir = path.join(__dirname, "..", "public", "icons");
const icon192 = createSolidColorPng(192, 192, 37, 99, 235); // #2563eb
const icon512 = createSolidColorPng(512, 512, 37, 99, 235);

fs.writeFileSync(path.join(iconsDir, "icon-192x192.png"), icon192);
fs.writeFileSync(path.join(iconsDir, "icon-512x512.png"), icon512);

console.log("Generated valid icon-192x192.png and icon-512x512.png");
