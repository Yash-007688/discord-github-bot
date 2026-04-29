import { loadCommands, registerCommands } from "./src/utils/commandRegistry.js";
import { logger } from "./src/utils/logger.js";

const commands = await loadCommands();
await registerCommands(commands);
logger.info("Manual command registration complete.");
