const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("pause")
  .setDescription("Pauses current track");
module.exports = data;
