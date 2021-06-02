const tmi = require('tmi.js');
const config = require('./config.json');

var channels = {};
channels.theatre = '#' + config.renko.channels.theatre;
channels.command = '#' + config.renko.channels.command;
channels.standard = config.renko.channels.standard.map(function (value) {
    return '#' + value;
});
channels.all = Array.from(channels.standard);
channels.all.push(channels.theatre);
channels.all.push(channels.command);

const client = new tmi.Client({
    options: { debug: true },
    connection: {
        secure: true,
        reconnect: true
    },
    identity: {
        username: config.renko.username,
        password: config.renko.oauth
    },
    channels: channels.all
});

var Maribel = null;

module.exports = {
    initialize: function() {
        client.connect()
            .then(() => console.log("connected"))
            .catch(console.error)
    },

    setMaribel: function(m) {
        Maribel = m;
    }
}

var discord_spam = "Join the TRT community: https://discord.gg/4KsV6pw";

var msgCount = 0;
var DISCORD_SPAM_DELAY = 1000 * 60 * 10;
var timer;

client.on('connected', (address) => {
    console.log('Connected to ' + address);
    client.say(channels.command, "connected").catch(console.error);
    //  ravid discord bot spam
    timer = setInterval(discordTimer, DISCORD_SPAM_DELAY);
});

// client.on("logon", function(x) {
//     console.log("login invoked");
// })

// client.on('error', function(err) {
//     console.log(this.arguments);
// });

client.on('message', (channel, user, message, self) => {
    if(self) return;
    //  ravid discord spam stuff
    if(channel == '#raviddog' && user.username != 'raviddog') {
        msgCount += 1;
    }

    // commands
    if(message.substring(0,1) == '!') {
        var args = message.slice(1).split(' ');
        if(args.length > 0) {
            if(channels.standard.indexOf(channel) != -1) {
                switch(args[0]) {
                    case 'zunsvision':
                        client.say(channel, 'ZUNsVision1 ZUNsVision2').catch(console.error);
                        setTimeout(function() {
                            client.say(channel, 'ZUNsVision3 ZUNsVision4').catch(console.error);
                        }, 1000);
                        break;
                }
            }
            if(channel == channels.theatre) {
                switch (args[0]) {
                    case 'discord':
                        sendMessageToChannel(channel, discord_spam);
                        break;
                    case 'schedule':
                        sendMessageToChannel(channel, Maribel.getSchedule());
                        break;
                }
            }




        }
    }
});

function sendMessageToChannel(channelName, message) {
    if (channelName.substring(0,1) != '#') {
        channelName = '#' + channelName;
    }
    client.say(channelName, message).catch(console.error);
}

function discordTimer() {
    if(msgCount > 20) {
        msgCount = 0;
        client.say('#raviddog', discord_spam);
    }
}

