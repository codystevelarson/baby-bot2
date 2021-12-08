const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("think")
  .setDescription("🧠")
  .addIntegerOption((option) =>
    option
      .setName("level")
      .setDescription("How hard it will think")
      .setRequired(false)
  );
module.exports = data;
