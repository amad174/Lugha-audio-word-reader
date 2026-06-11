# Lugha

Interactive language learning — tap words on book pages to hear pronunciation. Firebase backend, Vercel frontend.

## Your turn (one-time)

Run these in your terminal after cloning:

```bash
npm install
cp .env.example .env.local   # already filled if you have keys
firebase login --reauth      # browser opens — sign in
npm run deploy:rules         # required or signup fails
npm start                    # http://localhost:3000
```

### Vercel

1. Push repo to GitHub
2. [vercel.com](https://vercel.com) → Import repo (CRA: build `npm run build`, output `build`)
3. Add env vars from `.env.local` (all `REACT_APP_*`, emulator = `false`)
4. Firebase Console → **Authentication → Authorized domains** → add `*.vercel.app`

---

## Features

- **Teachers:** org, categorized books, PDF import, word boxes, audio, student invites
- **Students:** invite code join, library, cloud progress

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests |
| `npm run test:integration` | Firebase emulator integration tests |
| `npm run deploy:rules` | Deploy Firestore + Storage rules |

## Architecture

- **Auth / DB / Files:** Firebase (`lughaapp`)
- **Hosting:** Vercel
- **Rules:** `firebase/firestore.rules`, `firebase/storage.rules`
