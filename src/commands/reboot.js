const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("reboot")
  .setDescription("Reboots baby-bot2");

module.exports = data;
