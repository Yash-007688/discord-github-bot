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
- `GITHUB_TOKEN`: Optional but recommended for higher API limits
- `GITHUB_USERNAME`: Your GitHub username (bot is restricted to this account)
- `WEBHOOK_PORT`: Local webhook server port (default `3000`)

## 3) Register slash commands

```bash
npm run register
```

## 4) Run bot

```bash
npm start
```

## 5) Connect GitHub webhook

In your GitHub repository:

1. Open **Settings -> Webhooks -> Add webhook**
2. Set payload URL to:
   - `http://YOUR_PUBLIC_HOST:3000/github-webhook`
3. Content type: `application/json`
4. Choose events:
   - Pushes
   - Pull requests
   - Issues
5. Save webhook

If testing locally, expose port with tools like `ngrok`:

```bash
ngrok http 3000
```

Then use the generated public URL in GitHub webhook settings.

## Notes

- Commands now return data only for the configured `GITHUB_USERNAME`.
- For production, deploy on a stable host and protect webhook endpoint with a secret/signature check.