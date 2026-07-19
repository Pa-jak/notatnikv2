// Skrypt wdrażający produkcyjną wersję PWA + API na dedykowany branch `deploy`.
// Używa wyłącznie wbudowanych modułów Node (fs, path, child_process).
// Nie dołącza lokalnej konfiguracji (api/config.php, *.sqlite).

import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  existsSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");
const deployDir = join(projectRoot, ".deploy");
const distDir = join(projectRoot, "dist");
const apiDir = join(projectRoot, "api");
const scriptsDir = join(projectRoot, "scripts");

function fail(message, code = 1) {
  console.error(`[deploy] Błąd: ${message}`);
  process.exit(code);
}

function runInMain(args) {
  const result = spawnSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    throw new Error(
      result.stderr ? result.stderr.trim() : `git ${args.join(" ")} nie powiodło się`
    );
  }
  return result.stdout.trim();
}

function runInDeploy(args, stdioMode = "pipe") {
  const result = spawnSync("git", args, {
    cwd: deployDir,
    encoding: "utf8",
    stdio: stdioMode,
  });
  if (result.status !== 0) {
    const err = typeof result.stderr === "string" ? result.stderr.trim() : "";
    throw new Error(
      `git ${args.join(" ")} nie powiodło się${err ? ": " + err : ""}`
    );
  }
  return result;
}

function countFiles(dir) {
  let count = 0;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const info = statSync(full);
    if (info.isDirectory()) {
      count += countFiles(full);
    } else {
      count += 1;
    }
  }
  return count;
}

function copyRec(src, dst) {
  const info = statSync(src);
  if (info.isDirectory()) {
    mkdirSync(dst, { recursive: true });
    for (const entry of readdirSync(src)) {
      copyRec(join(src, entry), join(dst, entry));
    }
  } else {
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(src, dst);
  }
}

function clearDeployDir() {
  if (existsSync(deployDir)) {
    rmSync(deployDir, { recursive: true, force: true });
  }
  mkdirSync(deployDir, { recursive: true });
}

function copyDist() {
  if (!existsSync(distDir)) {
    throw new Error("Katalog dist/ nie istnieje — build nie powiódł się?");
  }
  copyRec(distDir, deployDir);
}

function copyRootHtaccess() {
  copyFileSync(
    join(scriptsDir, "deploy.htaccess"),
    join(deployDir, ".htaccess")
  );
}

function copyApiSubset() {
  const apiDeploy = join(deployDir, "api");
  mkdirSync(apiDeploy, { recursive: true });

  // Pliki z korzenia api/:
  // *.php (bez config.php), .htaccess, schema.sql.
  // Pomijamy pliki SQLite (w tym backupy typu *.sqlite.bak).
  for (const entry of readdirSync(apiDir)) {
    const src = join(apiDir, entry);
    const info = statSync(src);
    if (info.isDirectory()) {
      continue;
    }
    if (entry === "config.php" || entry.toLowerCase().includes(".sqlite")) {
      continue;
    }
    copyFileSync(src, join(apiDeploy, entry));
  }

  // Podkatalog lib/ — tylko pliki PHP.
  const libSrc = join(apiDir, "lib");
  const libDeploy = join(apiDeploy, "lib");
  mkdirSync(libDeploy, { recursive: true });
  for (const entry of readdirSync(libSrc)) {
    if (!entry.endsWith(".php")) {
      continue;
    }
    copyFileSync(join(libSrc, entry), join(libDeploy, entry));
  }
}

function buildProductionTree() {
  console.log("[deploy] Budowanie drzewa produkcyjnego w .deploy/");
  clearDeployDir();
  copyDist();
  copyRootHtaccess();
  copyApiSubset();
}

function getOriginUrl() {
  try {
    return runInMain(["remote", "get-url", "origin"]);
  } catch (e) {
    throw new Error(
      "Nie udało się odczytać URL zdalnego repozytorium (git remote get-url origin). " +
      "Czy to repozytorium ma dodany zdalny origin?"
    );
  }
}

function getMainHeadHash() {
  try {
    return runInMain(["rev-parse", "--short", "HEAD"]);
  } catch {
    return "unknown";
  }
}

function publishDeployBranch(mainHash) {
  const now = new Date().toISOString();
  const message = `Deploy ${now} (${mainHash})`;
  const originUrl = getOriginUrl();

  console.log("[deploy] Inicjalizacja lokalnego repozytorium deploy");
  runInDeploy(["init", "-b", "deploy"]);
  runInDeploy(["config", "user.email", "deploy@notatnik.local"]);
  runInDeploy(["config", "user.name", "Deploy"]);

  console.log("[deploy] Commit artefaktów");
  runInDeploy(["add", "-A"]);
  runInDeploy(["commit", "-m", message]);

  const shortCommit = runInDeploy(["rev-parse", "--short", "HEAD"])
    .stdout.trim();

  console.log(`[deploy] Push brancha deploy -> ${originUrl}`);
  const pushResult = spawnSync(
    "git",
    ["push", "--force", originUrl, "deploy:deploy"],
    { cwd: deployDir, stdio: "inherit" }
  );
  if (pushResult.status !== 0) {
    throw new Error("git push --force deploy:deploy nie powiódł się");
  }

  return { message, shortCommit };
}

function cleanDeployDir() {
  if (existsSync(deployDir)) {
    rmSync(deployDir, { recursive: true, force: true });
  }
}

function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log("[deploy] Ustawienie EXPO_PUBLIC_API_URL=/api");
  process.env.EXPO_PUBLIC_API_URL = "/api";

  console.log("[deploy] Budowanie PWA (scripts/build-web.mjs)");
  const buildResult = spawnSync(
    process.execPath,
    [join(scriptsDir, "build-web.mjs")],
    {
      cwd: projectRoot,
      stdio: "inherit",
      env: process.env,
    }
  );
  if (buildResult.status !== 0) {
    fail("Build PWA zakończył się błędem.", buildResult.status ?? 1);
  }

  buildProductionTree();
  const fileCount = countFiles(deployDir);

  if (dryRun) {
    console.log("\n=== Podsumowanie deploy (dry-run) ===");
    console.log(`Zbudowanych plików: ${fileCount}`);
    console.log("Drzewo produkcyjne w .deploy/ — bez commita i pusha.");
    console.log("=====================================\n");
    return;
  }

  const mainHash = getMainHeadHash();
  const { message, shortCommit } = publishDeployBranch(mainHash);

  console.log("[deploy] Sprzątanie katalogu .deploy/");
  cleanDeployDir();

  console.log("\n=== Podsumowanie deploy ===");
  console.log(`Wdrożonych plików: ${fileCount}`);
  console.log(`Branch:            deploy`);
  console.log(`Commit:            ${shortCommit} — ${message}`);
  console.log("===========================\n");
}

try {
  main();
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  console.error("[deploy] Wdrożenie przerwane: " + message);
  process.exit(1);
}
