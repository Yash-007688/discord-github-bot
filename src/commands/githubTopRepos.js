import { SlashCommandBuilder } from "discord.js";
import { config } from "../config/index.js";
import { premiumEmbed } from "../utils/embedFactory.js";
import { githubApi } from "../utils/githubApi.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("github-top-repos")
    .setDescription("Show your top repositories by stars")
    .addIntegerOption((option) =>
      option
        .setName("limit")
        .setDescription("How many repositories to list (1-10)")
        .setMinValue(1)
        .setMaxValue(10)
    ),
  async execute(interaction) {
    const limit = interaction.options.getInteger("limit") || 5;
    const { data } = await githubApi.get(`/users/${config.githubUsername}/repos?per_page=100`);
    const top = [...data].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, limit);

    const description =
      top.map((repo, idx) => `${idx + 1}. [${repo.name}](${repo.html_url}) - ⭐ ${repo.stargazers_count}`).join("\n") ||
      "No repos found.";

    const embed = premiumEmbed({
      title: `${config.githubUsername} - Top Repositories`,
      description,
      color: 0x2da44e,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
