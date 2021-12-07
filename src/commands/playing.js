const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("playing")
  .setDescription("Tells you what song is playing");
module.exports = data;
