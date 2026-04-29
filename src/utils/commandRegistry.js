import { REST, Routes } from "discord.js";
import { commandMap } from "../commands/index.js";
import { config } from "../config/index.js";
import { logger } from "./logger.js";

export async function loadCommands() {
  return new Map(commandMap);
}

export async function registerCommands(commands) {
  const rest = new REST({ version: "10" }).setToken(config.discordToken);
  const payload = [...commands.values()].map((cmd) => cmd.data.toJSON());
  await rest.put(Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId), {
    body: payload,
  });
  logger.info(`Registered ${payload.length} slash command(s).`);
}
