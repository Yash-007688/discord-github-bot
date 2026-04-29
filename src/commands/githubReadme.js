import { SlashCommandBuilder } from "discord.js";
import { config } from "../config/index.js";
import { premiumEmbed } from "../utils/embedFactory.js";
import { githubApi } from "../utils/githubApi.js";

function truncate(text, max = 1500) {
  if (!text || text.length <= max) return text || "No README content.";
  return `${text.slice(0, max)}...`;
}

export const command = {
  data: new SlashCommandBuilder()
    .setName("github-readme")
    .setDescription("Preview README from a repository")
    .addStringOption((option) =>
      option.setName("repo").setDescription("Repository name").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("owner").setDescription("Repository owner (optional)")
    ),
  async execute(interaction) {
    const repo = interaction.options.getString("repo", true);
    const owner = interaction.options.getString("owner") || config.githubUsername;

    const { data } = await githubApi.get(`/repos/${owner}/${repo}/readme`, {
      headers: { Accept: "application/vnd.github.raw+json" },
    });

    const embed = premiumEmbed({
      title: `${owner}/${repo} README Preview`,
      description: `\`\`\`md\n${truncate(data)}\n\`\`\``,
      url: `https://github.com/${owner}/${repo}#readme`,
      color: 0x238636,
    });
    await interaction.editReply({ embeds: [embed] });
  },
};
