"use strict";
// Ngang-specific DX/DA: preserve one atomic number group per station pair; DA under 5 must not split.
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
  const original="3d 28 82 68 86 dx 1n";
  a.input.value=original;a.run();
  const rows=a.output.value.split("\n");
  assert.deepEqual(rows,[
    "2d 28 82 68 86 dx 1n",
    "tp bp 28 82 68 86 dx 1n",
    "la bp 28 82 68 86 dx 1n"
  ], "Ngang DX keeps whole number group and primary 2d, unlike Mobile");
  assert.equal(new Set(rows).size,3);
  assert.ok(a.records().every(r=>r.sourceLine===1));
  assert.equal(a.auditMoneyConservation(original,rows,"mn").status,"PASS");
  assert.equal(a.auditMoneyConservation(original,rows.slice(1),"mn").status,"FAIL",
    "missing primary wager must fail money audit");
  // Idempotence of the abstract primary pair; no station-name substitution.
  assert.deepEqual(a.processLine("2d 28 82 dx 1n","mn",
    a.getSchedule("mn",new Date("2026-10-24T12:00:00+07:00"))),
    ["2d 28 82 dx 1n"]);
  const four=a.processLine("4d 28 82 68 86 dx 1n","mn",
    a.getSchedule("mn",new Date("2026-10-24T12:00:00+07:00")));
  assert.equal(four.length,6);
  assert.equal(four[0],"2d 28 82 68 86 dx 1n");
  assert.ok(four.slice(1).every(x=>!x.startsWith("2d ")));
  assert.equal(a.auditMoneyConservation("4d 28 82 68 86 dx 1n",four,"mn").status,"PASS");
  const first=elements.resultGroups.children[0].children[1].children[0];
  first.checked=true;first.events.change();await a.cutSelectedOutput();
  assert.equal(clipboard,rows[0]);assert.equal(a.output.value.split("\n").length,2);
  const cutOutput=a.output.value,ledger=a.input.value;
  a.run();assert.equal(a.output.value,cutOutput,"no resurrection after run");
  a.reeditOriginalAfterCut();assert.equal(a.input.value,ledger,"reedit cancel preserves ledger");
  acceptReedit=true;a.reeditOriginalAfterCut();
  assert.equal(a.input.value,original);assert.equal(a.output.value,"");
  assert.notEqual(a.input.style.display,"none");
  elements.undoBtn.events.click();
  assert.equal(a.input.value,ledger);assert.equal(a.output.value,cutOutput);
  elements.undoBtn.events.click();
  assert.equal(a.input.value,original);assert.equal(a.output.value,rows.join("\n"));
  const da="3d 12 52 92 da 1n";a.input.value=da;a.run();
  assert.equal(a.output.value,da,"DA < 5 is one Ngang row, not Đá Vòng");
  assert.equal(a.auditMoneyConservation(da,[a.output.value],"mn").status,"PASS");
  const da7="3d 12 52 92 da 7n";a.input.value=da7;a.run();
  assert.deepEqual(a.output.value.split("\n"),[
    "3d 12 52 92 da 3n","3d 12 52 92 da 4n"
  ],"DA 7 uses floor/ceil instead of number-pair expansion");
  assert.equal(a.auditMoneyConservation(da7,a.output.value.split("\n"),"mn").status,"PASS");
  const mixed="3d 12 52 92 b 10n da 1n";a.input.value=mixed;a.run();
  assert.deepEqual(a.output.value.split("\n"),[
    "3d 12 52 92 b 5n da 1n","3d 12 52 92 b 5n"
  ]);
  assert.equal(a.auditMoneyConservation(mixed,a.output.value.split("\n"),"mn").status,"PASS");
  const xc="3d 12 52 92 xc 10n";a.input.value=xc;a.run();
  assert.equal(a.output.value,xc,"XC never splits horizontally");
  const invalid=original+"\n3d 12 12 92 dx 1n";a.input.value=invalid;a.run();
  assert.equal(a.records().length,0);assert.match(a.output.value,/^PHÁT HIỆN TIN SAI:/);
  a.input.value="3d 12 345 92 dx 1n";a.run();
  assert.equal(a.records().length,0);assert.match(a.output.value,/^PHÁT HIỆN TIN SAI:/);
  console.log("DX NUMBER PAIR OPERATOR QA: PASS");
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
