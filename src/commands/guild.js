const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("guild")
  .setDescription("Plays random 'Loading' playlist song")
  .addStringOption((option) =>
    option
      .setName("info")
      .setDescription("What guild info you would like")
      .setRequired(true)
      .addChoice("Emojis", "emojis")
      .addChoice("Owner", "owner")
      .addChoice("Roles", "roles")
  );
module.exports = data;
