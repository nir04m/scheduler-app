# Scheduler Frontend - Move / Run Instructions

This ZIP is a complete Next.js frontend based on the approved Figma design.

## Recommended way to install it

From the root of your existing repository:

```bash
cd ~/Documents/scheduler-app
```

### 1. Back up the client you already created

```bash
mv client client-backup
```

### 2. Extract this ZIP

Extract `scheduler-frontend.zip`.

It creates a folder named:

```text
scheduler-frontend/
```

Rename it:

```bash
mv scheduler-frontend client
```

Your repository should now look like:

```text
scheduler-app/
├── server/
└── client/
```

### 3. Install dependencies

```bash
cd client
npm install
```

### 4. Create the local environment file

```bash
cp .env.example .env.local
```

`.env.local` contains the Render backend address:

```env
BACKEND_API_URL=https://scheduler-app-tto3.onrender.com
```

The browser does NOT call Render directly. Next.js proxies requests through
`/api/backend/...`, which avoids local-development CORS problems.

### 5. Run locally

```bash
npm run dev
```

The dev script already binds Next.js to `0.0.0.0`.

If you access the dev server from another computer, keep your existing
`allowedDevOrigins` setting in `next.config.ts`. This ZIP intentionally does
not contain any local-network IP addresses.

### 6. Test the frontend

Create a poll first.

Expected flow:

```text
Create poll
  -> Render API
  -> Prisma
  -> Supabase
  -> Poll-created/share screen
  -> Participant page
  -> Vote
  -> Results
  -> Organizer page
  -> Finalize
```

### 7. Run checks

```bash
npm run lint
npm run build
```

## Important

- Do not copy `.env` or `.env.local` to Git.
- The organizer credential is stored locally and private organizer links use
  the URL fragment (`#token=...`), so the token is not sent to Next.js as part
  of the HTTP request.
- Participant edit tokens are kept in browser localStorage for that poll.
- The Render URL is server-side through `BACKEND_API_URL`; when deploying to
  Vercel, add the same variable in Vercel's Environment Variables.
