const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("queue")
  .setDescription("Shows tracks in the queue");
module.exports = data;
