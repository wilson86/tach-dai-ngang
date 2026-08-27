"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
const version = JSON.parse(fs.readFileSync(path.join(root, "version.json"), "utf8"));

function loadRules() {
  const match = html.match(/<script>\s*([\s\S]*?)<\/script>/i);
  assert.ok(match, "index.html phải có script ứng dụng");
  const marker = "loadSettings();";
  const source = match[1].slice(0, match[1].indexOf(marker));
  assert.ok(source.length > 0, "không tìm thấy phần rule tách/check");

  const elements = Object.create(null);
  const element = () => ({
    events: Object.create(null),
    addEventListener(type, handler) { this.events[type] = handler; },
    trigger(type) { return this.events[type]?.({ target: this }); },
    value: "", textContent: "", className: "", selectionStart: 0, selectionEnd: 0,
    style: {}, focus() {}, select() { this.selectionStart = 0; this.selectionEnd = this.value.length; },
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }, remove() {}
  });
  const clipboard = { text: "", async writeText(value) { this.text = value; } };
  const context = {
    console, Set, Date, JSON, RegExp, String, Error,
    navigator: { clipboard },
    document: {
      getElementById(id) { return elements[id] || (elements[id] = element()); },
      createElement: element, body: { appendChild() {} }, execCommand() { return true; }
    }
  };
  vm.createContext(context);
  vm.runInContext(`${source}\nglobalThis.__rules={getSchedule,normalizeInput,preprocessChatText,validateCheckOnlyLine,processLine,run,cutSelectedOutput,triggerUndo:()=>document.getElementById("undoBtn").trigger("click"),getOutputRecords:()=>outputRecords.map(r=>({...r})),elements:{input:inputEl,output:outputEl,region:regionEl,date:dateEl,today:todayEl},clipboard:navigator.clipboard};`, context);
  return context.__rules;
}

function expectThrow(fn, expected) {
  let error;
  try { fn(); } catch (caught) { error = caught; }
  assert.ok(error, "phải báo lỗi");
  assert.match(error.message, expected);
}

