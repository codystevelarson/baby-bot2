const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("play")
  .setDescription("Plays audio in a voice channel")
  .addStringOption((option) =>
    option.setName("url").setDescription("Youtube Url").setRequired(false)
  )
  .addIntegerOption((option) =>
    option
      .setName("volume")
      .setDescription("Volume of audio")
      .setRequired(false)
      .addChoice("Pain 😡", 20)
      .addChoice("Too Loud 🙉", 15)
      .addChoice("Loud 👴", 10)
      .addChoice("Normal 👍", 7)
      .addChoice("Chill 😎", 5)
      .addChoice("Low 👶", 3)
      .addChoice("Quiet 😪", 1)
  )
  .addBooleanOption((option) =>
    option
      .setName("next")
      .setDescription("Queue this song to play next")
      .setRequired(false)
  );
module.exports = data;
