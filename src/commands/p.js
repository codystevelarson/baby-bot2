const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("p")
  .setDescription("Plays audio in a voice channel")
  .addStringOption((option) =>
    option.setName("url").setDescription("Youtube Url").setRequired(false)
  );

module.exports = data;
