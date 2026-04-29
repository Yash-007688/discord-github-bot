import { SlashCommandBuilder } from "discord.js";
import { premiumEmbed } from "../utils/embedFactory.js";
import { readDb } from "../utils/database.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("github-leaderboard")
    .setDescription("Show top contributors from tracked webhook commits"),
  async execute(interaction) {
    const db = await readDb();
    const ranked = Object.entries(db.contributors || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const description =
      ranked.map(([name, count], idx) => `${idx + 1}. ${name} - ${count} commit(s)`).join("\n") ||
      "No contributor data tracked yet.";

    const embed = premiumEmbed({
      title: "Contributor Leaderboard",
      description,
      color: 0x0969da,
    });
    await interaction.editReply({ embeds: [embed] });
  },
};
