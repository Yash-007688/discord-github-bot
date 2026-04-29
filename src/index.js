import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./config/index.js";
import { setupConnectionEvents } from "./events/connection.js";
import { setupInteractionEvent } from "./events/interactionCreate.js";
import { setupProcessGuards } from "./events/processGuards.js";
import { setupReadyEvent } from "./events/ready.js";
import { loadCommands, registerCommands } from "./utils/commandRegistry.js";
import { logger } from "./utils/logger.js";
import { createWebhookServer } from "./utils/webhookServer.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

let isConnecting = false;
async function connect() {
  if (isConnecting) return;
  isConnecting = true;
  try {
    if (!client.isReady()) {
      await client.login(config.discordToken);
    }
  } finally {
    isConnecting = false;
  }
}

async function bootstrap() {
  setupProcessGuards();
  const commands = await loadCommands();
  await registerCommands(commands); // Auto-register commands on startup.

  setupReadyEvent(client);
  setupInteractionEvent(client, commands);
  setupConnectionEvents(client, connect);

  await connect();

  const webhookServer = createWebhookServer(client);
  webhookServer.listen(config.webhookPort, () => {
    logger.info(`Webhook server listening on port ${config.webhookPort}`);
  });
}

bootstrap().catch((error) => {
  logger.error("Fatal startup error", error.stack || error.message);
  process.exit(1);
});
