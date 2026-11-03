"use strict";
// Draft release candidate only: no browser/network, no publication.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("index.html"),sw=read("sw.js");
const version=JSON.parse(read("version.json")),manifest=JSON.parse(read("manifest.webmanifest"));
const engine=read("business_engine.generated.js");
// Exact SHA-bound candidate contract: version.json, HTML, generated engine and
// SW must agree. Keep literal pins; do NOT derive expectations from actuals.
const V="1.0.39", SHA="0a0e541680405bd685a52225d637246064ef59a9715ea4afa72f750c9095e487";
assert.equal(version.version,V);
assert.equal(version.business_engine_sha256,SHA);
assert.ok(engine.includes(SHA));
assert.ok(html.includes('const APP_VERSION = "'+V+'"'));
assert.ok(html.includes("v"+V));
const CACHE="tach-dai-ngang-v"+V+"-owner-singleton-dx-reject-clean-r2-quyt-r22";
assert.equal((sw.match(/^const CACHE_NAME = "([^"]+)";$/mu)||[])[1],CACHE,
  "Ngang offline cache must identify the source-bound Quýt direct review build");
assert.ok(html.includes('const EXPECTED_BUSINESS_ENGINE_SHA256="'+SHA+'"'),
  "runtime engine guard must pin the same canonical digest");
assert.ok(html.includes("HOLD: BUSINESS_ENGINE_MISMATCH"),
  "stale engine cannot silently process source");
for(const name of ["clean-aggregate-review.js","clean-aggregate-ui.js",
                   "quyt-bao-review.js","quyt-bao-review-ui.js"]){
  assert.ok(html.includes('src="./'+name+'"'),"missing HTML review asset "+name);
  assert.ok(sw.includes('"./'+name+'"'),"missing offline review asset "+name);
}
assert.ok(sw.includes('JSON.stringify({version:"'+V+'"})'));
assert.equal(manifest.start_url,"./index.html");
assert.equal(manifest.scope,"./");
assert.ok(sw.includes('"./station_calendar.generated.js"'));
assert.ok(sw.includes('"./business_engine.generated.js"'));
assert.ok(sw.includes('cache.put("./index.html", copy)'));
assert.ok(!html.includes("v1.0.27</span>"));
console.log("RELEASE REVIEW ASSET CONSISTENCY — NGANG PASS");
