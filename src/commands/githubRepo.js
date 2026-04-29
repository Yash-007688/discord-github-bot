import { SlashCommandBuilder } from "discord.js";
import { config } from "../config/index.js";
import { premiumEmbed } from "../utils/embedFactory.js";
import { formatDate, githubApi } from "../utils/githubApi.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("github-repo")
    .setDescription("Show details about one of your GitHub repositories")
    .addStringOption((option) =>
      option.setName("repo").setDescription("Repository name").setRequired(true)
    ),
  async execute(interaction) {
    const repo = interaction.options.getString("repo", true);
    const { data } = await githubApi.get(`/repos/${config.githubUsername}/${repo}`);

    const embed = premiumEmbed({
      title: data.full_name,
      description: data.description || "No description",
      url: data.html_url,
      fields: [
        { name: "Stars", value: `${data.stargazers_count}`, inline: true },
        { name: "Forks", value: `${data.forks_count}`, inline: true },
        { name: "Open Issues", value: `${data.open_issues_count}`, inline: true },
        { name: "Language", value: data.language || "N/A", inline: true },
        { name: "Visibility", value: data.visibility || "N/A", inline: true },
        { name: "Default Branch", value: data.default_branch || "N/A", inline: true },
        { name: "Last Push", value: formatDate(data.pushed_at), inline: false },
      ],
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
