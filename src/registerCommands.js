require("dotenv").config();
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const fs = require("fs");
const { join } = require("path");
const token = process.env.BOT_TOKEN;

const commands = [];
const commandFiles = fs
  .readdirSync(join(__dirname, "commands"))
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(join(__dirname, "commands", file));
  commands.push(command.toJSON());
}

const rest = new REST({ version: "9" }).setToken(token);

(registerBotCommands = async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(process.env.BOT_ID, process.env.GUILD_B),
      {
        body: commands,
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
