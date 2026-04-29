import fs from "fs/promises";
import path from "path";
import { logger } from "./logger.js";

const dbPath = path.resolve(process.cwd(), "data", "stats.json");

const defaultDb = {
  commandUsage: {},
  contributors: {},
};

async function ensureDb() {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(defaultDb, null, 2), "utf8");
  }
}

export async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(dbPath, "utf8");
  return JSON.parse(raw || "{}");
}

export async function writeDb(data) {
  await ensureDb();
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), "utf8");
}

export async function trackCommandUsage(commandName) {
  try {
    const db = await readDb();
    db.commandUsage[commandName] = (db.commandUsage[commandName] || 0) + 1;
    await writeDb(db);
  } catch (error) {
    logger.warn("Failed to track command usage", error.message);
  }
}

export async function trackPushContributors(commits = []) {
  if (!Array.isArray(commits) || commits.length === 0) return;
  const db = await readDb();
  for (const commit of commits) {
    const login = commit.author?.username || commit.author?.name || "unknown";
    db.contributors[login] = (db.contributors[login] || 0) + 1;
  }
  await writeDb(db);
}
