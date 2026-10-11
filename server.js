'use strict';
// Pikafish native engine API (Node 20+, no third-party dependencies).
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const ENGINE=process.env.PIKAFISH_PATH||path.join(__dirname,'pikafish');
const NNUE=process.env.PIKAFISH_NNUE||path.join(__dirname,'pikafish.nnue');
const PORT=Number(process.env.PORT||8080);
const THREADS=Math.max(1,Math.min(16,Number(process.env.THREADS||2)));
const HASH=Math.max(16,Math.min(1024,Number(process.env.HASH_MB||128)));
const ACCESS_TOKEN=process.env.API_TOKEN||'';
let active=0;const MAX_ACTIVE=Math.max(1,Math.min(8,Number(process.env.MAX_ACTIVE||2)));
const buckets=new Map();
const validMove=/^[a-i][0-9][a-i][0-9]$/;
const validFen=/^[rheakcpRHEAKCP1-9\/\swb-]+$/;
function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj))}
function engineReady(){return fs.existsSync(ENGINE)&&fs.existsSync(NNUE)}
function analyze({fen,moves,movetime,nodes}){
 return new Promise((resolve,reject)=>{
  let finished=false,child;
  try{child=spawn(ENGINE,[],{cwd:path.dirname(ENGINE),stdio:['pipe','pipe','pipe']});}catch(e){reject(e);return}
  const close=(error,result)=>{if(finished)return;finished=true;clearTimeout(watchdog);try{child.kill('SIGKILL')}catch(_){};error?reject(error):resolve(result)};
  const watchdog=setTimeout(()=>close(Error('Engine quá thời gian')),Math.min(13000,movetime+6000));
  let buf='',score=null,depth=0,nps=0,nodesSearched=0,phase='uci';
  const cmd=v=>{if(!child.killed&&child.stdin.writable)child.stdin.write(v+'\n')};
  child.on('error',e=>close(e));
  child.on('exit',(code)=>{if(!finished)close(Error('Engine thoát mã '+code))});
  child.stdout.on('data',chunk=>{
   buf+=chunk.toString('utf8');if(buf.length>500000)buf=buf.slice(-50000);
   let pos;while((pos=buf.indexOf('\n'))>=0){const line=buf.slice(0,pos).trim();buf=buf.slice(pos+1);
    if(phase==='uci'&&line==='uciok'){
     phase='ready';cmd('setoption name Threads value '+THREADS);cmd('setoption name Hash value '+HASH);
     cmd('setoption name EvalFile value '+NNUE);cmd('isready');continue;
    }
    if(phase==='ready'&&line==='readyok'){
      phase='search';cmd(fen==='startpos'?'position startpos'+(moves.length?' moves '+moves.join(' '):''):'position fen '+fen+(moves.length?' moves '+moves.join(' '):''));
      cmd('go movetime '+movetime+(nodes>0?' nodes '+nodes:''));continue;
    }
    if(phase==='search'){
      let info=line.match(/\bscore cp (-?\d+)/),mate=line.match(/\bscore mate (-?\d+)/),d=line.match(/\bdepth (\d+)/),n=line.match(/\bnps (\d+)/),ns=line.match(/\bnodes (\d+)/);
      if(info)score=Number(info[1]);if(mate)score=Number(mate[1])>=0?10000:-10000;
      if(d)depth=Number(d[1]);if(n)nps=Number(n[1]);if(ns)nodesSearched=Number(ns[1]);
      const best=line.match(/^bestmove\s+(\S+)/);if(best){if(best[1]!=='(none)'&&!validMove.test(best[1]))close(Error('Engine trả nước không hợp lệ'));else close(null,{bestmove:best[1],score,scoreAvailable:score!==null,depth,nps,nodes:nodesSearched,engine:'pikafish-cloud'});}
    }
   }
  });
  cmd('uci');
 });
}
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&url.pathname==='/api/health')return json(res,200,{ready:engineReady(),engine:'Pikafish native',message:engineReady()?'Sẵn sàng':'Thiếu PIKAFISH_PATH hoặc PIKAFISH_NNUE'});
 if(req.method!=='POST'||url.pathname!=='/api/analyze')return json(res,404,{error:'Không tìm thấy API'});
 if(!engineReady())return json(res,503,{error:'Máy chủ chưa cài Pikafish native và NNUE'});
 if(ACCESS_TOKEN&&req.headers.authorization!=='Bearer '+ACCESS_TOKEN)return json(res,401,{error:'Không có quyền truy cập'});
 const ip=req.socket.remoteAddress||'unknown',now=Date.now(),recent=(buckets.get(ip)||[]).filter(t=>now-t<60000);
 if(recent.length>=30)return json(res,429,{error:'Giới hạn 30 lượt phân tích mỗi phút'});
 recent.push(now);buckets.set(ip,recent);if(buckets.size>5000)buckets.clear();
 if(active>=MAX_ACTIVE)return json(res,429,{error:'Máy chủ đang bận. Vui lòng thử lại.'});
 let raw='';try{for await(const chunk of req){raw+=chunk.toString();if(raw.length>16000)throw Error('Dữ liệu quá lớn')}}catch(e){return json(res,413,{error:e.message})}
 let data;try{data=JSON.parse(raw)}catch(_){return json(res,400,{error:'JSON không hợp lệ'})}
 const fen=data.fen||'startpos',moves=data.moves||[];
 if((fen!=='startpos'&&(typeof fen!=='string'||fen.length>140||!validFen.test(fen)))||!Array.isArray(moves)||moves.length>300||!moves.every(m=>typeof m==='string'&&validMove.test(m)))return json(res,400,{error:'Vị trí hoặc nước đi không hợp lệ'});
 const movetime=Math.max(100,Math.min(4500,Number(data.movetime)||1500));
 const nodes=Math.max(0,Math.min(50000000,Math.floor(Number(data.nodes)||0)));
 active++;try{const result=await analyze({fen,moves,movetime,nodes});json(res,200,result)}catch(e){json(res,502,{error:e.message})}finally{active--}
});
server.listen(PORT,'0.0.0.0',()=>console.log(`Pikafish Cloud API listening on ${PORT}; engine ${ENGINE}`));
