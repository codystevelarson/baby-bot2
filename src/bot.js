const Discord = require("discord.js");
const {
  joinVoiceChannel,
  getVoiceConnection,
  createAudioPlayer,
  NoSubscriberBehavior,
  AudioPlayerStatus,
  AudioPlayerState,
  AudioResource,
  createAudioResource,
  StreamType,
  demuxProbe,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const { createReadStream, createWriteStream } = require("fs");
const { join } = require("path");

// const ActivityTypes = {
//   PLAYING = 0,
//   STREAMING = 1,
//   LISTENING = 2,
//   WATCHING = 3,
//   CUSTOM = 4,
//   COMPETING = 5,
// }

class Bot {
  _client;
  _token;
  _id;

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
    // this.playYoutubeUrl(msg, msg.content);
  };

  /**
   * Bot actions on message delete
   * from any text channel Bot has access to
   */
  onMessageDelete = (msg) => {
    // Return if message is from the bot itself
    if (msg.author.id == process.env.BOT_ID) return;

    console.log(`${msg.author.username}:[DELETED]: ${msg.content}`);
  };

  // User starts typing in channel
  onStartTyping = (typing) => {
    console.log(`${typing.user.username} typing in ${typing.channel.name}`);
  };

  // Connect to voice channel
  connectToVoice = async (channel) => {
    if (!channel || !channel.isVoice()) return;

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
  playYoutubeUrl = async (msg, url) => {
    // Validate url
    if (!ytdl.validateURL(url)) {
      msg.react("❌");
      msg.react("🔗");
      return;
    }

    // Get and validate info
    let info = await ytdl.getInfo(url);
    if (!info) {
      msg.react("❌");
      msg.react("🧠");
      return;
    }
    msg.react("👍");

    // Get stream
    let audio = ytdl(url, {
      filter: "audioonly",
      liveBuffer: 3000,
      formats: info.formats,
      quality: "highestaudio",
    });

    // Create audio resource with stream
    let resource = createAudioResource(audio, {
      inputType: StreamType.WebmOpus,
    });

    // Create audio player
    let player = this.getAudioPlayer();

    // Add player events
    player.on("stateChange", (oldState, newState) => {
      // Starts playing
      if (
        oldState.status == AudioPlayerStatus.Buffering &&
        newState.status == AudioPlayerStatus.Playing
      ) {
        msg.react("🎶");
      }
      // Stops playing
      if (
        oldState.status == AudioPlayerStatus.Playing &&
        newState.status == AudioPlayerStatus.Idle
      ) {
        this.disconnectFromVoice(msg.member.voice.channel);
        msg.react("✅");
      }
    });

    // Subscribe connection to player
    this.connectToVoice(msg.member.voice.channel).then((connection) => {
      // Play
      connection.subscribe(player);
      player.play(resource);
    });
  };
}

module.exports = Bot;
