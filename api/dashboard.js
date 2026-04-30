import fs from "fs/promises";
import path from "path";

const dbPath = path.resolve(process.cwd(), "data", "stats.json");

async function readStatsFile() {
  try {
    const raw = await fs.readFile(dbPath, "utf8");
    return JSON.parse(raw || "{}");
  } catch {
    return { commandUsage: {}, contributors: {} };
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const stats = await readStatsFile();
  const allCommandUsage = Object.entries(stats.commandUsage || {})
    .map(([name, count]) => ({ name, count: Number(count) || 0 }))
    .sort((a, b) => b.count - a.count);
  const commandUsage = allCommandUsage.slice(0, 6);
  const contributors = Object.entries(stats.contributors || {})
    .map(([name, commits]) => ({ name, commits: Number(commits) || 0 }))
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 6);

  const totalUsage = allCommandUsage.reduce((sum, item) => sum + item.count, 0);

  res.status(200).json({
    appName: "Discord GitHub Bot",
    githubUsername: process.env.GITHUB_USERNAME || "",
    totalCommands: Object.keys(stats.commandUsage || {}).length,
    totalUsage,
    totalContributors: Object.keys(stats.contributors || {}).length,
    commandUsage,
    contributors,
    endpoints: ["/interactions", "/github-webhook", "/api/dashboard"],
  });
}
