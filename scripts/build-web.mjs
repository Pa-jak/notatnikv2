// Pełny build produkcyjny aplikacji webowej Notatnik z obsługą PWA offline.
// Używa wyłącznie wbudowanych modułów Node i narzędzia expo CLI.

import {
  copyFileSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
} from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");
const publicDir = join(projectRoot, "public");
const distDir = join(projectRoot, "dist");

/**
 * Liczy liczbę plików rekurencyjnie w katalogu (do podsumowania).
 */
function countFiles(dirPath) {
  let count = 0;
  for (const entry of readdirSync(dirPath)) {
    const fullPath = join(dirPath, entry);
    const info = statSync(fullPath);
    if (info.isDirectory()) {
      count += countFiles(fullPath);
    } else if (info.isFile()) {
      count += 1;
    }
  }
  return count;
}

function main() {
  // -----------------------------------------------------------
  // 1. Eksport aplikacji Expo do katalogu dist/.
  // -----------------------------------------------------------
  console.log("Krok 1/5: npx expo export --platform web");
  const expoResult = spawnSync("npx", ["expo", "export", "--platform", "web"], {
    cwd: projectRoot,
    stdio: "inherit",
    shell: true,
  });

  if (expoResult.status !== 0) {
    throw new Error(`npx expo export zakończyło się kodem ${expoResult.status ?? expoResult.error}`);
  }

  if (!existsSync(distDir)) {
    throw new Error("Katalog dist/ nie został utworzony przez expo export.");
  }

  // -----------------------------------------------------------
  // 2. Kopiowanie statycznych zasobów PWA do dist/.
  // -----------------------------------------------------------
  console.log("Krok 2/5: kopiowanie manifestu i ikon do dist/");
  for (const file of ["manifest.webmanifest", "icon-192.png", "icon-512.png"]) {
    const src = join(publicDir, file);
    const dst = join(distDir, file);
    copyFileSync(src, dst);
  }

  // -----------------------------------------------------------
  // 3. Wyszukanie entry bundle JS i wyznaczenie BUILD_ID.
  // -----------------------------------------------------------
  console.log("Krok 3/5: wyszukiwanie entry bundle");
  const indexHtmlPath = join(distDir, "index.html");
  const indexHtml = readFileSync(indexHtmlPath, "utf-8");

  const entryMatch = indexHtml.match(/\/_expo\/static\/js\/web\/entry-[^"']+\.js/);
  if (!entryMatch) {
    throw new Error("Nie znaleziono ścieżki entry JS w dist/index.html.");
  }
  const entryPath = entryMatch[0]; // np. /_expo/static/js/web/entry-abc123.js
  const entryFileName = posix.basename(entryPath);
  const entryFilePath = join(distDir, "_expo", "static", "js", "web", entryFileName);

  const entryContent = readFileSync(entryFilePath);
  const BUILD_ID = crypto.createHash("md5").update(entryContent).digest("hex");

  // -----------------------------------------------------------
  // 4. Budowa listy PRECACHE i wygenerowanie service workera.
  // -----------------------------------------------------------
  console.log("Krok 4/5: generowanie service workera");
  const PRECACHE = [
    "/",
    "/index.html",
    entryPath,
    "/manifest.webmanifest",
    "/icon-192.png",
    "/icon-512.png",
  ];

  const swTemplate = readFileSync(join(publicDir, "sw.js"), "utf-8");
  const swBuilt = swTemplate
    .replace(/"__BUILD_ID__"/g, JSON.stringify(BUILD_ID))
    .replace(/__PRECACHE__/g, JSON.stringify(PRECACHE));
  writeFileSync(join(distDir, "sw.js"), swBuilt, "utf-8");

  // -----------------------------------------------------------
  // 5. Modyfikacja dist/index.html — manifest, theme-color, ikona Apple, rejestracja SW.
  // -----------------------------------------------------------
  console.log("Krok 5/5: uzupełnianie dist/index.html o metadane PWA");
  let updatedHtml = indexHtml;

  const headMeta = `<link rel="manifest" href="/manifest.webmanifest">\n<meta name="theme-color" content="#0d1513">\n<link rel="apple-touch-icon" href="/icon-192.png">`;

  if (/<head[^>]*>/i.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(/<head[^>]*>/i, (match) => `${match}\n${headMeta}`);
  } else {
    // Fallback — dodajemy zaraz po <html> lub na początku pliku.
    updatedHtml = updatedHtml.replace(/<html[^>]*>/i, (match) => `${match}\n${headMeta}`);
  }

  const swRegisterScript = `\n<script>\n  if ("serviceWorker" in navigator) {\n    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));\n  }\n</script>\n`;

  if (/<\/body>/i.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(/<\/body>/i, `${swRegisterScript}</body>`);
  } else {
    updatedHtml += swRegisterScript;
  }

  writeFileSync(indexHtmlPath, updatedHtml, "utf-8");

  // -----------------------------------------------------------
  // Podsumowanie.
  // -----------------------------------------------------------
  console.log("\n--- Build PWA zakończony ---");
  console.log(`BUILD_ID: ${BUILD_ID}`);
  console.log(`Entry JS: ${entryPath}`);
  console.log(`Plików w dist/: ${countFiles(distDir)}`);
  console.log(`Liczba zasobów precache: ${PRECACHE.length}`);
  console.log("Lista precache:");
  for (const item of PRECACHE) {
    console.log(`  - ${item}`);
  }
  console.log("----------------------------");
}

main();
