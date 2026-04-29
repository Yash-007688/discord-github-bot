import { SlashCommandBuilder } from "discord.js";
import { config } from "../config/index.js";
import { premiumEmbed } from "../utils/embedFactory.js";
import { githubApi } from "../utils/githubApi.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("github-summary")
    .setDescription("Show advanced total stats across your GitHub repos"),
  async execute(interaction) {
    const [profileRes, reposRes] = await Promise.all([
      githubApi.get(`/users/${config.githubUsername}`),
      githubApi.get(`/users/${config.githubUsername}/repos?per_page=100&type=owner`),
    ]);
    const profile = profileRes.data;
    const repos = reposRes.data;

    const totals = repos.reduce(
      (acc, repo) => {
        acc.stars += repo.stargazers_count || 0;
        acc.forks += repo.forks_count || 0;
        acc.watchers += repo.watchers_count || 0;
        acc.issues += repo.open_issues_count || 0;
        return acc;
      },
      { stars: 0, forks: 0, watchers: 0, issues: 0 }
    );

    const embed = premiumEmbed({
      title: `${config.githubUsername} - Advanced Summary`,
      url: `https://github.com/${config.githubUsername}`,
      fields: [
        { name: "Followers", value: `${profile.followers}`, inline: true },
        { name: "Following", value: `${profile.following}`, inline: true },
        { name: "Repos", value: `${profile.public_repos}`, inline: true },
        { name: "Total Stars", value: `${totals.stars}`, inline: true },
        { name: "Total Forks", value: `${totals.forks}`, inline: true },
        { name: "Open Issues", value: `${totals.issues}`, inline: true },
        { name: "Watchers", value: `${totals.watchers}`, inline: true },
      ],
      footer: `Computed from ${repos.length} public repos`,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
