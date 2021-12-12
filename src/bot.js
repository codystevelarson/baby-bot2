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
const getRandomEmoji = require("./data/emojis");

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
    cmd.isCommand()
      ? console.log("command", cmd.commandName)
      : console.log("not command");

    // Text commands
    switch (cmd.commandName) {
      case "think":
        this.think(cmd);
        return;
      case "snitch":
        let user = cmd.options.getUser("user");
        this.registerSnitch(user);
        cmd.reply(`Snitching on ${user.username}`);
        return;
      case "guild":
        this.sendGuildInfo(cmd);
        return;
      default:
        break;
    }

    // Validate voice channel commands
    let voiceId = cmdVId(cmd);
    if (!voiceId) {
      cmd.reply({
        content: "Must be in voice channel to play audio",
        ephemeral: true,
      });
      return;
    }

    // Voice commands
    switch (cmd.commandName) {
      case "playing":
        this.getPlaying(cmd);
        break;
      case "play":
      case "p":
        let url = cmd.options.getString("url");
        // If resuming queue
        if (!url) {
          if (this.playNext(voiceId)) {
            cmd.reply("▶📃");
            return;
          }
        }
        // Defer reply for more time
        // Future replies must be edit/delete/followUp
        cmd.deferReply();
        this.playYoutubeUrlCommand(cmd, url);
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
      case "clear":
        this.clearAudioQueue(cmdVId(cmd));
        cmd.reply("💨");
        break;
      case "next":
        let playing = this.playing[voiceId];
        console.log(playing);
        if (playing) playing.cmd.fetchReply().then((msg) => msg.react("⏭"));
        if (this.stopAudioPlayer(voiceId)) {
          cmd.reply("⏭");
        } else {
          cmd.reply("Nothing in queue 👻");
        }
        break;
      case "playlist":
        this.queuePlaylist(cmd);
        return;
      case "queue":
        this.getQueue(cmd);
        return;
      default:
        cmd.reply("🤷‍♂️");
        return;
    }
  };

  /// Gets all current voice connections
  getVoiceConnetions = () => {
    let connections = Array.from(Object.entries(this._client.voice.adapters));
    console.log("Current voice channels:", connections);
  };

  // Connect to voice channel
  connectToVoice = async (channel) => {
    if (!channel || !channel.isVoice()) return null;
    console.log(this.getVoiceConnetions());

    // Check for voice connection
    console.log("Fetching voice channel in guild:", channel.guild.id);
    let connection = getVoiceConnection(channel.guild.id);
    if (connection) {
      // Check for voice connection in command's voice channel
      if (this._client.voice.adapters[channel.id]) {
        console.log("Connected to:", channel.id);
        return connection;
      }
      // Destroy current connection
      console.log("Moving connection to:", channel.id);
      // Dispose player playing and clear queue in all other channels
      this.getGuildChannels(channel.guild).forEach((ch, idx) => {
        if (ch[0] !== channel.id && !ch[1].delted) {
          this.stopAudioPlayer(ch[0]);
          this.clearAudioQueue(ch[0]);
        }
      });
      connection.destroy();
    }

    // Create connection to voice channel
    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    console.log("Connected to:", channel.id);
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
  createAudioPlayer = () => {
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
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
    this.playing[channelId] = null;
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
    let voiceId = cmdVId(cmd);
    // Validate url
    if (!ytdl.validateURL(url)) {
      cmd.editReply({ content: "👎🔗", ephemeral: true });
      return;
    }

    // Get and validate info
    let info = await ytdl.getInfo(url);
    if (!info) {
      cmd.editReply({ content: "Couldn't find video info", ephemeral: true });
      return;
    }

    // Check if currently playing to add command to queue
    if (this.isPlaying(voiceId)) {
      cmd.editReply(`📝 ***Queued - ${info.videoDetails.title}***`);
      let next = cmd.options.getBoolean("next") ?? false;
      this.queueAudio(cmd, url, info, next);
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
    let player = this.createAudioPlayer();

    // Set error handling
    player.on("error", (error) => {
      console.error("Error:", error.message, "with resource", error.resource);
      // Reply
      cmd.fetchReply().then((msg) => msg.react("❌"));

      // Check Queue if audio ended
      // if queue play next
      if (this.playNext(voiceId)) return;

      // Nothing in queue
      // Disconnect from voice and remove audio player
      console.log("Disconnecting from", voiceId);
      this.disconnectFromVoice(cmd.member.voice.channel);
      this.players[voiceId] = null;
      this.playing[voiceId] = null;
    });

    // Add player events
    player.on("stateChange", async (oldState, newState) => {
      // Starts playing
      if (
        oldState.status == AudioPlayerStatus.Buffering &&
        newState.status == AudioPlayerStatus.Playing
      ) {
        let reply = `🎶 - ${info.videoDetails.title}`;
        cmd.editReply(reply);
      }
      if (
        oldState.status == AudioPlayerStatus.Playing &&
        newState.status == AudioPlayerStatus.Paused
      ) {
        let elapsed = millisecondsToHuman(resource.playbackDuration);
        console.log("paused at", elapsed);
        this.playing[voiceId].resume = elapsed;
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
          if (this.playNext(voiceId)) return;
        }

        // Nothing in queue
        // Disconnect from voice and remove audio player
        console.log("Disconnecting from", voiceId);
        this.disconnectFromVoice(cmd.member.voice.channel);
        this.players[voiceId] = null;
        this.playing[voiceId] = null;
      }
    });

    // Subscribe connection to player
    this.connectToVoice(cmd.member.voice?.channel).then(async (connection) => {
      if (!connection) {
        cmd.editReply({
          content: "Must be in voice channel to play audio",
          ephemeral: true,
        });
        return;
      }

      // Play
      connection.subscribe(player);
      player.play(resource);
      // Add player to list
      this.saveAudioPlayer(player, voiceId);
      // Add playing
      this.playing[voiceId] = { cmd, url, info };
    });
  };

  pauseAudio = (cmd) => {
    const voiceId = cmdVId(cmd);
    let player = this.players[voiceId];
    if (!player) return false;

    player.pause();
    this.playing[voiceId].cmd.fetchReply().then((msg) => msg.react("⏸"));
    cmd.reply({ content: "Paused", ephemeral: true });
  };

  resumeAudio = (cmd) => {
    const voiceId = cmdVId(cmd);

    let player = this.players[voiceId];
    if (!player) {
      cmd.reply("Nothing is playing 🙉");
      return false;
    }

    let playing = this.playing[voiceId];
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
    let playing = this.playing[cmdVId(cmd)];
    let content = playing
      ? `***Playing - ${playing.info.videoDetails.title}***`
      : "🙉";

    cmd.reply({ content, ephemeral: true });
  };

  queueAudio = (cmd, url, info, next) => {
    // Get queue or default
    let channelId = cmdVId(cmd);
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

  queuePlaylist = async (cmd) => {
    await cmd.deferReply();
    let voiceId = cmdVId(cmd);
    let name = cmd.options.getString("name");
    // Static files
    const playlist = require(`./playlists/${name}.js`);
    if (playlist) {
      cmd.editReply("Loading tracks...");
      this.clearAudioQueue(cmdVId(cmd));
      this.stopAudioPlayer(voiceId);
      await playlist.forEach(async (url, idx) => {
        // Get and validate info
        let info = await ytdl.getInfo(url);
        if (!info) {
          cmd.editReply({
            content: "Couldn't find video info",
            ephemeral: true,
          });
          return;
        }
        this.queueAudio(cmd, url, info);
        if (idx == playlist.length - 1) {
          this.playNext(voiceId);
        }
      });

      return;
    }
    cmd.editReply("🤷‍♂️📃");
  };

  getQueue = (cmd) => {
    let queue = this.queue[cmdVId(cmd)];
    if (!queue?.length) {
      cmd.reply({ content: "Nonthing in queue 👻", ephemeral: true });
      return;
    }
    let nextTracks = queue
      .map((item, idx) =>
        idx == 0
          ? `***${item.info.videoDetails.title}***`
          : item.info.videoDetails.title
      )
      .join("\n");
    cmd.reply(`***Up Next:*** ${nextTracks}`);
  };

  clearAudioQueue = (voiceId) => {
    console.log("Clearing Queue for", voiceId);
    this.queue[voiceId] = [];
  };

  registerSnitch = (user) => {
    this.snitches.push(user.id);
  };

  think = (cmd) => {
    const max = 20;
    cmd.deferReply();
    let power = cmd.options.getInteger("level") ?? 1;
    power = power > max ? max * 1000 : power < 1 ? 1000 : power * 1000;
    setTimeout(() => {
      let emojis = getRandomEmoji(
        power / 1000,
        this.getGuildEmojis(cmd.member.guild).map((e) => e.toString())
      );
      cmd.editReply(`🤖 💭 ${emojis}`);
    }, power);
  };

  sendGuildInfo = async (cmd) => {
    await cmd.deferReply();
    let guild = cmd.member.guild;
    console.log(guild);
    let infoKey = cmd.options.getString("info");
    switch (infoKey) {
      case "emojis":
        let emojis = this.getGuildEmojis(cmd.member.guild).map((e) =>
          e.toString()
        );
        cmd.editReply(
          emojis.length
            ? `***Emojis:***\n${emojis.join("\n")}`
            : "No Guild Emojis"
        );
        break;
      case "owner":
        let owner = this.getGuildOwner(guild);
        cmd.editReply(`***${owner.username}*** owns ${guild.name}`);
        break;
      case "roles":
        let reply = Array.from(guild.roles.cache.entries())
          .filter((r) => r[1].name !== "@everyone")
          .filter((r) => r[1].name !== "Admin")
          .map((r) => {
            return r[1].name;
          });
        console.log(reply);
        cmd.editReply(
          reply.length ? `***Roles:***\n${reply.join("\n")}` : "no roles"
        );
        break;
      default:
        cmd.editReply("🤷‍♂️");
        return;
    }
  };

  //////// INFO STUFF
  // Get Current Guild Info
  getGuildPreview = async (guild) => {
    let prv = await this._client.fetchGuildPreview(guild);
    console.log("Guild Preview", prv);
    return prv;
  };

  // Get channels in guild
  getGuildChannels = (guild, isVoice = true) => {
    let voiceChannelMap = Array.from(
      guild.channels._cache.filter((channel) => channel.isVoice() === isVoice)
    );
    console.log(
      `Guild ${!isVoice ? "Text" : "Voice"} Channels:`,
      voiceChannelMap
    );
    return voiceChannelMap;
  };

  getGuildOwner = (guild) => {
    let owner = guild.members.cache.get(guild.ownerId);
    console.log("Guild Owner:", owner.user);
    return owner?.user;
  };

  getGuildEmojis = (guild) => {
    let emojis = Array.from(guild.emojis.cache.entries())
      .filter((e) => !e.deleted)
      .map((eArr) => eArr[1]);
    console.log("Guild Emjois", emojis);
    return emojis;
  };
}

const cmdVId = (cmd) => cmd?.member?.voice?.channel?.id ?? null;

const millisecondsToHuman = (ms) => {
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
};

module.exports = Bot;
