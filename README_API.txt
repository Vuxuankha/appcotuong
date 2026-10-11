RENDER DEPLOY SOURCE BUILD - 2026-10-11
1. Upload whole api/ directory to GitHub (files not a ZIP).
2. Render: Runtime Docker; Root Directory api; Dockerfile Path ./Dockerfile; branch main.
3. Commit and deploy latest commit. Build uses official Pikafish release source and official Networks master-net instead of finding a Linux archive name.
4. This build has NOT been tested on Render. The NNUE master-net can be incompatible with an older source tag; inspect UCI logs and confirm a valid bestmove.
5. Render Free 0.1 CPU/512MB could hit build-time resource limits or slow analysis. A successful Docker build does not guarantee engine quality or a 5-second response.
