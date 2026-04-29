const axios = require("axios");
const { verifyKey } = require("discord-interactions");

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github+json",
    ...(process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : {}),
  },
});

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}

async function getMyPublicRepos(username, limit = 100) {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const { data } = await githubApi.get(`/users/${username}/repos`, {
    params: {
      per_page: safeLimit,
      sort: "updated",
      direction: "desc",
      type: "owner",
    },
  });
  return data;
}

function optionValue(options, name, fallback = null) {
  return options?.find((option) => option.name === name)?.value ?? fallback;
}

function interactionResponse(content) {
  return {
    type: 4,
    data: { content },
  };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const { DISCORD_PUBLIC_KEY, GITHUB_USERNAME } = process.env;
  if (!DISCORD_PUBLIC_KEY || !GITHUB_USERNAME) {
    res.status(500).json({
      error: "Missing DISCORD_PUBLIC_KEY or GITHUB_USERNAME",
    });
    return;
  }

  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];
  const rawBody = await getRawBody(req);

  const isValidRequest =
    !!signature &&
    !!timestamp &&
    verifyKey(rawBody, signature, timestamp, DISCORD_PUBLIC_KEY);

  if (!isValidRequest) {
    res.status(401).send("Bad request signature");
    return;
  }

  const interaction = JSON.parse(rawBody || "{}");

  if (interaction.type === 1) {
    res.status(200).json({ type: 1 });
    return;
  }

  if (interaction.type !== 2) {
    res.status(400).json(interactionResponse("Unsupported interaction type."));
    return;
  }

  const commandName = interaction.data?.name;
  const options = interaction.data?.options || [];

  try {
    if (commandName === "github-me") {
      const { data } = await githubApi.get(`/users/${GITHUB_USERNAME}`);
      res.status(200).json(
        interactionResponse(
          [
            `**${data.login} (Your GitHub Profile)**`,
            `Name: ${data.name || "N/A"}`,
            `Followers: ${data.followers} | Following: ${data.following}`,
            `Public Repos: ${data.public_repos}`,
            `Company: ${data.company || "N/A"} | Location: ${data.location || "N/A"}`,
            `Joined: ${formatDate(data.created_at)}`,
            data.html_url,
          ].join("\n")
        )
      );
      return;
    }

    if (commandName === "github-summary") {
      const [profileResponse, repos] = await Promise.all([
        githubApi.get(`/users/${GITHUB_USERNAME}`),
        getMyPublicRepos(GITHUB_USERNAME, 100),
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

      res.status(200).json(
        interactionResponse(
          [
            `**${GITHUB_USERNAME} - Advanced GitHub Summary**`,
            `Followers: ${profile.followers} | Following: ${profile.following}`,
            `Public Repos: ${profile.public_repos}`,
            `Total Stars: ${totals.stars}`,
            `Total Forks: ${totals.forks}`,
            `Watchers: ${totals.watchers}`,
            `Open Issues: ${totals.openIssues}`,
            `Computed from ${repos.length} public repo(s).`,
          ].join("\n")
        )
      );
      return;
    }

    if (commandName === "github-repo") {
      const repo = optionValue(options, "repo");
      if (!repo) {
        res.status(200).json(interactionResponse("Please provide a repo name."));
        return;
      }

      const { data } = await githubApi.get(`/repos/${GITHUB_USERNAME}/${repo}`);
      res.status(200).json(
        interactionResponse(
          [
            `**${data.full_name}**`,
            `${data.description || "No description"}`,
            `Stars: ${data.stargazers_count} | Forks: ${data.forks_count}`,
            `Open Issues: ${data.open_issues_count}`,
            `Language: ${data.language || "N/A"} | Visibility: ${data.visibility || "N/A"}`,
            `Default Branch: ${data.default_branch || "N/A"}`,
            `Last pushed: ${formatDate(data.pushed_at)}`,
            data.html_url,
          ].join("\n")
        )
      );
      return;
    }

    if (commandName === "github-activity") {
      const limit = Math.min(Math.max(optionValue(options, "limit", 5), 1), 10);
      const { data } = await githubApi.get(`/users/${GITHUB_USERNAME}/events/public`);
      const latest = data.slice(0, limit);

      if (latest.length === 0) {
        res
          .status(200)
          .json(interactionResponse(`No recent public activity found for ${GITHUB_USERNAME}.`));
        return;
      }

      const lines = latest.map((event, index) => {
        const repoName = event.repo?.name || "unknown repo";
        return `${index + 1}. ${event.type} on ${repoName} at ${formatDate(event.created_at)}`;
      });

      res.status(200).json(
        interactionResponse(
          [`**Recent GitHub Activity: ${GITHUB_USERNAME}**`, ...lines].join("\n")
        )
      );
      return;
    }

    if (commandName === "github-top-repos") {
      const limit = Math.min(Math.max(optionValue(options, "limit", 5), 1), 10);
      const repos = await getMyPublicRepos(GITHUB_USERNAME, 100);
      const ranked = [...repos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, limit);

      if (ranked.length === 0) {
        res.status(200).json(interactionResponse("No public repositories found."));
        return;
      }

      const lines = ranked.map((repoItem, index) => {
        return `${index + 1}. ${repoItem.name} - Stars ${repoItem.stargazers_count} | Forks ${repoItem.forks_count}`;
      });

      res.status(200).json(
        interactionResponse([`**${GITHUB_USERNAME} - Top Repositories**`, ...lines].join("\n"))
      );
      return;
    }

    if (commandName === "github-languages") {
      const repos = await getMyPublicRepos(GITHUB_USERNAME, 100);
      const languageCount = new Map();

      for (const repo of repos) {
        const language = repo.language || "Unknown";
        languageCount.set(language, (languageCount.get(language) || 0) + 1);
      }

      const rankedLanguages = [...languageCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      if (rankedLanguages.length === 0) {
        res.status(200).json(interactionResponse("No language data found."));
        return;
      }

      const lines = rankedLanguages.map(([language, count], idx) => {
        return `${idx + 1}. ${language} - ${count} repo(s)`;
      });

      res.status(200).json(
        interactionResponse(
          [`**${GITHUB_USERNAME} - Language Distribution**`, ...lines].join("\n")
        )
      );
      return;
    }

    res.status(200).json(interactionResponse(`Unknown command: ${commandName}`));
  } catch (error) {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || "Unknown GitHub API error.";
    const output = status ? `GitHub API Error (${status}): ${message}` : `Error: ${message}`;
    res.status(200).json(interactionResponse(output));
  }
};