async function main() {
  const rules = loadRules();
  const saturday = new Date("2026-08-22T12:00:00");
  const sunday = new Date("2026-08-23T12:00:00");
  const monday = new Date("2026-08-24T12:00:00");
  const mtSaturday = rules.getSchedule("mt", saturday);
  const mnMonday = rules.getSchedule("mn", monday);

  // ĐX/ĐA vẫn tách đài như tool cũ.
  assert.deepEqual(
    Array.from(rules.processLine("3d 22 10 dx 5n", "mt", mtSaturday)),
    ["2d 22 10 dx 5n", "dn dno 22 10 dx 5n", "qn dno 22 10 dx 5n"]
  );

  // Cược thường: đúng hai dòng, giữ selector, mỗi dòng nửa số lượng.
  assert.deepEqual(
    Array.from(rules.processLine("3d 68 69 70 b 30 dd 60", "mt", mtSaturday)),
    ["3d 68 69 70 b 15 dd 30", "3d 68 69 70 b 15 dd 30"]
  );
  assert.deepEqual(
    Array.from(rules.processLine("2d 38 b40", "mt", mtSaturday)),
    ["2d 38 b20", "2d 38 b20"]
  );
  assert.deepEqual(
    Array.from(rules.processLine("4d 38 b30n dd60n", "mt", mtSaturday)),
    ["4d 38 b15n dd30n", "4d 38 b15n dd30n"]
  );
  assert.deepEqual(
    Array.from(rules.processLine("3d 38 b5n", "mt", mtSaturday)),
    ["3d 38 b2.5n", "3d 38 b2.5n"]
  );

  // XC/X không tách đài và không chia số lượng.
  assert.deepEqual(
    Array.from(rules.processLine("3d 68 69 70 xc 20n", "mt", mtSaturday)),
    ["3d 68 69 70 xc 20n"]
  );
  assert.deepEqual(
    Array.from(rules.processLine("3d 68 x20", "mt", mtSaturday)),
    ["3d 68 x20"]
  );

  // Mixed: tách ngang phần cược thường, XC đứng riêng và nguyên vẹn.
  assert.deepEqual(
    Array.from(rules.processLine("3d 851 b 10n xc 20n", "mt", mtSaturday)),
    ["3d 851 b 5n", "3d 851 b 5n", "3d 851 xc 20n"]
  );

  // Alias/đài full, DAT và chat filter vẫn giữ nguyên.
  assert.equal(rules.normalizeInput("Bến Tre Bạc Liêu Đà Nẵng Đắk Nông Quảng Ngãi bl"), "bt bli dn dno qn bli");
  assert.equal(rules.normalizeInput("ben tre bac lieu da nang dak nong quang ngai"), "bt bli dn dno qn");
  assert.doesNotThrow(() => rules.validateCheckOnlyLine("hue 71 dathang 2n", "mt", rules.getSchedule("mt", sunday)));
  assert.equal(Array.from(rules.processLine("tp 31 91 b10n da 5n", "mn", mnMonday))[0], "tp 31 91 b10n dat 5n");
  expectThrow(() => rules.validateCheckOnlyLine("tp 31 91 dx 5n", "mn", mnMonday), /1 đài 'tp' phải dùng 'dat'/);
  const chat = `[8/23/2026 5:31 PM] Hiền: 20 89 98 da 2n\n79 58 97 da 2n\n[8/23/2026 5:32 PM] Vinh: 1\n[8/23/2026 5:32 PM] Hiền: 25 52 50 da 2n`;
  assert.equal(rules.preprocessChatText(chat), "20 89 98 da 2n\n79 58 97 da 2n\n25 52 50 da 2n");

  // MB chỉ kiểm tra, không tách/cắt ngang.
  const mbLine = "79 da 30n";
  assert.doesNotThrow(() => rules.validateCheckOnlyLine(mbLine, "mb", rules.getSchedule("mb", saturday)));
  assert.deepEqual(Array.from(rules.processLine(mbLine, "mb", rules.getSchedule("mb", saturday))), [mbLine]);
  expectThrow(() => rules.validateCheckOnlyLine("79 30n", "mb", rules.getSchedule("mb", saturday)), /thiếu loại cược/);

  // Cut/Undo phải đồng bộ Input <-> Output khi một tin tạo hai dòng ngang.
  const ui = rules.elements;
  ui.region.value = "mt"; ui.date.value = "2026-08-22"; ui.today.checked = false;
  ui.input.value = "3d 38 b10n\n3d 68 xc 20n";
  rules.run();
  assert.equal(ui.output.value, "3d 38 b5n\n3d 38 b5n\n3d 68 xc 20n");
  ui.output.selectionStart = 0; ui.output.selectionEnd = "3d 38 b5n".length;
  await rules.cutSelectedOutput();
  assert.equal(ui.input.value, "3d 38 b10n\n3d 68 xc 20n");
  assert.equal(ui.output.value, "3d 38 b5n\n3d 68 xc 20n");
  ui.output.selectionStart = 0; ui.output.selectionEnd = "3d 38 b5n".length;
  await rules.cutSelectedOutput();
  assert.equal(ui.input.value, "3d 68 xc 20n");
  rules.triggerUndo();
  assert.equal(ui.input.value, "3d 38 b10n\n3d 68 xc 20n");
  assert.equal(ui.output.value, "3d 38 b5n\n3d 68 xc 20n");

  // PWA/offline/auto update cho subpath GitHub Pages.
  const appVersion = html.match(/const APP_VERSION = "([^"]+)"/);
  assert.ok(appVersion, "thiếu APP_VERSION");
  assert.equal(appVersion[1], version.version, "APP_VERSION và version.json lệch nhau");
  assert.match(sw, new RegExp(`CACHE_NAME = "tach-dai-ngang-v${appVersion[1].replaceAll(".", "\\.")}"`));
  assert.match(sw, new RegExp(`JSON\\.stringify\\(\\{version:"${appVersion[1].replaceAll(".", "\\.")}"\\}\\)`));
  assert.match(html, /serviceWorker\.register\("\.\/sw\.js", \{ scope: "\.\/" \}\)/);
  assert.match(html, /fetch\("\.\/version\.json\?t=" \+ Date\.now\(\), \{[\s\S]*?cache: "no-store"/);
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./index.html");
  assert.equal(manifest.scope, "./");
  assert.match(sw, /self\.skipWaiting\(\)/);
  assert.match(sw, /req\.mode === "navigate"/);

  console.log("HORIZONTAL RULES: PASS");
  console.log("DX/DA RULES: PASS");
  console.log("XC RULES: PASS");
  console.log("ALIASES/DAT/CHAT: PASS");
  console.log("MB CHECK: PASS");
  console.log("CUT/UNDO SYNC: PASS");
  console.log("PWA/OFFLINE/AUTO UPDATE: PASS");
}

main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
