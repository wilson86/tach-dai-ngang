'use strict';
// Production-safety regression: Ngang SW must not delete Mobile/Unified caches
// sharing the wilson86.github.io origin.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
async function activate(names){
  const listeners=Object.create(null),deleted=[];
  const self={
    addEventListener(name,handler){listeners[name]=handler},
    clients:{claim:async()=>true},
    skipWaiting:async()=>true
  };
  const caches={
    keys:async()=>names.slice(),
    delete:async name=>{deleted.push(name);return true}
  };
  vm.runInNewContext(sw,{self,caches,URL,Response,fetch:async()=>{throw Error('offline fixture')}}); 
  assert.equal(typeof listeners.activate,'function');
  let promise;
  listeners.activate({waitUntil(value){promise=Promise.resolve(value)}});
  assert.ok(promise,'activate must install a waitUntil promise');
  await promise;
  return deleted;
}

test('activation deletes only stale Ngang cache, not Mobile/Unified',async()=>{
  const names=[
    'tach-dai-mobile-v2.0.38-duplicate-number-confirmation',
    'kts-tach-unified-v1.0.27-duplicate-approval-7952aa',
    'tach-dai-ngang-v1.0.34-duplicate-number-confirmation',
    'tach-dai-ngang-v1.0.37-duplicate-number-confirmation',
    'other-unrelated-app-v9'
  ];
  assert.deepEqual(await activate(names),
    ['tach-dai-ngang-v1.0.34-duplicate-number-confirmation']);
});
test('activation with no stale Ngang cache never deletes another app',async()=>{
  const names=['tach-dai-mobile-v2.0.38-duplicate-number-confirmation',
    'kts-tach-unified-v1.0.27-duplicate-approval-7952aa',
    'tach-dai-ngang-v1.0.37-duplicate-number-confirmation'];
  assert.deepEqual(await activate(names),[]);
});

test('multiple stale Ngang caches are cleared, near-match foreign cache remains',async()=>{
  const names=[
    'tach-dai-ngang-v1.0.31-duplicate-number-confirmation',
    'tach-dai-ngang-v1.0.34-duplicate-number-confirmation',
    'tach-dai-ngang-v1.0.35-duplicate-number-confirmation',
    'tach-dai-ngang-v1.0.36-duplicate-number-confirmation',
    'tach-dai-ngang-v1.0.37-duplicate-number-confirmation',
    'tach-dai-ngangcustom-v99',
    'tach-dai-mobile-v2.0.38-duplicate-number-confirmation',
    'kts-tach-unified-v1.0.27-duplicate-approval-7952aa'
  ];
  assert.deepEqual(await activate(names),[
    'tach-dai-ngang-v1.0.31-duplicate-number-confirmation',
    'tach-dai-ngang-v1.0.34-duplicate-number-confirmation',
    'tach-dai-ngang-v1.0.35-duplicate-number-confirmation',
    'tach-dai-ngang-v1.0.36-duplicate-number-confirmation'
  ]);
});
