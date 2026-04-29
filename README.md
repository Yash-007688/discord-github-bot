# Discord GitHub Bot

A Discord bot that posts GitHub webhook events into your Discord channel and provides advanced slash commands for your personal GitHub stats.

## Features

- Locked mode: bot serves only your configured GitHub account (`GITHUB_USERNAME`)
- `/github-me` - profile stats, followers, repos, join date
- `/github-summary` - advanced totals across your public repos
- `/github-repo repo:<name>` - detailed stats for your repository
- `/github-activity [limit]` - latest public events from your account
- `/github-top-repos [limit]` - top repos by stars
- `/github-languages` - language distribution in your repos
- GitHub webhook endpoint: `POST /github-webhook`
  - Supports detailed embeds for `push`, `pull_request`, and `issues`
  - Other events are posted in a generic format

## 1) Install

```bash
npm install
```

## 2) Configure env

Copy `.env.example` to `.env` and fill values:

- `DISCORD_BOT_TOKEN`: Bot token from Discord developer portal
- `DISCORD_CLIENT_ID`: Application ID
- `DISCORD_GUILD_ID`: Your Discord server (guild) ID
- `DISCORD_CHANNEL_ID`: Channel ID where webhook updates will be sent
- `DISCORD_PUBLIC_KEY`: Public key from Discord app (for interaction signature verify)
- `GITHUB_TOKEN`: Optional but recommended for higher API limits
- `GITHUB_USERNAME`: Your GitHub username (bot is restricted to this account)
- `GITHUB_WEBHOOK_SECRET`: Optional but recommended to verify webhook signatures
- `WEBHOOK_PORT`: Local webhook server port (default `3000`)

## 3) Register slash commands

```bash
npm run register
```

## 4) Vercel setup (slash commands + webhook)

This project now supports Vercel serverless endpoints:

- Discord interactions endpoint: `POST /interactions` (file: `api/interactions.js`)
- GitHub webhook endpoint: `POST /github-webhook` (file: `api/github-webhook.js`)

Steps:

1. Import this repository into Vercel
2. Add env vars in Vercel project settings:
   - `DISCORD_BOT_TOKEN`
   - `DISCORD_CHANNEL_ID`
   - `DISCORD_PUBLIC_KEY`
   - `GITHUB_TOKEN` (recommended)
   - `GITHUB_USERNAME`
   - `GITHUB_WEBHOOK_SECRET` (recommended)
3. Deploy and copy your project URL
4. In Discord Developer Portal:
   - Open your application -> **General Information**
   - Set **Interactions Endpoint URL** to:
     - `https://YOUR-VERCEL-DOMAIN/interactions`
5. In GitHub webhook settings, set payload URL:
   - `https://YOUR-VERCEL-DOMAIN/github-webhook`
6. If using webhook secret, set same value in GitHub settings

## 5) Optional local gateway mode

If you still want to run the classic websocket bot locally:

```bash
npm start
```

## Notes

- Commands now return data only for the configured `GITHUB_USERNAME`.
- For production, always configure `DISCORD_PUBLIC_KEY` and `GITHUB_WEBHOOK_SECRET`.