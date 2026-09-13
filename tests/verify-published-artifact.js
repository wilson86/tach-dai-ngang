#!/usr/bin/env node
/*
 * Release gate for the standalone PWA.  This deliberately verifies the
 * deployed bytes, rather than treating a passing local rules test as proof
 * that an operator's installed/web artifact has updated.
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const base = (process.argv[2] || "https://wilson86.github.io/tach-dai-ngang/").replace(/\/?$/, "/");
const assets = ["index.html", "sw.js", "version.json"];
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

async function readPublished(name) {
  const response = await fetch(new URL(name, base), { cache: "no-store" });
  assert.equal(response.status, 200, `${name} must be published`);
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const published = Object.fromEntries(await Promise.all(assets.map(async name => [name, await readPublished(name)])));
  const local = Object.fromEntries(assets.map(name => [name, fs.readFileSync(path.join(root, name))]));
  for (const name of assets) assert.equal(sha256(published[name]), sha256(local[name]), `${name} artifact hash mismatch`);

  const index = published["index.html"].toString("utf8");
  const version = JSON.parse(published["version.json"].toString("utf8"));
  const serviceWorker = published["sw.js"].toString("utf8");
  assert.equal(version.version, "1.0.5", "published version must identify the corrected build");
  assert.match(index, /Tách Đài Ngang 3 Miền[\s\S]*v1\.0\.5/u);
  assert.match(index, /0:\[\["kh","Khánh Hòa"\],\["kt","Kon Tum"\],\["hue","Huế"\]\]/u);
  assert.match(serviceWorker, /tach-dai-ngang-v1\.0\.5/u);
  console.log(JSON.stringify({
    result: "PASS",
    base,
    version: version.version,
    hashes: Object.fromEntries(assets.map(name => [name, sha256(published[name])])),
    checks: ["NGANG_INSTALLED_ARTIFACT_IDENTITY", "NGANG_SUNDAY_ROLE_DISPLAY"]
  }, null, 2));
}

main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
