class Bot {
  Discord;
  _client;
  _token;
  _id;

  constructor(token, id) {
    this._token = token;
    this._id = id;
    this.Discord = require("discord.js");
    this._client = new this.Discord.Client({
      intents: [
        this.Discord.Intents.FLAGS.GUILDS,
        this.Discord.Intents.FLAGS.GUILD_MESSAGES,
        this.Discord.Intents.FLAGS.GUILD_PRESENCES,
        this.Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        this.Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING,
        this.Discord.Intents.FLAGS.GUILD_VOICE_STATES,
        this.Discord.Intents.FLAGS.DIRECT_MESSAGES,
        this.Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        this.Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING,
      ],
    });
    // Triggers
    this._client.once("ready", this.onReady);
    this._client.on("messageCreate", this.onMessage);
    this._client.on("messageDelete", this.onMessageDelete);
    this._client.on("typingStart", this.onStartTyping);
  }

  start = () => {
    this.login();
  };

  login = async () => {
    if (this._token) {
      try {
        await this._client.login(this._token);
        // logClient(this._client);
      } catch (e) {
        this._client.destroy();
      }
    } else {
      console.log("NO TOKEN");
      this._client.destroy();
    }
  };

  /**
   * Bot actions on successful sign-in
   */
  onReady() {
    console.log(`${this.user.username} ready!`);
  }

  /**
   * Bot actions on ANY message
   * from any text channel Bot has access to
   */
  onMessage(msg) {
    // Return if message is from the bot itself
    if (msg.author.id == process.env.BOT_ID) return;
    console.log(`${msg.author.username}: ${msg.content}`);
    if (msg.content.includes("baby-bot")) {
      msg.react("👀");
      msg.react("👶");
    }
  }

  /**
   * Bot actions on message delete
   * from any text channel Bot has access to
   */
  onMessageDelete(msg) {
    // Return if message is from the bot itself
    if (msg.author.id == process.env.BOT_ID) return;

    console.log(`${msg.author.username}:[DELETED]: ${msg.content}`);
  }

  onStartTyping(typing) {
    console.log(`${typing.user.username} typing....`);
  }
}

module.exports = Bot;
