const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("playlist")
  .setDescription("Plays a premade playlist")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("Playlist that will play")
      .setRequired(true)
      .addChoice("Loading", "loading")
      .addChoice("Haircuts for Men", "haircutsformen")
  );

module.exports = data;
