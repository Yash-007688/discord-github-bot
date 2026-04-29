import { SlashCommandBuilder } from "discord.js";
import { premiumEmbed } from "../utils/embedFactory.js";
import { githubApi } from "../utils/githubApi.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("github-compare")
    .setDescription("Compare two GitHub users")
    .addStringOption((option) =>
      option.setName("user1").setDescription("First username").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("user2").setDescription("Second username").setRequired(true)
    ),
  async execute(interaction) {
    const user1 = interaction.options.getString("user1", true);
    const user2 = interaction.options.getString("user2", true);
    const [u1, u2] = await Promise.all([
      githubApi.get(`/users/${user1}`),
      githubApi.get(`/users/${user2}`),
    ]);

    const embed = premiumEmbed({
      title: `${user1} vs ${user2}`,
      description: "Quick GitHub profile comparison",
      fields: [
        { name: `${user1} Followers`, value: `${u1.data.followers}`, inline: true },
        { name: `${user2} Followers`, value: `${u2.data.followers}`, inline: true },
        { name: `${user1} Repos`, value: `${u1.data.public_repos}`, inline: true },
        { name: `${user2} Repos`, value: `${u2.data.public_repos}`, inline: true },
        { name: `${user1} Following`, value: `${u1.data.following}`, inline: true },
        { name: `${user2} Following`, value: `${u2.data.following}`, inline: true },
      ],
      color: 0x316dca,
    });
    await interaction.editReply({ embeds: [embed] });
  },
};
