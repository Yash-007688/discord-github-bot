# Discord GitHub Bot

A Discord bot that posts GitHub webhook events into your Discord channel and provides slash commands for GitHub user/repo/activity data.

## Features

- `/github-user username:<name>` - profile stats, followers, repos, join date
- `/github-repo owner:<owner> repo:<repo>` - stars, forks, issues, language, visibility
- `/github-activity username:<name>` - latest 5 public events
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

- The bot uses only public GitHub data for slash commands.
- Private repo events in webhooks still send payload metadata if your webhook has access.
- For production, deploy on a stable host and protect webhook endpoint with a secret/signature check.
