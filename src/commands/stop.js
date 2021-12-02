const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stops audio in a voice channel");
module.exports = data;
