const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("unpause")
  .setDescription("Resumes the paused track");
module.exports = data;
