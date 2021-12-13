const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("refresh")
  .setDescription("Refreshes baby-bot2 (log out/in)");

module.exports = data;
