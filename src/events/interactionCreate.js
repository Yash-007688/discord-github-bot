import { trackCommandUsage } from "../utils/database.js";
import { logger } from "../utils/logger.js";

export function setupInteractionEvent(client, commands) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await interaction.deferReply();
      await trackCommandUsage(interaction.commandName);
      await command.execute(interaction);
    } catch (error) {
      logger.error(`Command failed: ${interaction.commandName}`, error.message);
      const message = `Error: ${error.message || "Unknown command error"}`;
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(message);
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
    }
  });
}
