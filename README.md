# Discord GitHub Bot (Advanced)

Professional Discord GitHub bot with modular architecture, premium embeds, webhook security, and production-focused runtime guards.

## Features

- Auto slash command registration on startup
- Modular folders: `commands/`, `events/`, `utils/`, `config/`
- Advanced commands: streak, leaderboard, trending, compare, readme, chart
- Webhook signature verification with `GITHUB_WEBHOOK_SECRET`
- Anti-crash guards for uncaught exceptions and unhandled rejections
- Status rotation and reconnect fallback handling
- JSON database for command usage + contributor leaderboard (`data/stats.json`)

## Commands

- `/github-me`
- `/github-summary`
- `/github-repo`
- `/github-activity`
- `/github-top-repos`
- `/github-languages`
- `/github-streak`
- `/github-leaderboard`
- `/github-chart`
- `/github-trending`
- `/github-compare`
- `/github-readme`

## Environment Setup

Copy `.env.example` to `.env` and fill:

- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID`
- `DISCORD_CHANNEL_ID`
- `DISCORD_PUBLIC_KEY` (for Vercel interactions endpoint)
- `GITHUB_TOKEN` (recommended)
- `GITHUB_USERNAME`
- `GITHUB_WEBHOOK_SECRET` (recommended)
- `WEBHOOK_PORT`

## Run Locally

```bash
npm install
npm start
```

## Vercel Endpoints

- `POST /interactions` -> `api/interactions.js`
- `POST /github-webhook` -> `api/github-webhook.js`