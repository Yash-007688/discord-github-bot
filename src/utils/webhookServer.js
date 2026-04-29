import crypto from "crypto";
import http from "http";
import { EmbedBuilder } from "discord.js";
import { config } from "../config/index.js";
import { trackPushContributors } from "./database.js";
import { logger } from "./logger.js";

function verifyGithubSignature(rawBody, signatureHeader) {
  if (!config.githubWebhookSecret) return true;
  if (!signatureHeader) return false;
  const digest = `sha256=${crypto
    .createHmac("sha256", config.githubWebhookSecret)
    .update(rawBody)
    .digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
}

function getPayload(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function webhookEmbed(event, payload) {
  const repo = payload.repository?.full_name || "unknown repo";
  const sender = payload.sender?.login || "unknown user";
  if (event === "push") {
    const commits = payload.commits || [];
    return new EmbedBuilder()
      .setColor(0x2da44e)
      .setTitle(`Push in ${repo}`)
      .setDescription(`**${sender}** pushed ${commits.length} commit(s) to \`${payload.ref}\``)
      .setTimestamp()
      .setFooter({ text: "GitHub Webhook: push" });
  }
  if (event === "pull_request") {
    const pr = payload.pull_request;
    return new EmbedBuilder()
      .setColor(0x1f6feb)
      .setTitle(`PR ${payload.action}: ${pr.title}`)
      .setURL(pr.html_url)
      .setDescription(`Repo: ${repo}\nBy: ${sender}\n#${pr.number}`)
      .setTimestamp()
      .setFooter({ text: "GitHub Webhook: pull_request" });
  }
  if (event === "issues") {
    const issue = payload.issue;
    return new EmbedBuilder()
      .setColor(0xd29922)
      .setTitle(`Issue ${payload.action}: ${issue.title}`)
      .setURL(issue.html_url)
      .setDescription(`Repo: ${repo}\nBy: ${sender}\n#${issue.number}`)
      .setTimestamp()
      .setFooter({ text: "GitHub Webhook: issues" });
  }
  return new EmbedBuilder()
    .setColor(0x656d76)
    .setTitle(`GitHub Event: ${event}`)
    .setDescription(`Repo: ${repo}\nBy: ${sender}`)
    .setTimestamp();
}

export function createWebhookServer(client) {
  return http.createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/github-webhook") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    try {
      const rawBody = await getPayload(req);
      const signature = req.headers["x-hub-signature-256"];
      if (!verifyGithubSignature(rawBody, signature)) {
        res.writeHead(401);
        res.end("Invalid signature");
        return;
      }

      const payload = JSON.parse(rawBody || "{}");
      const event = req.headers["x-github-event"] || "unknown";

      if (!config.discordChannelId) {
        res.writeHead(202);
        res.end("No DISCORD_CHANNEL_ID configured.");
        return;
      }

      const channel = await client.channels.fetch(config.discordChannelId);
      if (!channel?.isTextBased()) throw new Error("Invalid DISCORD_CHANNEL_ID");

      if (event === "push") {
        await trackPushContributors(payload.commits || []);
      }

      await channel.send({ embeds: [webhookEmbed(event, payload)] });
      res.writeHead(200);
      res.end("Webhook received");
    } catch (error) {
      logger.error("Webhook processing failed", error.message);
      res.writeHead(500);
      res.end("Internal error");
    }
  });
}
