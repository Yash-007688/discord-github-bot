import { SlashCommandBuilder } from "discord.js";
import { config } from "../config/index.js";
import { premiumEmbed } from "../utils/embedFactory.js";
import { formatDate, githubApi } from "../utils/githubApi.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("github-activity")
    .setDescription("Show your recent public GitHub activity")
    .addIntegerOption((option) =>
      option
        .setName("limit")
        .setDescription("Number of events to show (1-10)")
        .setMinValue(1)
        .setMaxValue(10)
    ),
  async execute(interaction) {
    const limit = interaction.options.getInteger("limit") || 5;
    const { data } = await githubApi.get(`/users/${config.githubUsername}/events/public`);
    const events = data.slice(0, limit);

    if (!events.length) {
      await interaction.editReply("No recent activity found.");
      return;
    }

    const lines = events.map((event, index) => {
      const repoName = event.repo?.name || "unknown";
      return `${index + 1}. ${event.type} on \`${repoName}\` at ${formatDate(event.created_at)}`;
    });

    const embed = premiumEmbed({
      title: `${config.githubUsername} - Recent Activity`,
      description: lines.join("\n"),
      url: `https://github.com/${config.githubUsername}`,
      color: 0x8250df,
    });
    await interaction.editReply({ embeds: [embed] });
  },
};
