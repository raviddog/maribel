const tmi = require('tmi.js');
const config = require('./config.json');

var channelactive = config.renko.channels;

var channels = {};
channels.theaterChannel = '#' + config.renko.channels.theatre;
channels.command = '#' + config.renko.channels.command;
channels.standard = config.renko.channels.standard.map(function (value) {
    return '#' + value;
channels.all = channels.theaterChannel.concat(channels.command.concat(channels.standard));
});

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
    channels: config.renko.channels.all
});

// console.log("config is",config.renko,config.renko.username);
var Maribel = null;

module.exports = {
    initialize: function(isDebug) {
        if (isDebug) {
            return; // don't connect
        }
        client.connect()
            .then(() => console.log("connected"))
            .catch(console.error)
    },
    setMaribel: function(m) {
        Maribel = m;
    },
    sendMessage: function(channelName, message) {
        sendMessageToChannel(channelName, message);
    },
    setTheatre: function(channelName) {

    }
}



var discord_spam = "Join the TRT community: https://discord.gg/4KsV6pw";


var spammyMode = true;
var enabled = false;
var theaterMode = false;
var msgCount = 0;
var DISCORD_SPAM_DELAY = 1000 * 60 * 30;
var timer;

var COMMAND_QUOTAS = {
    default: {
        wait: 30000
        // messageCount: 20
    }
}

client.on('connected', (address) => {
    console.log('Connected to ' + address);
    client.say(channels.command, "connected").catch(console.error);
});

client.on("logon", function(x) {
    console.log("login invoked");
})

client.on('error', function(err) {
    console.log(this.arguments);
});

// client.on("raw_message", console.log);

client.on('message', (channel, user, message, self) => {
    if(self) return;

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
                    case '!theater':
                        sendNotImplemented(channel, args[0]);
                        break;
                    case '!submit':
                        sendQuotaMessageToChannel('!submit', channel, "For now, use our discord channel to submit replays. "+discord_spam);
                        break;
                    case '!schedule':
                        sendNotImplemented(channel, args[0]);
                        break;
                    case '!cover':
                        sendQuotaMessageToChannel(args[0], channel, 'COVER YOUR EEEEYES!!! BrokeBack');
                        break;
                }
            }




        }
    }
    
    /*
    if(channels.standard.indexof(channel) != -1) {
        if (message.substring(0,1) == '!') {
            let args = message.split(' ');
            // theater only commands
            if (theaterChannel == channel) {
                switch (args[0]) {
                    case '!theater':
                        sendNotImplemented(channel, args[0]);
                        break;
                    case '!submit':
                        sendQuotaMessageToChannel('!submit', channel, "For now, use our discord channel to submit replays. "+discord_spam);
                        break;
                    case '!schedule':
                        sendQuotaMessageToChannel('!schedule', channel, "https://trt.mamizou.wtf/schedule");
                        break;
                }
            }
            switch (args[0]) {
                case '!discord':
                    sendQuotaMessageToChannel('!discord', channel, discord_spam);
                    break;
                case '!zunsvision':
                    client.say(channel, 'ZUNsVision1 ZUNsVision2').catch(console.error);
                    setTimeout(function() {
                        client.say(channel, 'ZUNsVision3 ZUNsVision4').catch(console.error);
                    }, 1000);
                    break;
                case '!quote':
                    sendNotImplemented(channel, args[0]);
                    break;
                case '!cover':
                    sendQuotaMessageToChannel(args[0], channel, 'COVER YOUR EEEEYES!!! BrokeBack');
                    break;
            }
        } else {
            // special cases
            let messageLowered = message.toLowerCase();

            if (messageLowered.indexOf("does this clear") != -1) {
                sendQuotaMessageToChannel('doesthisclear', channel, "Does this even clear? Kappa");
            } else if (messageLowered.indexOf("8888") != -1) {
                sendQuotaMessageToChannel('8888', channel, messageLowered);
            }
            if (spammyMode) {
                if (message == 'Kappa') {
                    sendQuotaMessageToChannel('Kappa', channel, 'Kappa');
                } else if (message == 'LUL') {
                    sendQuotaMessageToChannel('LUL', channel, 'LUL');
                } else if (messageLowered.indexOf("lolk") != -1) {
                    sendQuotaMessageToChannel('LULK', channel, 'LUL K');
                }
            }
            
        }
    } */
});

function sendMessageToChannel(channelName, message) {
    // TODO: put limits and such on this?
    if (channelName.substring(0,1) != '#') {
        channelName = '#' + channelName;
    }
    client.say(channelName, message).catch(console.error);
}

function sendQuotaMessageToChannel(command, channelName, message) {
    if (!COMMAND_QUOTAS[command]) {
        COMMAND_QUOTAS[command] = Object.assign({}, COMMAND_QUOTAS['default']); // use the default
    }
    let quota = COMMAND_QUOTAS[command];
    
    if (quota.wait) {
        if (quota.lastSent && (Date.now()-quota.lastSent) < quota.wait) {
            console.log('too fast ignoring command',command);
            return;
        }
    }
    quota.lastSent = Date.now();
    console.log(COMMAND_QUOTAS);
    setTimeout(function() {
        sendMessageToChannel(channelName, message);
    }, randomInt(1000,3000));
    
}

function randomInt(a,b) {
    return a + Math.floor(Math.random()*(b-a));
}

function sendNotImplemented(channel, commandName) {
    sendQuotaMessageToChannel(channel, 'notImplemented', channelName, `The ${commandName} command is not implemented. Scream at Baka to fix.`);
}

function getDateTime() {
    return (new Date()).toISOString();
}

