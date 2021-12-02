const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("snitch")
  .setDescription("Snitches on a user")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("User who will be snitched on")
      .setRequired(true)
  );

module.exports = data;
