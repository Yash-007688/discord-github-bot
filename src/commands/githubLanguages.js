import { SlashCommandBuilder } from "discord.js";
import { config } from "../config/index.js";
import { premiumEmbed } from "../utils/embedFactory.js";
import { githubApi } from "../utils/githubApi.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("github-languages")
    .setDescription("Show language distribution across your public repos"),
  async execute(interaction) {
    const { data } = await githubApi.get(`/users/${config.githubUsername}/repos?per_page=100`);
    const count = new Map();

    for (const repo of data) {
      const language = repo.language || "Unknown";
      count.set(language, (count.get(language) || 0) + 1);
    }

    const ranked = [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const description = ranked.map(([lang, amount], idx) => `${idx + 1}. ${lang}: ${amount} repo(s)`).join("\n");

    const embed = premiumEmbed({
      title: `${config.githubUsername} - Language Distribution`,
      description: description || "No data available.",
      color: 0xbf3989,
    });
    await interaction.editReply({ embeds: [embed] });
  },
};
