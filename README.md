# YouTube Multi-Publisher

A full-stack application to publish the same video to multiple YouTube channels from a single upload.

## Stack

- **Backend**: Express.js + TypeScript
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Queue**: BullMQ + Redis
- **Auth**: JWT + Google OAuth 2.0
- **YouTube API**: googleapis (YouTube Data API v3)

## Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Google Cloud project with YouTube Data API v3 enabled

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` — Random secret for JWT signing
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — From Google Cloud Console
- `GOOGLE_REDIRECT_URI` — Must match what you set in Google Cloud Console (`http://localhost:3001/api/accounts/oauth/callback`)

### 3. Database

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run

```bash
# From root — runs API (port 3001) and Web (port 3000)
npm run dev
```

Or separately:

```bash
# API
npm run dev -w apps/api

# Web
npm run dev -w apps/web

# Worker (separate terminal)
cd apps/api && npx ts-node-dev src/workers/uploadWorker.ts
```

### 5. First-time setup

Visit `http://localhost:3000` and click **"Create admin account"** to create your first admin user.

## Usage

1. **Connect Accounts** — Go to Accounts and click "Connect Account" to link YouTube channels via Google OAuth.
2. **Upload Video** — Go to Upload and drag-and-drop a video file.
3. **Create Campaign** — Go to Campaigns → New Campaign, select the video, choose channels, set per-channel metadata.
4. **Publish** — Open the campaign and click "Publish" to enqueue upload jobs.
5. **Monitor** — The campaign detail page auto-refreshes every 5 seconds showing upload progress.

## Project Structure

```
apps/
  api/          # Express API (port 3001)
    src/
      routes/   # REST endpoints
      services/ # YouTube API, OAuth, Queue
      workers/  # BullMQ upload worker
      middleware/
  web/          # Next.js frontend (port 3000)
    src/
      app/      # Pages (App Router)
      lib/      # API client
prisma/         # (see apps/api/prisma/)
uploads/        # Video storage
```

## Google Cloud Setup

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable **YouTube Data API v3**
3. Create OAuth 2.0 credentials (Web application)
4. Add `http://localhost:3001/api/accounts/oauth/callback` as an authorized redirect URI
5. Copy Client ID and Secret to `.env`
