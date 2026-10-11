CO TUONG AI - PIKAFISH CLOUD

This is an integration template, not a live hosted cloud service.

1. Deploy cloud-server/server.js on a VPS or Node-compatible server (Node.js 20+).
2. Obtain the Linux native Pikafish executable AND matching pikafish.nnue from Pikafish's official releases. Ensure CPU architecture is correct, grant execute permission to binary.
3. Set PIKAFISH_PATH and PIKAFISH_NNUE to absolute paths (see cloud-server/.env.example). The sample file is DOCUMENTATION, not automatically loaded by Node.
4. Use HTTPS reverse proxy (Nginx/Caddy/hosting provider) to forward requests to port 8080. Do not expose the raw Node service over unencrypted HTTP in production.
5. Edit _redirects in website root to replace YOUR-CLOUD-SERVER.example.com with your real HTTPS cloud API hostname.
6. Upload website root (index.html, positions1000.js, _headers, _redirects and optional engine/) to Netlify. Choose Deploys > manual deploy.
7. Open /api/health from deployed site; ready:true means native binary and nnue are present. Click 'Ket noi Pikafish Cloud' and 'Kiem tra AI'.

Server: POST /api/analyze {fen:'startpos' | Xiangqi FEN,moves:['h2e2'],movetime:4500,nodes:1000000}; response {bestmove,score,scoreAvailable,depth,nps,nodes}.

CAUTION: Cloud server incurs infrastructure costs. Request processing is bounded; 5 seconds is the engine computation budget, not an end-to-end response guarantee. Queue overflow returns 429. Netlify itself cannot execute this native engine.
SECURITY: Configure HTTPS, domain/rate limits and optional protection upstream (Cloudflare WAF). API_TOKEN is only usable by private server-to-server callers, not browser JS; do not embed API_TOKEN in website. If site is public, endpoint is public and will need rate limits and abuse controls.
