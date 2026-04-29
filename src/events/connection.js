import { logger } from "../utils/logger.js";

export function setupConnectionEvents(client, connect) {
  client.on("shardDisconnect", (event, shardId) => {
    logger.warn(`Shard ${shardId} disconnected`, event?.reason || "");
    // Discord.js reconnects automatically, but we keep a safe fallback.
    setTimeout(() => connect().catch((error) => logger.error("Reconnect failed", error.message)), 5000);
  });

  client.on("shardResume", (shardId) => {
    logger.info(`Shard ${shardId} resumed`);
  });
}
