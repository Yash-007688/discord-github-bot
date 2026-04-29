import { SlashCommandBuilder } from "discord.js";
import { config } from "../config/index.js";
import { premiumEmbed } from "../utils/embedFactory.js";
import { githubApi } from "../utils/githubApi.js";
import { quickChartRepoStats } from "../utils/chart.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("github-chart")
    .setDescription("Show repository stats chart")
    .addStringOption((option) =>
      option.setName("repo").setDescription("Repository name").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("owner").setDescription("Repository owner (optional)")
    ),
  async execute(interaction) {
    const repo = interaction.options.getString("repo", true);
    const owner = interaction.options.getString("owner") || config.githubUsername;
    const { data } = await githubApi.get(`/repos/${owner}/${repo}`);
    const chartUrl = quickChartRepoStats(data);

    const embed = premiumEmbed({
      title: `${data.full_name} - Stats Chart`,
      description: "Live chart generated with QuickChart",
      url: data.html_url,
      color: 0x1f6feb,
    }).setImage(chartUrl);

    await interaction.editReply({ embeds: [embed] });
  },
};
