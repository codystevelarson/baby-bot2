const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("loading")
  .setDescription("Plays random 'Loading' playlist song");
module.exports = data;
