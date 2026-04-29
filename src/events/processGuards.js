import { logger } from "../utils/logger.js";

export function setupProcessGuards() {
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection", reason);
  });

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", error.stack || error.message);
  });
}
