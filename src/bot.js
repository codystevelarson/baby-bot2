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
  players = {};
  playing = {};
  queue = {};
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
      case "playing":
        this.getPlaying(cmd);
        break;
      case "play":
      case "p":
        this.playYoutubeUrlCommand(cmd, cmd.options.getString("url"));
        break;
      case "stop":
        cmd.reply("🛑");
        this.disconnectFromVoice(cmd.member.voice.channel);
        break;
      case "pause":
        this.pauseAudio(cmd);
        break;
      case "unpause":
        this.resumeAudio(cmd);
        break;
      case "queue":
        this.getQueue(cmd);
        break;
      case "clear":
        this.clearAudioQueue(cmd);
        cmd.reply("💨");
        break;
      case "next":
        let playing = this.playing[cmd.member.voice.channel.id];
        console.log(playing);
        if (playing) playing.cmd.fetchReply().then((msg) => msg.react("⏭"));
        if (this.stopAudioPlayer(cmd.member.voice.channel.id)) {
          cmd.reply("⏭");
        } else {
          cmd.reply("Nothing in queue 👻");
        }
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

  stopAudioPlayer = (channelId) => {
    let player = this.players[channelId];
    if (!player) {
      return false;
    }
    player.stop();
    this.players[channelId] = null;
    console.log("Stopped and removed player for", channelId);
    return true;
  };

  isPlaying = (channelId) => {
    let playing =
      this.players[channelId]?.state?.status == AudioPlayerStatus.Playing
        ? true
        : false;
    console.log(`${channelId} currently playing:`, playing);
    return playing;
  };

  saveAudioPlayer = (player, channelId) => {
    console.log("Saving player for", channelId);
    this.players[channelId] = player;
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
  playYoutubeUrlCommand = async (cmd, url, begin) => {
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

    // Check if currently playing to add command to queue
    if (this.isPlaying(cmd.member.voice.channel.id)) {
      cmd.reply(`📝 ***Queued - ${info.videoDetails.title}***`);
      let next = cmd.options.getBoolean("next") ?? false;
      this.queueAudio(cmd, url, next, info);
      return;
    }

    // Get stream
    let audio = ytdl(url, {
      filter: "audioonly",
      begin: begin ?? 0,
    });

    // Create audio resource with stream
    let resource = createAudioResource(audio, {
      inputType: StreamType.WebmOpus,
      inlineVolume: true,
    });

    // Get and set volume
    let vol = cmd.options.getInteger("volume")
      ? cmd.options.getInteger("volume") / 10
      : 1;
    resource.volume.setVolume(vol);

    // Create audio player
    let player = this.getAudioPlayer();

    // Add player events
    player.on("stateChange", async (oldState, newState) => {
      // Starts playing
      if (
        oldState.status == AudioPlayerStatus.Buffering &&
        newState.status == AudioPlayerStatus.Playing
      ) {
        let reply = `🎶 - ${info.videoDetails.title}`;
        cmd.replied ? cmd.editReply(reply) : cmd.reply(reply);
      }
      if (
        oldState.status == AudioPlayerStatus.Playing &&
        newState.status == AudioPlayerStatus.Paused
      ) {
        let elapsed = millisecondsToHuman(resource.playbackDuration);
        console.log("paused at", elapsed);
        this.playing[cmd.member.voice.channel.id].resume = elapsed;
      }
      // Stops playing
      if (
        oldState.status == AudioPlayerStatus.Playing &&
        newState.status == AudioPlayerStatus.Idle
      ) {
        // Reply
        cmd.fetchReply().then((msg) => msg.react("✅"));

        // Check Queue if audio ended
        // if queue play next
        if (resource.ended) {
          console.log("Audio ended", resource.ended);
          if (this.playNext(cmd.member.voice.channel.id)) return;
        }

        // Nothing in queue
        // Disconnect from voice and remove audio player
        console.log("Disconnecting from", cmd.member.voice.channel.id);
        this.disconnectFromVoice(cmd.member.voice.channel);
        this.players[cmd.member.voice.channel.id] = null;
        this.playing[cmd.member.voice.channel.id] = null;
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
      // Add player to list
      this.saveAudioPlayer(player, cmd.member.voice.channel.id);
      // Add playing
      this.playing[cmd.member.voice.channel.id] = { cmd, url, info };
    });
  };

  pauseAudio = (cmd) => {
    let player = this.players[cmd.member.voice.channel.id];
    if (!player) return false;

    player.pause();
    this.playing[cmd.member.voice.channel.id].cmd
      .fetchReply()
      .then((msg) => msg.react("⏸"));
    cmd.reply({ content: "Paused", ephemeral: true });
  };

  resumeAudio = (cmd) => {
    let player = this.players[cmd.member.voice.channel.id];
    if (!player) {
      cmd.reply("Nothing is playing 🙉");
      return false;
    }

    let playing = this.playing[cmd.member.voice.channel.id];
    this.playYoutubeUrlCommand(cmd, playing.url, playing.resume);
    playing.cmd.fetchReply().then((msg) => {
      msg.reactions.cache.get("⏸").remove();
      msg.react("▶");
    });
  };

  // Plays next
  playNext = (channelId) => {
    console.log("Playing next for", channelId);
    // Get queue
    let queue = this.queue[channelId];
    if (!queue?.length) {
      console.log("Nothing in queue for", channelId);
      return false;
    }

    // Get next
    let audioItem = queue[0];

    console.log("audio item", audioItem);
    // Play next in queue
    this.playYoutubeUrlCommand(audioItem.cmd, audioItem.url);

    // Remove next
    this.queue[channelId].shift();

    // Return playing next is true!
    return true;
  };

  getPlaying = (cmd) => {
    let playing = this.playing[cmd.member.voice.channel.id];
    let content = playing
      ? `***Playing - ${playing.info.videoDetails.title}***`
      : "🙉";

    cmd.reply({ content, ephemeral: true });
  };

  queueAudio = (cmd, url, next, info) => {
    // Get queue or default
    let channelId = cmd.member.voice.channel.id;
    let queue = this.queue[channelId] ?? [];

    let audioItem = {
      cmd,
      url,
      info,
    };

    // Add command and url to queue
    next ? queue.unshift(audioItem) : queue.push(audioItem);
    // Save queue
    this.queue[channelId] = queue;
  };

  getQueue = (cmd) => {
    let queue = this.queue[cmd.member.voice.channel.id];
    if (!queue?.length) {
      cmd.reply("Nonthing in queue 👻");
      return;
    }
    let nextTracks = queue
      .map((item) => item.info.videoDetails.title)
      .join("\n");
    cmd.reply(`Up Next: ${nextTracks}`);
  };

  clearAudioQueue = (cmd) => {
    console.log("Clearing Queue for", cmd.member.voice.channel.id);
    if (this.queue[cmd.member.voice.channel.id]?.length) {
      Promise.all(
        this.queue[cmd.member.voice.channel.id].map((item) =>
          item.cmd.deleteReply()
        )
      );
    }
    this.queue[cmd.member.voice.channel.id] = [];
  };

  registerSnitch = (user) => {
    this.snitches.push(user.id);
  };
}

function millisecondsToHuman(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const hours = Math.floor((ms / 1000 / 3600) % 24);

  const humanized = [
    "0ms",
    `${seconds.toString()}s`,
    `${minutes.toString()}m`,
    `${hours.toString()}h`,
  ].join(",");

  return humanized;
}

module.exports = Bot;
