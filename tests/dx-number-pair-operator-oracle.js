"use strict";
// Ngang: preserve 3d and full number group; DX 3n -> 1.5n + 1.5n, DA<5 unchanged.
// Node-only deterministic DOM harness. No Telegram, network, live stores or user sends.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=(name)=>fs.readFileSync(path.join(root,name),"utf8");
const html=read("index.html"),cal=read("station_calendar.generated.js"),engine=read("business_engine.generated.js");
const script=html.match(/<script>\s*([\s\S]*?)<\/script>/i)?.[1]?.split("loadSettings();")[0];
assert.ok(script,"embedded PWA script missing");
const elements={};let clipboard="",acceptReedit=false;
function element(){
  const e={children:[],events:{},style:{},value:"",textContent:"",className:"",
    checked:false,selectionStart:0,selectionEnd:0,
    addEventListener(k,fn){this.events[k]=fn},
    replaceChildren(...xs){this.children=xs},
    append(...xs){this.children.push(...xs)},
    appendChild(child){this.children.push(child);child.parentNode=this},
    setAttribute(){},removeAttribute(){},focus(){this.focused=true},select(){},remove(){},
    setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b},
    classList:{add(){},remove(){}}
  };return e;
}
const storage=new Map();
const ctx={console,Date,Set,Map,JSON,String,Number,Math,RegExp,Error,Array,Object,Promise,
  localStorage:{getItem(k){return storage.get(k)||null},setItem(k,v){storage.set(k,v)},removeItem(k){storage.delete(k)}},
  navigator:{clipboard:{async writeText(x){clipboard=x}}},
  document:{getElementById(id){return elements[id]||(elements[id]=element())},
    createElement:element,body:{appendChild(){}},execCommand(){return true},addEventListener(){}},
  location:{protocol:"https:"},
  setTimeout(fn){fn();return 1},clearTimeout(){},
  confirm(){return acceptReedit},CustomEvent:function(){},dispatchEvent(){}
};
ctx.window=ctx;
vm.createContext(ctx);
vm.runInContext(cal+"\n"+engine+"\n"+script+
  "\nglobalThis.__api={run,processLine,validateBatch,getSchedule,auditMoneyConservation,initGroupedResults,cutSelectedOutput,reeditOriginalAfterCut,records:()=>outputRecords.map(r=>({...r})),input:inputEl,output:outputEl,region:regionEl,date:dateEl};",
  ctx);
const a=ctx.__api;
async function main(){
  a.initGroupedResults();a.region.value="mn";a.date.value="2026-10-24";
  // Screenshot/user-approved oracle: NEVER turn 3d into 2d or named station pairs.
  const original="3d 00 11 22 33 dx3n",perRow="3d 00 11 22 33 dx1.5n";
  a.input.value=original;a.run();
  const rows=a.output.value.split("\n");
  assert.deepEqual(rows,[perRow,perRow],
    "Ngang must split DX 3n into two equal 1.5n shares, preserving 3d and numbers");
  assert.equal(a.auditMoneyConservation(original,rows,"mn").status,"PASS");
  assert.equal(a.auditMoneyConservation(original,rows.slice(1),"mn").status,"FAIL",
    "missing any DX share must fail independent money audit");
  assert.ok(a.records().every(r=>r.sourceLine===1));
  assert.deepEqual(Array.from(a.processLine("2d 28 82 dx 1n","mn",
    a.getSchedule("mn",new Date("2026-10-24T12:00:00+07:00")))),
    ["2d 28 82 dx 0.5n","2d 28 82 dx 0.5n"]);
  const four=Array.from(a.processLine("4d 28 82 68 86 dx 3n","mn",
    a.getSchedule("mn",new Date("2026-10-24T12:00:00+07:00"))));
  assert.deepEqual(four,["4d 28 82 68 86 dx 1.5n","4d 28 82 68 86 dx 1.5n"]);
  assert.equal(a.auditMoneyConservation("4d 28 82 68 86 dx 3n",four,"mn").status,"PASS");
  const first=elements.resultGroups.children[0].children[1].children[0];
  first.checked=true;first.events.change();await a.cutSelectedOutput();
  assert.equal(clipboard,perRow);
  assert.equal(a.output.value,perRow,"cut only one of two equal DX shares");
  const cutOutput=a.output.value,ledger=a.input.value;
  a.run();assert.equal(a.output.value,cutOutput,"no resurrection after Cut and rerun");
  a.reeditOriginalAfterCut();assert.equal(a.input.value,ledger,"cancel reedit preserves pending DX");
  acceptReedit=true;a.reeditOriginalAfterCut();
  assert.equal(a.input.value,original);assert.equal(a.output.value,"");
  assert.notEqual(a.input.style.display,"none");
  elements.undoBtn.events.click();
  assert.equal(a.input.value,ledger);assert.equal(a.output.value,cutOutput);
  elements.undoBtn.events.click();
  assert.equal(a.input.value,original);assert.equal(a.output.value,rows.join("\n"));
  const da="3d 12 52 92 da 1n";a.input.value=da;a.run();
  assert.equal(a.output.value,da,"DA <5 remains one Ngang wager");
  const da7="3d 12 52 92 da 7n";a.input.value=da7;a.run();
  assert.deepEqual(a.output.value.split("\n"),[
    "3d 12 52 92 da 3n","3d 12 52 92 da 4n"
  ]);
  assert.equal(a.auditMoneyConservation(da7,a.output.value.split("\n"),"mn").status,"PASS");
  const mixed="3d 12 52 92 b 10n dx3n";a.input.value=mixed;a.run();
  assert.deepEqual(a.output.value.split("\n"),[
    "3d 12 52 92 b 5n","3d 12 52 92 b 5n",
    "3d 12 52 92 dx1.5n","3d 12 52 92 dx1.5n"
  ]);
  assert.equal(a.auditMoneyConservation(mixed,a.output.value.split("\n"),"mn").status,"PASS");
  const xc="3d 12 52 92 xc 10n";a.input.value=xc;a.run();
  assert.equal(a.output.value,xc,"XC remains intact");
  const invalid=original+"\n3d 12 12 92 dx 1n";a.input.value=invalid;a.run();
  assert.equal(a.records().length,0);assert.match(a.output.value,/^PHÁT HIỆN TIN SAI:/);
  a.input.value="3d 12 345 92 dx 1n";a.run();
  assert.equal(a.records().length,0);assert.match(a.output.value,/^PHÁT HIỆN TIN SAI:/);
  console.log("NGANG DX HORIZONTAL SCREENSHOT + CUT/UNDO/REEDIT: PASS");
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
