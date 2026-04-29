import { SlashCommandBuilder } from "discord.js";
import { config } from "../config/index.js";
import { premiumEmbed } from "../utils/embedFactory.js";
import { formatDate, githubApi } from "../utils/githubApi.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("github-me")
    .setDescription("Show your configured GitHub profile details"),
  async execute(interaction) {
    const { data } = await githubApi.get(`/users/${config.githubUsername}`);
    const embed = premiumEmbed({
      title: `${data.login} - GitHub Profile`,
      description: data.bio || "No bio available.",
      thumbnail: data.avatar_url,
      url: data.html_url,
      fields: [
        { name: "Followers", value: `${data.followers}`, inline: true },
        { name: "Following", value: `${data.following}`, inline: true },
        { name: "Public Repos", value: `${data.public_repos}`, inline: true },
        { name: "Company", value: data.company || "N/A", inline: true },
        { name: "Location", value: data.location || "N/A", inline: true },
        { name: "Joined", value: formatDate(data.created_at), inline: false },
      ],
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
