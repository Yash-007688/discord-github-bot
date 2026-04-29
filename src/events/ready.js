import { ActivityType } from "discord.js";
import { logger } from "../utils/logger.js";

const statuses = [
  "Watching GitHub",
  "Tracking Repos",
  "Monitoring Commits",
];

export function setupReadyEvent(client) {
  client.once("ready", () => {
    logger.info(`Logged in as ${client.user.tag}`);
    let index = 0;
    client.user.setActivity(statuses[index], { type: ActivityType.Watching });
    setInterval(() => {
      index = (index + 1) % statuses.length;
      client.user.setActivity(statuses[index], { type: ActivityType.Watching });
    }, 20000);
  });
}
