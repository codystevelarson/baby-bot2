require("dotenv").config();
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const token = process.env.BOT_TOKEN;

const rest = new REST({ version: "9" }).setToken(token);

const removeBotCommands = async () => {
  try {
    console.log("Started deleting all application (/) commands.");

    await rest
      .get(
        Routes.applicationGuildCommands(
          process.env.BOT_ID,
          "209117713786732545"
        )
      )
      .then((data) => {
        const promises = [];
        for (const command of data) {
          const deleteUrl = `${Routes.applicationGuildCommands(
            process.env.BOT_ID,
            "209117713786732545"
          )}/${command.id}`;
          promises.push(rest.delete(deleteUrl));
        }
        return Promise.all(promises);
      });

    console.log("Successfully deleted application (/) commands.");
  } catch (error) {
    console.error(error);
  }
};

removeBotCommands();
