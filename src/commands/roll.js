const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("roll")
  .setDescription("Rolls a random positive number")
  .addIntegerOption((option) =>
    option
      .setName("num_dice")
      .setDescription("How many dice to roll at once (Default 1)")
      .setRequired(false)
  )
  .addIntegerOption((option) =>
    option
      .setName("max_value")
      .setDescription("Max value (Default 6)")
      .setRequired(false)
  );

module.exports = data;
