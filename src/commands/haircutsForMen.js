const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("hfm")
  .setDescription("Plays random 'Haircuts for Men' playlist song");
module.exports = data;
