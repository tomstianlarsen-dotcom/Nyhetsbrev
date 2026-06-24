<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Halogen Nyhetsbrevverktøy

Internt nyhetsbrevverktøy (React + Vite + Firebase/Firestore) med bildehosting i GitHub og proxy via Vercel.

Bilder lagres på GitHub, men e-post og online-visning serverer dem via `nyhetsbrev-phi.vercel.app/api/image` slik at mottakere (f.eks. OUS) ikke eksponeres for `raw.githubusercontent.com`.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set `VITE_APP_URL` + GitHub config for uploads
3. Run the app:
   `npm run dev`

Upload via bildebiblioteket krever `vercel dev` eller produksjon (GitHub-token ligger på server).
