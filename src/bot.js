const Discord = require("discord.js");
const {
  joinVoiceChannel,
  getVoiceConnection,
  createAudioPlayer,
  NoSubscriberBehavior,
  AudioPlayerStatus,
  createAudioResource,
  StreamType,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const { join } = require("path");

class Bot {
  _client;
  _token;
  _id;
  snitches = [];

  constructor(token, id) {
    this._token = token;
    this._id = id;
    this._client = new Discord.Client({
      intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_PRESENCES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING,
        Discord.Intents.FLAGS.GUILD_VOICE_STATES,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING,
      ],
    });
    // Triggers
    this._client.once("ready", this.onReady);
    this._client.on("messageCreate", this.onMessage);
    this._client.on("messageDelete", this.onMessageDelete);
    this._client.on("typingStart", this.onStartTyping);
    this._client.on("interactionCreate", this.onInteraction);
  }

  start = () => {
    this.login();
  };

  login = async () => {
    if (this._token) {
      try {
        await this._client.login(this._token);
        this._client.setSatus;
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
  onReady = () => {
    console.log(`${this._client.user.username} ready!`);
    this._client.user.setActivity("(●'◡'●)", {
      name: "(●'◡'●)",
      type: 3,
    });
  };

  /**
   * Bot actions on ANY message
   * from any text channel Bot has access to
   */
  onMessage = async (msg) => {
    // Return if message is from the bot itself
    if (msg.author.id == process.env.BOT_ID) return;
    console.log(`${msg.author.username}: ${msg.content}`);

    // React for baby
    if (msg.content.includes("baby")) {
      msg.react("👶");
      msg.reply("(●'◡'●)");
    }
  };

  /**
   * Bot actions on message delete
   * from any text channel Bot has access to
   */
  onMessageDelete = (msg) => {
    if (this.snitches.includes(msg.author.id)) {
      msg.channel.send(
        `${msg.author.username} deleted a message: ***${msg.content}***`
      );
    }
    console.log(`${msg.author.username}:[DELETED]: ${msg.content}`);
  };

  /**
   * User starts typing in channel
   */
  onStartTyping = (typing) => {
    if (this.snitches.includes(typing.user.id)) {
      typing.channel.send(`${typing.user.username} is typing`);
    }
    console.log(`${typing.user.username} typing in ${typing.channel.name}`);
  };

  /**
   * Bot actions on interaction
   * from any text channel Bot has access to
   */
  onInteraction = (cmd) => {
    cmd.isCommand() ? console.log("command") : console.log("no");
    switch (cmd.commandName) {
      case "p":
        this.playYoutubeUrlCommand(cmd, cmd.options.getString("url"));
        break;
      case "stop":
        cmd.reply("👌");
        this.disconnectFromVoice(cmd.member.voice.channel);
        break;
      case "snitch":
        let user = cmd.options.getUser("user");
        this.registerSnitch(user);
        cmd.reply(`Snitching on ${user.username}`);
        break;
      default:
        cmd.reply("🤷‍♂️");
        return;
    }
  };

  // Connect to voice channel
  connectToVoice = async (channel) => {
    if (!channel || !channel.isVoice()) return null;

    // Check for voice connection
    let connection = getVoiceConnection(channel.guild.id);
    if (connection) return connection;

    // Connect to voice channel
    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    return connection;
  };

  // Disconnect from a voice channel connection
  disconnectFromVoiceConnection = (connection) => {
    connection.destroy();
  };

  // Finds an open voice connection in a channel
  // then disconnects
  disconnectFromVoice = (channel) => {
    let connection = getVoiceConnection(channel.guild.id);
    if (connection) connection.destroy();
  };

  // Creates an audo planyer with error handler
  getAudioPlayer = () => {
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });
    // Set error handling
    player.on("error", (error) => {
      console.error(
        "Error:",
        error.message,
        "with resource",
        error.resource.metadata?.title
      );
    });

    return player;
  };

  // Creates an audio resource from a file name in the /assets/audio dir
  getResourceFromFile = (filename) => {
    let resource = createAudioResource(
      join(__dirname, "assets", "audio", filename)
    );
    return resource;
  };

  // Connects to voice channel
  // plays a youtube video's audio via url
  playYoutubeUrlCommand = async (cmd, url) => {
    // Validate url
    if (!ytdl.validateURL(url)) {
      cmd.reply({ content: "Bad url", ephemeral: true });
      return;
    }

    // Get and validate info
    let info = await ytdl.getInfo(url);
    if (!info) {
      cmd.reply({ content: "Couldn't find video info", ephemeral: true });
      return;
    }

    // Get stream
    let audio = ytdl(url, {
      filter: "audioonly",
      // liveBuffer: 3000,
      // formats: info.formats,
      // quality: "highestaudio",
    });

    // Create audio resource with stream
    let resource = createAudioResource(audio, {
      inputType: StreamType.WebmOpus,
    });

    // Create audio player
    let player = this.getAudioPlayer();

    // Add player events
    player.on("stateChange", async (oldState, newState) => {
      // Starts playing
      if (
        oldState.status == AudioPlayerStatus.Buffering &&
        newState.status == AudioPlayerStatus.Playing
      ) {
        cmd.reply(`🎶 - ${info.videoDetails.title}`);
      }
      // Stops playing
      if (
        oldState.status == AudioPlayerStatus.Playing &&
        newState.status == AudioPlayerStatus.Idle
      ) {
        this.disconnectFromVoice(cmd.member.voice.channel);
        cmd.fetchReply().then((msg) => msg.react("✅"));
      }
    });

    // Subscribe connection to player
    this.connectToVoice(cmd.member.voice?.channel).then(async (connection) => {
      if (!connection) {
        cmd.reply({
          content: "Must be in voice channel to play audio",
          ephemeral: true,
        });
        return;
      }
      // Play
      connection.subscribe(player);
      player.play(resource);
    });
  };

  registerSnitch = (user) => {
    this.snitches.push(user.id);
  };
}

module.exports = Bot;
