// Generuje ikony PWA jako poprawne pliki PNG bez żadnych zależności zewnętrznych.
// Używa wyłącznie wbudowanych modułów: fs, path, url, zlib.

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ścieżka wyjściowa: public/ w korzeniu projektu (obok scripts/).
const publicDir = join(__dirname, "..", "public");

// Kolory akcentu gradientu (RGBA 8-bit).
const COLOR_TOP = { r: 0x3f, g: 0xb7, b: 0xa6 };
const COLOR_BOTTOM = { r: 0x2f, g: 0x9d, b: 0x8c };

/**
 * Konwertuje krótki zapis HEX (#RRGGBB) na obiekt {r,g,b}.
 */
function hexToRgb(hex) {
  const num = parseInt(hex.slice(1), 16);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

/**
 * Tworzy tablicowy CRC32 (z opcjonalnym użyciem zlib.crc32 jeśli jest dostępne).
 */
function makeCrc32() {
  if (typeof zlib.crc32 === "function") {
    // Node ma wbudowaną funkcję — użyjemy jej dla niezawodności.
    return (buf) => zlib.crc32(buf);
  }

  // Fallback: standardowy tablicowy CRC32 (szybki wystarczająco dla małych plików).
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return (buf) => {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };
}

const crc32 = makeCrc32();

/**
 * Tworzy pojedynczy chunk PNG (4 bajty długości + typ + dane + 4 bajty CRC32).
 * Długość i CRC są big-endian.
 */
function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const combined = Buffer.concat([typeBuf, data]);
  const crc = crc32(combined);
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([lengthBuf, combined, crcBuf]);
}

/**
 * Buduje bufor pikseli RGBA dla kwadratowej ikony.
 * Gradient pionowy od góry do dołu, każdy piksel przezroczystość 255 (nieprzezroczysty).
 */
function buildRgbaPixels(size, top, bottom) {
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    // T = 0 na górze, T = 1 na dole.
    const t = size === 1 ? 0 : y / (size - 1);
    const r = Math.round(top.r + (bottom.r - top.r) * t);
    const g = Math.round(top.g + (bottom.g - top.g) * t);
    const b = Math.round(top.b + (bottom.b - top.b) * t);

    const rowOffset = y * size * 4;
    for (let x = 0; x < size; x++) {
      const i = rowOffset + x * 4;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = 0xff; // alfa = nieprzezroczysty
    }
  }
  return pixels;
}

/**
* Tworzy pełny plik PNG dla kwadratu o podanym rozmiarze.
* Format: 8-bit RGBA, metoda filtru 0, brak przeplotu.
 */
function createPng(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type = RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace

  const rgba = buildRgbaPixels(size, COLOR_TOP, COLOR_BOTTOM);

  // Scanline: 1 bajt filtru (0 = brak filtru) + piksele RGBA wiersza.
  const rowSize = size * 4;
  const raw = Buffer.alloc(size * (1 + rowSize));
  for (let y = 0; y < size; y++) {
    const dst = y * (1 + rowSize);
    raw[dst] = 0; // filter type 0
    rgba.copy(raw, dst + 1, y * rowSize, (y + 1) * rowSize);
  }

  const idat = zlib.deflateSync(raw, { level: 9 });

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = makeChunk("IHDR", ihdr);
  const idatChunk = makeChunk("IDAT", idat);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function main() {
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  for (const size of [192, 512]) {
    const png = createPng(size);
    const outPath = join(publicDir, `icon-${size}.png`);
    writeFileSync(outPath, png);
    console.log(`Zapisano ${outPath} (${png.length} bajtów, ${size}x${size})`);
  }
}

main();
