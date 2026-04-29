import crypto from "crypto";
import axios from "axios";

function safeJsonParse(input) {
  try {
    return JSON.parse(input || "{}");
  } catch {
    return {};
  }
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function verifyGithubSignature(rawBody, signatureHeader, secret) {
  if (!secret) return true;
  if (!signatureHeader) return false;
  const digest = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
}

function buildWebhookEmbed(event, payload) {
  const repo = payload.repository?.full_name || "unknown repo";
  const sender = payload.sender?.login || "unknown user";

  if (event === "push") {
    const commits = payload.commits || [];
    const commitList = commits
      .slice(0, 5)
      .map((c) => `- [\`${String(c.id || "").slice(0, 7)}\`](${c.url}) ${c.message}`)
      .join("\n");

    return {
      color: 0x2da44e,
      title: `Push in ${repo}`,
      url: payload.compare,
      description: `**${sender}** pushed ${commits.length} commit(s) to \`${payload.ref}\`\n${
        commitList || "No commit details."
      }`,
      footer: { text: "GitHub Webhook: push" },
    };
  }

  if (event === "pull_request") {
    const pr = payload.pull_request || {};
    return {
      color: 0x1f6feb,
      title: `PR ${payload.action}: ${pr.title || "Untitled"}`,
      url: pr.html_url,
      description: `**Repo:** ${repo}\n**By:** ${sender}\n**State:** ${pr.state || "unknown"}\n**#${pr.number || "?"}`,
      footer: { text: "GitHub Webhook: pull_request" },
    };
  }

  if (event === "issues") {
    const issue = payload.issue || {};
    return {
      color: 0xd29922,
      title: `Issue ${payload.action}: ${issue.title || "Untitled"}`,
      url: issue.html_url,
      description: `**Repo:** ${repo}\n**By:** ${sender}\n**#${issue.number || "?"}`,
      footer: { text: "GitHub Webhook: issues" },
    };
  }

  return {
    color: 0x656d76,
    title: `GitHub Event: ${event}`,
    description: `Repo: ${repo}\nBy: ${sender}`,
    footer: { text: "Generic GitHub webhook event" },
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const { DISCORD_BOT_TOKEN, DISCORD_CHANNEL_ID, GITHUB_WEBHOOK_SECRET } = process.env;
  if (!DISCORD_BOT_TOKEN || !DISCORD_CHANNEL_ID) {
    res.status(500).send("Missing DISCORD_BOT_TOKEN or DISCORD_CHANNEL_ID");
    return;
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers["x-hub-signature-256"];
  if (!verifyGithubSignature(rawBody, signature, GITHUB_WEBHOOK_SECRET)) {
    res.status(401).send("Invalid webhook signature");
    return;
  }

  const event = req.headers["x-github-event"] || "unknown";
  const payload = safeJsonParse(rawBody);
  const embed = buildWebhookEmbed(event, payload);

  try {
    await axios.post(
      `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`,
      { embeds: [embed] },
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.status(200).send("Webhook received");
  } catch (error) {
    const details = error.response?.data || error.message;
    res.status(500).json({ error: "Discord send failed", details });
  }
}
