'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const {spawn}=require('node:child_process');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pikafish-test-'));const bin=path.join(dir,'pikafish');const nnue=path.join(dir,'pikafish.nnue');
fs.writeFileSync(nnue,'fake test net');
fs.writeFileSync(bin,`#!/usr/bin/env node
process.stdin.setEncoding('utf8');let s='';process.stdin.on('data',chunk=>{s+=chunk;let ix;while((ix=s.indexOf('\\n'))>=0){let line=s.slice(0,ix).trim();s=s.slice(ix+1);if(line==='uci')process.stdout.write('id name MockPikafish\\nuciok\\n');if(line==='isready')process.stdout.write('readyok\\n');if(line.startsWith('go '))process.stdout.write('info depth 12 nodes 12345 nps 10000 score cp 42\\nbestmove h2e2\\n');}});`);
fs.chmodSync(bin,0o755);const port=18279;
const server=spawn(process.execPath,[path.join(__dirname,'server.js')],{env:{...process.env,PIKAFISH_PATH:bin,PIKAFISH_NNUE:nnue,PORT:String(port)}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{await sleep(450);const health=await(await fetch(`http://127.0.0.1:${port}/api/health`)).json();assert.equal(health.ready,true);
let response=await fetch(`http://127.0.0.1:${port}/api/analyze`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({fen:'startpos',moves:[],movetime:300})});assert.equal(response.status,200);let result=await response.json();assert.equal(result.bestmove,'h2e2');assert.equal(result.score,42);
response=await fetch(`http://127.0.0.1:${port}/api/analyze`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({fen:'startpos',moves:['illegal'],movetime:300})});assert.equal(response.status,400);
console.log('PASS: health / UCI protocol / score / bestmove / invalid move');}catch(e){console.error(e);process.exitCode=1}finally{server.kill('SIGTERM');fs.rmSync(dir,{recursive:true,force:true})}})();
