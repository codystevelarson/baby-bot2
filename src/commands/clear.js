const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Clears the audio queue");
module.exports = data;
