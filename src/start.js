const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const Bot = require("./bot");

// Startup function
const appStart = () => {
  console.log("Server Started");
  const bot = new Bot(process.env.BOT_TOKEN, process.env.BOT_ID);
  bot.start();
};

// App
app.listen(3000, () => appStart());

// Endpoints
app.get("/", (req, res) => {
  // Send Message
  res.send("Hello from baby bot 2.0!");
});

app.get("/test", (req, res) => {
  res.send("Test Passed");
});
