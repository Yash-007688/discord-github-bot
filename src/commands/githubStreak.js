import { SlashCommandBuilder } from "discord.js";
import { config } from "../config/index.js";
import { premiumEmbed } from "../utils/embedFactory.js";
import { calculateStreakFromEvents } from "../utils/streak.js";
import { githubApi } from "../utils/githubApi.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("github-streak")
    .setDescription("Track GitHub push streak")
    .addStringOption((option) =>
      option.setName("username").setDescription("GitHub username (optional)")
    ),
  async execute(interaction) {
    const username = interaction.options.getString("username") || config.githubUsername;
    const { data } = await githubApi.get(`/users/${username}/events/public?per_page=100`);
    const streak = calculateStreakFromEvents(data);

    const embed = premiumEmbed({
      title: `${username} - Commit Streak`,
      description: `Current push streak: **${streak} day(s)**`,
      color: 0xf0883e,
      url: `https://github.com/${username}`,
    });
    await interaction.editReply({ embeds: [embed] });
  },
};
