const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("compliment")
  .setDescription("Sends a random compliment!")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("Who will be complimented. Default is you.")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("what")
      .setDescription("what will be complimented")
      .setRequired(false)
      .addChoice("Feet", "feet")
      .addChoice("Smile", "smile")
      .addChoice("Personality", "personality")
      .addChoice("Other", "other")
  )
  .addStringOption((option) =>
    option.setName("extra").setDescription("Add to what").setRequired(false)
  )
  .addBooleanOption((option) =>
    option
      .setName("announce")
      .setDescription("Announce in chat")
      .setRequired(false)
  );

module.exports = data;
