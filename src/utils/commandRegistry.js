import fs from "fs/promises";
import path from "path";
import { REST, Routes } from "discord.js";
import { config } from "../config/index.js";
import { logger } from "./logger.js";

export async function loadCommands() {
  const commandsPath = path.resolve(process.cwd(), "src", "commands");
  const files = (await fs.readdir(commandsPath)).filter((file) => file.endsWith(".js"));
  const collection = new Map();

  for (const file of files) {
    const modulePath = path.join(commandsPath, file);
    const imported = await import(`file://${modulePath}`);
    const command = imported.command;
    collection.set(command.data.name, command);
  }

  return collection;
}

export async function registerCommands(commands) {
  const rest = new REST({ version: "10" }).setToken(config.discordToken);
  const payload = [...commands.values()].map((cmd) => cmd.data.toJSON());
  await rest.put(Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId), {
    body: payload,
  });
  logger.info(`Registered ${payload.length} slash command(s).`);
}
