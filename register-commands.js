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
    .setName("github-me")
    .setDescription("Show your configured GitHub profile details"),
  new SlashCommandBuilder()
    .setName("github-summary")
    .setDescription("Show advanced total stats across your GitHub repos"),
  new SlashCommandBuilder()
    .setName("github-repo")
    .setDescription("Show details about one of your GitHub repositories")
    .addStringOption((option) =>
      option.setName("repo").setDescription("Repository name").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("github-activity")
    .setDescription("Show your recent public GitHub activity")
    .addIntegerOption((option) =>
      option
        .setName("limit")
        .setDescription("Number of events to show (1-10)")
        .setMinValue(1)
        .setMaxValue(10)
    ),
  new SlashCommandBuilder()
    .setName("github-top-repos")
    .setDescription("Show your top repositories by stars")
    .addIntegerOption((option) =>
      option
        .setName("limit")
        .setDescription("How many repositories to list (1-10)")
        .setMinValue(1)
        .setMaxValue(10)
    ),
  new SlashCommandBuilder()
    .setName("github-languages")
    .setDescription("Show language distribution across your public repos"),
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
