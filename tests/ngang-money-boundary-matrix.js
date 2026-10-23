"use strict";
// Independent stake-money matrix for Ngang. No network, no real customers, no sends.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("index.html"),calendar=read("station_calendar.generated.js"),engine=read("business_engine.generated.js");
const embedded=html.match(/<script>\s*([\s\S]*?)<\/script>/i)?.[1];
assert.ok(embedded,"no Ngang script");
const dom={};
function element(){return {value:"",style:{},textContent:"",addEventListener(){},focus(){},setSelectionRange(){}}}
const ctx={console,Date,Set,Map,String,Number,Math,RegExp,Error,Array,Object,Promise,
  navigator:{clipboard:{async writeText(){}}},
  document:{getElementById(id){return dom[id]||(dom[id]=element())},createElement:element,body:{appendChild(){}},execCommand(){return true}},
  localStorage:{getItem(){return null},setItem(){},removeItem(){}},location:{protocol:"https:"}};
ctx.window=ctx;
vm.createContext(ctx);
vm.runInContext(calendar+"\n"+engine+"\n"+embedded.split("loadSettings();")[0]+
  "\nglobalThis.moneyApi={processLine,validateBatch,getSchedule,auditMoneyConservation};",ctx);
const api=ctx.moneyApi;
const amounts=[0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10,10.5,30,61,99.5];
const profiles=[
  ["mn","2026-10-24T12:00:00+07:00","3d 28 82 68 86",3,["b","dd","da","xc","dx"]],
  ["mt","2026-08-22T12:00:00+07:00","3d 28 82 68 86",3,["b","dd","da","xc","dx"]],
  ["mn","2026-10-24T12:00:00+07:00","2d 28 82",1,["b","dd","da","xc","dx"]],
  ["mn","2026-10-24T12:00:00+07:00","4d 28 82 68 86",6,["b","dd","da","xc","dx"]],
  ["mb","2026-10-16T12:00:00+07:00","79 82",1,["b","dd","da","dat","dathang","xc","dx"]],
  ["mn","2026-10-24T12:00:00+07:00","tp 28 82",1,["b","dd","da","dat","dathang","xc"]]
];
let tested=0;
for(const [region,date,head,routes,selectors] of profiles){
  const stations=api.getSchedule(region,new Date(date));
  for(const selector of selectors)for(const amount of amounts){
    const source=head+" "+selector+" "+amount+"n";
    const errors=api.validateBatch(source,region,stations);
    assert.equal(errors.length,0,"unexpected validation: "+source);
    const rows=Array.from(api.processLine(source,region,stations));
    const expectedHalfUnits=Math.round(amount*2);
    let observedHalfUnits=0;
    for(const row of rows){
      const wagers=[...row.matchAll(/\b(?:dathang|dat|da|dd|dx|xc|b)\s*(\d+(?:[.,]\d+)?)(?:n|d|đ)?\b/giu)];
      observedHalfUnits+=wagers.reduce((sum,entry)=>sum+Math.round(Number(entry[1].replace(",","."))*2),0);
    }
    assert.equal(observedHalfUnits,expectedHalfUnits,"money mismatch "+source+" => "+rows.join(" | "));
    assert.equal(api.auditMoneyConservation(source,rows,region).status,"PASS","internal audit mismatch "+source);
    if(selector==="da"||selector==="dat"||selector==="dathang"){
      assert.equal(rows.length,amount<5?1:2,"Ngang DA threshold mismatch: "+source);
    }
    if(selector==="dx"){
      assert.equal(rows.length,amount===0.5?1:2,"Ngang DX must split one amount into two horizontal shares when possible: "+source);
      assert.ok(rows.every(row=>row.startsWith(head+" ")),"Ngang DX must retain original station selector and all numbers: "+source);
      if(Math.round(amount*2)%2===0){
        const expectedShare=amount/2;
        assert.ok(rows.every(row=>new RegExp("\\bdx\\s*"+String(expectedShare).replace(".","\\.")+"n$","u").test(row)),
          "Ngang DX divisible half-unit money must be equal: "+source+" => "+rows.join(" | "));
      }
    }
    if(selector==="xc")assert.equal(rows.length,1,"XC no split: "+source);
    tested++;
  }
}
assert.equal(tested,792);
console.log("NGANG MONEY BOUNDARY 792/792 PASS (DX horizontal half-unit sharing, DA threshold, MN/MT/MB)");
