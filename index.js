require("dotenv").config();
const http = require("http");
const axios = require("axios");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActivityType,
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const {
  DISCORD_BOT_TOKEN,
  DISCORD_CHANNEL_ID,
  GITHUB_TOKEN,
  GITHUB_USERNAME,
  WEBHOOK_PORT = 3000,
} = process.env;

if (!DISCORD_BOT_TOKEN) {
  throw new Error("Missing DISCORD_BOT_TOKEN in .env");
}

if (!GITHUB_USERNAME) {
  throw new Error("Missing GITHUB_USERNAME in .env");
}

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github+json",
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  },
});

function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleString();
}

function usernameWithOwner(owner) {
  return String(owner || "").toLowerCase() === String(GITHUB_USERNAME).toLowerCase();
}

async function getMyPublicRepos(limit = 100) {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const { data } = await githubApi.get(`/users/${GITHUB_USERNAME}/repos`, {
    params: {
      per_page: safeLimit,
      sort: "updated",
      direction: "desc",
      type: "owner",
    },
  });
  return data;
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

async function handleCommand(interaction) {
  const { commandName } = interaction;

  try {
    if (commandName === "github-me") {
      await interaction.deferReply();
      const { data } = await githubApi.get(`/users/${GITHUB_USERNAME}`);

      const embed = new EmbedBuilder()
        .setColor(0x24292f)
        .setTitle(`${data.login} (Your GitHub Profile)`)
        .setURL(data.html_url)
        .setThumbnail(data.avatar_url)
        .addFields(
          { name: "Name", value: data.name || "N/A", inline: true },
          { name: "Followers", value: String(data.followers), inline: true },
          { name: "Following", value: String(data.following), inline: true },
          { name: "Public Repos", value: String(data.public_repos), inline: true },
          { name: "Company", value: data.company || "N/A", inline: true },
          { name: "Location", value: data.location || "N/A", inline: true }
        )
        .setFooter({ text: `Joined: ${formatDate(data.created_at)}` });

      if (data.bio) {
        embed.setDescription(data.bio);
      }

      await interaction.editReply({ embeds: [embed] });
    }

    if (commandName === "github-summary") {
      await interaction.deferReply();
      const [profileResponse, repos] = await Promise.all([
        githubApi.get(`/users/${GITHUB_USERNAME}`),
        getMyPublicRepos(100),
      ]);
      const profile = profileResponse.data;
      const totals = repos.reduce(
        (acc, repo) => {
          acc.stars += repo.stargazers_count || 0;
          acc.forks += repo.forks_count || 0;
          acc.watchers += repo.watchers_count || 0;
          acc.openIssues += repo.open_issues_count || 0;
          return acc;
        },
        { stars: 0, forks: 0, watchers: 0, openIssues: 0 }
      );

      const embed = new EmbedBuilder()
        .setColor(0x1f6feb)
        .setTitle(`${GITHUB_USERNAME} - Advanced GitHub Summary`)
        .setURL(`https://github.com/${GITHUB_USERNAME}`)
        .addFields(
          { name: "Followers", value: String(profile.followers), inline: true },
          { name: "Following", value: String(profile.following), inline: true },
          { name: "Public Repos", value: String(profile.public_repos), inline: true },
          { name: "Total Stars", value: String(totals.stars), inline: true },
          { name: "Total Forks", value: String(totals.forks), inline: true },
          { name: "Open Issues", value: String(totals.openIssues), inline: true },
          { name: "Watchers", value: String(totals.watchers), inline: true }
        )
        .setFooter({ text: `Computed from your latest ${repos.length} public repo(s)` });

      await interaction.editReply({ embeds: [embed] });
    }

    if (commandName === "github-repo") {
      const repo = interaction.options.getString("repo", true);
      await interaction.deferReply();
      const { data } = await githubApi.get(`/repos/${GITHUB_USERNAME}/${repo}`);

      if (!usernameWithOwner(data.owner?.login)) {
        await interaction.editReply(
          "Access denied: this bot is locked to your GitHub account only."
        );
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x0969da)
        .setTitle(`${data.full_name}`)
        .setURL(data.html_url)
        .setDescription(data.description || "No description")
        .addFields(
          { name: "Stars", value: String(data.stargazers_count), inline: true },
          { name: "Forks", value: String(data.forks_count), inline: true },
          { name: "Open Issues", value: String(data.open_issues_count), inline: true },
          { name: "Language", value: data.language || "N/A", inline: true },
          { name: "Visibility", value: data.visibility || "N/A", inline: true },
          { name: "Default Branch", value: data.default_branch || "N/A", inline: true }
        )
        .setFooter({
          text: `Last pushed: ${formatDate(data.pushed_at)} | Updated: ${formatDate(
            data.updated_at
          )}`,
        });

      await interaction.editReply({ embeds: [embed] });
    }

    if (commandName === "github-activity") {
      const limit = interaction.options.getInteger("limit") || 5;
      await interaction.deferReply();
      const { data } = await githubApi.get(`/users/${GITHUB_USERNAME}/events/public`);
      const latest = data.slice(0, Math.min(Math.max(limit, 1), 10));

      if (latest.length === 0) {
        await interaction.editReply(`No recent public activity found for ${GITHUB_USERNAME}.`);
        return;
      }

      const lines = latest.map((event, index) => {
        const repoName = event.repo?.name || "unknown repo";
        return `${index + 1}. **${event.type}** on \`${repoName}\` at ${formatDate(
          event.created_at
        )}`;
      });

      const embed = new EmbedBuilder()
        .setColor(0x8250df)
        .setTitle(`Recent GitHub Activity: ${GITHUB_USERNAME}`)
        .setDescription(lines.join("\n"))
        .setURL(`https://github.com/${GITHUB_USERNAME}`);

      await interaction.editReply({ embeds: [embed] });
    }

    if (commandName === "github-top-repos") {
      const limit = interaction.options.getInteger("limit") || 5;
      await interaction.deferReply();
      const repos = await getMyPublicRepos(100);
      const ranked = [...repos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, Math.min(Math.max(limit, 1), 10));

      if (ranked.length === 0) {
        await interaction.editReply("No public repositories found.");
        return;
      }

      const lines = ranked.map((repo, index) => {
        return `${index + 1}. [${repo.name}](${repo.html_url}) - ⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count}`;
      });

      const embed = new EmbedBuilder()
        .setColor(0x2da44e)
        .setTitle(`${GITHUB_USERNAME} - Top Repositories`)
        .setDescription(lines.join("\n"));

      await interaction.editReply({ embeds: [embed] });
    }

    if (commandName === "github-languages") {
      await interaction.deferReply();
      const repos = await getMyPublicRepos(100);
      const languageCount = new Map();

      for (const repo of repos) {
        const lang = repo.language || "Unknown";
        languageCount.set(lang, (languageCount.get(lang) || 0) + 1);
      }

      const rankedLanguages = [...languageCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const lines = rankedLanguages.map(([language, count], idx) => {
        return `${idx + 1}. ${language} - ${count} repo(s)`;
      });

      const embed = new EmbedBuilder()
        .setColor(0xbf3989)
        .setTitle(`${GITHUB_USERNAME} - Language Distribution`)
        .setDescription(lines.join("\n") || "No languages found in public repos.");

      await interaction.editReply({ embeds: [embed] });
    }
  } catch (error) {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || "Unknown GitHub API error.";
    const output = status
      ? `GitHub API Error (${status}): ${message}`
      : `Error: ${message}`;
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(output);
    } else {
      await interaction.reply({ content: output, ephemeral: true });
    }
  }
}

function buildWebhookEmbed(event, payload) {
  const repo = payload.repository?.full_name || "unknown repo";
  const sender = payload.sender?.login || "unknown user";

  if (event === "push") {
    const commits = payload.commits || [];
    const commitList = commits
      .slice(0, 5)
      .map((c) => `- [\`${c.id.slice(0, 7)}\`](${c.url}) ${c.message}`)
      .join("\n");
    return new EmbedBuilder()
      .setColor(0x2da44e)
      .setTitle(`Push in ${repo}`)
      .setURL(payload.compare)
      .setDescription(
        `**${sender}** pushed ${commits.length} commit(s) to \`${payload.ref}\`\n${
          commitList || "No commit details."
        }`
      )
      .setFooter({ text: "GitHub Webhook: push" });
  }

  if (event === "pull_request") {
    const pr = payload.pull_request;
    return new EmbedBuilder()
      .setColor(0x1f6feb)
      .setTitle(`PR ${payload.action}: ${pr.title}`)
      .setURL(pr.html_url)
      .setDescription(
        `**Repo:** ${repo}\n**By:** ${sender}\n**State:** ${pr.state}\n**#${pr.number}`
      )
      .setFooter({ text: "GitHub Webhook: pull_request" });
  }

  if (event === "issues") {
    const issue = payload.issue;
    return new EmbedBuilder()
      .setColor(0xd29922)
      .setTitle(`Issue ${payload.action}: ${issue.title}`)
      .setURL(issue.html_url)
      .setDescription(`**Repo:** ${repo}\n**By:** ${sender}\n**#${issue.number}`)
      .setFooter({ text: "GitHub Webhook: issues" });
  }

  return new EmbedBuilder()
    .setColor(0x656d76)
    .setTitle(`GitHub Event: ${event}`)
    .setDescription(`Repo: ${repo}\nBy: ${sender}`)
    .setFooter({ text: "Generic GitHub webhook event" });
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setActivity("GitHub insights", { type: ActivityType.Watching });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handleCommand(interaction);
});

const webhookServer = http.createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/github-webhook") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  try {
    const rawBody = await getPayload(req);
    const payload = JSON.parse(rawBody || "{}");
    const event = req.headers["x-github-event"] || "unknown";

    if (!DISCORD_CHANNEL_ID) {
      console.warn("DISCORD_CHANNEL_ID not set. Skipping webhook post.");
      res.writeHead(202);
      res.end("Accepted, but no channel configured.");
      return;
    }

    const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      throw new Error("Configured DISCORD_CHANNEL_ID is invalid or not a text channel.");
    }

    const embed = buildWebhookEmbed(event, payload);
    await channel.send({ embeds: [embed] });

    res.writeHead(200);
    res.end("Webhook received");
  } catch (error) {
    console.error("Webhook processing error:", error.message);
    res.writeHead(500);
    res.end("Internal webhook error");
  }
});

client.login(DISCORD_BOT_TOKEN).then(() => {
  webhookServer.listen(Number(WEBHOOK_PORT), () => {
    console.log(`GitHub webhook server listening on port ${WEBHOOK_PORT}`);
  });
});
