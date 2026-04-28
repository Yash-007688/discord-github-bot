require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const { DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_BOT_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID) {
  throw new Error(
    "Missing DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID in .env"
  );
}

const commands = [
  new SlashCommandBuilder()
    .setName("github-user")
    .setDescription("Show GitHub user profile details")
    .addStringOption((option) =>
      option.setName("username").setDescription("GitHub username").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("github-repo")
    .setDescription("Show details about a GitHub repository")
    .addStringOption((option) =>
      option.setName("owner").setDescription("Repository owner/org").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("repo").setDescription("Repository name").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("github-activity")
    .setDescription("Show recent public activity for a GitHub user")
    .addStringOption((option) =>
      option.setName("username").setDescription("GitHub username").setRequired(true)
    ),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(DISCORD_BOT_TOKEN);

async function register() {
  console.log("Registering slash commands...");
  await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID), {
    body: commands,
  });
  console.log("Slash commands registered for guild.");
}

register().catch((error) => {
  console.error(error);
  process.exit(1);
});
