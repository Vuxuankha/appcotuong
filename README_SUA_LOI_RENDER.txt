PIKAFISH RENDER - SUA LOI COMPILER (11/10/2026)

Loi cu: invalid cpu feature string for builtin (vaes, avxvnni) khi build x86-64-universal voi Clang.
Thay doi: build ARCH=x86-64 COMP=gcc truoc; fallback ARCH=x86-64 COMP=clang. Khong dung x86-64-universal.

1. Giai nen ZIP. Upload tat ca tep trong api/ len thu muc api/ cua repository GitHub (ghi de cac tep cu).
2. Render: Runtime Docker; Root Directory api; Dockerfile Path ./Dockerfile.
3. Commit thay doi; Manual Deploy -> Deploy latest commit.
4. Neu build van fail, xem BUILD COMMAND va compiler error trong Render Logs.

Da kiem tra cu phap Python va Node.js; CHUA test Docker build tren Render va chua cam ket engine chay thanh cong.
