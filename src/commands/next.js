const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("next")
  .setDescription("Plays next track in queue");
module.exports = data;
