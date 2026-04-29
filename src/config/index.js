import dotenv from "dotenv";

dotenv.config();

const required = [
  "DISCORD_BOT_TOKEN",
  "DISCORD_CLIENT_ID",
  "DISCORD_GUILD_ID",
  "GITHUB_USERNAME",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = {
  discordToken: process.env.DISCORD_BOT_TOKEN,
  discordClientId: process.env.DISCORD_CLIENT_ID,
  discordGuildId: process.env.DISCORD_GUILD_ID,
  discordChannelId: process.env.DISCORD_CHANNEL_ID || "",
  discordPublicKey: process.env.DISCORD_PUBLIC_KEY || "",
  githubToken: process.env.GITHUB_TOKEN || "",
  githubUsername: process.env.GITHUB_USERNAME,
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || "",
  webhookPort: Number(process.env.WEBHOOK_PORT || 3000),
};
