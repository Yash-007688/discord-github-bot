import { EmbedBuilder } from "discord.js";

export function premiumEmbed({
  title,
  description,
  color = 0x1f6feb,
  thumbnail,
  fields = [],
  footer = "Advanced GitHub Bot",
  url,
}) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description || null)
    .setTimestamp()
    .setFooter({ text: footer });

  if (thumbnail) embed.setThumbnail(thumbnail);
  if (url) embed.setURL(url);
  if (fields.length) embed.addFields(fields);
  return embed;
}
