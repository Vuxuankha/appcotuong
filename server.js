// Dedicated random localhost port prevents opening another user's app on 8765.
const http=require('http'),fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname);const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.wasm':'application/wasm','.nnue':'application/octet-stream','.css':'text/css'};
const server=http.createServer((req,res)=>{
 let u;try{u=new URL(req.url,'http://localhost')}catch(e){res.writeHead(400);return res.end('Bad URL')}
 let rel;try{rel=decodeURIComponent(u.pathname)}catch(e){res.writeHead(400);return res.end('Bad path')}
 const target=path.resolve(root,'.'+(rel==='/'?'/index.html':rel));
 if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden')}
 fs.stat(target,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404);return res.end('Not found')}
 res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Content-Length':stat.size,'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','Cross-Origin-Resource-Policy':'same-origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});fs.createReadStream(target).pipe(res)})
});
server.listen(0,'127.0.0.1',()=>{const addr=`http://127.0.0.1:${server.address().port}/?co_tuong=1`;console.log('CO TUONG AI: '+addr);if(process.platform==='win32')cp.spawn('cmd',['/c','start','',addr],{detached:true,stdio:'ignore'}).unref();});
server.on('error',e=>{console.error('Khong the khoi dong:',e.message);process.exitCode=1});
