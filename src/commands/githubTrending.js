import { SlashCommandBuilder } from "discord.js";
import { premiumEmbed } from "../utils/embedFactory.js";
import { githubApi } from "../utils/githubApi.js";

function weekAgoDate() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().slice(0, 10);
}

export const command = {
  data: new SlashCommandBuilder()
    .setName("github-trending")
    .setDescription("Show trending GitHub repositories")
    .addIntegerOption((option) =>
      option
        .setName("limit")
        .setDescription("How many repositories to show (1-10)")
        .setMinValue(1)
        .setMaxValue(10)
    ),
  async execute(interaction) {
    const limit = interaction.options.getInteger("limit") || 5;
    const query = `created:>${weekAgoDate()}`;
    const { data } = await githubApi.get(`/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`);
    const repos = data.items || [];

    const description =
      repos
        .map(
          (repo, idx) =>
            `${idx + 1}. [${repo.full_name}](${repo.html_url}) - ⭐ ${repo.stargazers_count} - ${repo.language || "N/A"}`
        )
        .join("\n") || "No trending repositories found.";

    const embed = premiumEmbed({
      title: "GitHub Trending Repositories",
      description,
      color: 0x8957e5,
    });
    await interaction.editReply({ embeds: [embed] });
  },
};
