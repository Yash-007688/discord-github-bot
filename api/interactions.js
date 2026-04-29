import { verifyKey } from "discord-interactions";
import { commandMap } from "../src/commands/index.js";

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function interactionResponse(content, embeds = []) {
  return {
    type: 4,
    data: { content, embeds },
  };
}

export default async function handler(req, res) {
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

  const commandName = interaction.data?.name || "";
  const options = interaction.data?.options || [];
  const command = commandMap.get(commandName);
  if (!command) {
    res.status(200).json(interactionResponse(`Unknown command: ${commandName}`));
    return;
  }

  try {
    let captured = { content: "", embeds: [] };
    const fakeInteraction = {
      options: {
        getString(name, required = false) {
          const found = options.find((option) => option.name === name)?.value;
          if (required && (found === undefined || found === null)) {
            throw new Error(`Missing required option: ${name}`);
          }
          return found ?? null;
        },
        getInteger(name, required = false) {
          const found = options.find((option) => option.name === name)?.value;
          if (required && (found === undefined || found === null)) {
            throw new Error(`Missing required option: ${name}`);
          }
          return found ?? null;
        },
      },
      async editReply(payload) {
        if (typeof payload === "string") {
          captured = { content: payload, embeds: [] };
          return;
        }
        const embeds = (payload?.embeds || []).map((embed) =>
          typeof embed.toJSON === "function" ? embed.toJSON() : embed
        );
        captured = { content: payload?.content || "", embeds };
      },
      async deferReply() {},
    };

    await command.execute(fakeInteraction);
    res.status(200).json(interactionResponse(captured.content || "Done.", captured.embeds));
  } catch (error) {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || "Unknown GitHub API error.";
    const output = status ? `GitHub API Error (${status}): ${message}` : `Error: ${message}`;
    res.status(200).json(interactionResponse(output));
  }
}
