const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
var fs = require('fs');

// replay data structure
/*
const placeholder = { 
    "user" : "sample",
    "url" : "sample",
    "notes" : "placeholder value",
    "msgid" : "sample"
}
*/

// singleton
var Renko = null;

module.exports = {
    initialize: function() {
        client.login(config.discord.token);
    },
    setRenko: function(r) {
        Renko = r;
    },
    sendMessage: function(msg) {
        sendMessageToChannel(config.discord.channel, msg);
    }
}

var replays = [];
var schedule = [];

// hold recent logging info so we can query it from discord instead of server side
var MAX_RECENT_LOG_LENGTH = 20;
var recentLogs = [];

client.on('ready', () => {
    log(`Logged in as ${client.user.tag}`);
    client.user.setActivity(config.discord.game, {type : 'PLAYING'});
    replays = loadFromJson('replays');
    schedule = loadFromJson('schedule');
});

client.on('messageDelete', message => {
    var index = replays.findIndex(replay => replay.msgid == message.id);
    if(index > -1) {
        replays.splice(index, 1);
        sendMessageLog(message, 'Removed replay from ' + message.author.tag, 'Removed replay from ' + message.author.tag);
        saveReplays();
    }
});

client.on('message', message => {
    if(message.author.id == client.user.id) return; // ignore bot's messages
    if(isMaster(message.author.id)) { // master commands
        if(message.content == '!save') {
            saveReplays();
            return;
        }
    }
    if(isChannel(message.channel.id) || isMaster(message.author.id)) {
        if(message.attachments.size != 0) { // attachment, try to parse it as a replay
            var hasReplay = false;
            var replayCount = 0;
            message.attachments.forEach(attachment => {
                var extension = attachment.filename.split('.').pop();
                if(extension == 'dat' || extension == 'rpy') {
                    //replay file
                    var replay = {
                        user: message.author.tag,
                        url: attachment.url,
                        notes: message.content,
                        msgid: message.id
                    }
                    replayCount += 1;
                    replays.push(replay);
                    // console.log(replay);
                    hasReplay = true;
                }
            });
            if(hasReplay) {
                sendMessage(message, "Added " + replayCount + " replay");
                saveReplays();
            }
        } else if(message.content.substring(0,1) == '!') {
            var args = message.content.slice(1).split(' '); 
            if(args.length > 0) {
                let command = args[0];
                let arg = args[1] || null;
                if (isMaster(message.author.id) || isVIP(message.author.id)) {
                    // VIP commands
                    switch (command) {
                        case 'logs':
                            commands.logs(message);
                            break;
                        case 'twitch':
                            commands.twitch(arg, message);
                            break;
                        case 'remove': 
                            commands.remove(arg, message);
                            break;
                        case 'drop':
                            commands.drop(arg, message);
                            break;
                        case 'add':
                            commands.add(args, message);
                            break;
                        case 'twitchsay':
                            commands.twitchsay(args, message);
                            break;
                    }
                }
                switch (command) {
                    case 'replays':
                        commands.replays(message);
                        break;
                    case 'help':
                        commands.help(arg, message);
                        break;
                }  
            }
        }
        
    }
});


// command functions
var commands = {};
commands.replays = function(message) {
    sendMessage(message, 'There are currently ' + (replays.length) + ' replays');
    var msg = "";
    replays.forEach(function (value, index) {
        var s = formatReplay(index, value);
        var newmsg = msg + s;
        if(newmsg.length >= 2000) {
            sendMessage(message, msg);
            msg = s;
        } else {
            msg = newmsg;
        }
    });
    sendMessageLog(message, msg, "Sent replays");
}
commands.remove = function(n, message) {
    let num = parseInt(n);
    if(!isNaN(num)) {
        if(num < replays.length && num > 0) {
            replays.splice(num, 1);
            sendMessageLog(message, "Removed replay #" + num, "Removed replay #" + num);
            saveReplays();
        } else {
            sendMessage(message, "Invalid replay number");
        }
    }
}
commands.drop = function(n, message) {
    if(replays.length < 1) {
        sendMessage(message, "No replays to drop");
    } else if(n == 'all') {
            replays.splice(1, replays.length - 1);
            sendMessageLog(message, "Dropped all replays", "Dropped all replays");
            saveReplays();
    } else if (n) { // n not falsy, so has an index?
        var num = parseInt(n);
        if(isNaN(num)) {
            if(0 < num && num  < replays.length) {
                replays.splice(0, num);
                sendMessageLog(message, "Dropped " + num + " replays", "Dropped " + num + " replays");
            } else {
                replays = [];
                sendMessageLog(message, "Dropped all replays", "Dropped all replays");
            }
            saveReplays();
        }
    } else {
        //assume 1
        replays.splice(0, 1);
        sendMessageLog(message, "Dropped 1 replay", "Dropped 1 replay");
        saveReplays();
    }
}
commands.help = function(arg, message) {
     var msg =   `!replays - list all replays
!remove # - remove specified replay
!drop (#/all) - remove x replays from the front
!add (link) (notes) - manually add a non-replay file
Directly uploading a replay file to the channel will also add it.
Deleting your message will remove the associated replay`;
    // sendPrivateMessage(message, msg);
    sendMessage(message, msg);
}
commands.add = function(args, message) {
     if(args.length > 1) {
        var replay = {
            user: message.author.tag,
            url: args[1],
            notes: "",
            msgid: message.id
        }
        if(args.length > 2) {
            var desc = args[2];
            args.forEach( function (value, index) {
                if(index > 2) {
                    desc = desc.concat(" ").concat(value);
                }
            });
            replay.notes = desc;
        }
        replays.push(replay);
        sendMessage(message, "Added replay");
        // console.log(replay);
        saveReplays();
    }
}
commands.logs = function(message) {
    sendMessage(message, 'Logs:\n'+recentLogs.join('\n'));
}
commands.twitchsay = function(args, message) {
    let channelName = args[1];
    let text = args.slice(2).join(' ');
    try {
        Renko.sendMessage(channelName, text);
    } catch (err) {
        log(err);
    }
    log("twitchsay "+channelName+": "+text);
}

function formatReplay(index, replay) {
    return `\n-\n# ${index} ${replay.user} ${replay.url}\nMessage: ${replay.notes}`;
}


function isChannel(id) {
    return id == config.discord.channel;
}

function isMaster(id) {
    return id == config.discord.master;
}
function isVIP(id) {
    return config.discord.vip && (config.discord.vip.indexOf(id) != -1);
}

function loadFromJson(filename) {
    let fullFilename = filename+'.json';
    let result = [];
    try {
        let data = fs.readFileSync(fullFilename);
        result = JSON.parse(data)
    } catch (err) {
        log(err);
        // result = [];
    }
    return result;
}

function saveToJson(filename, data) {
    let fullFilename = filename+'.json'; 
    fs.writeFile(fullFilename, data,
        function(err) {
            if (err) {
                log(err);
            } else {
                // log(`Saved ${fullFilename} to disk`);
            }
    });
}

function saveCurrentSchedule() {
    saveToJson('schedule', JSON.stringify(schedule));
}

function saveReplays() {
    saveToJson('replays', JSON.stringify(replays));
    
}

function sendMessage(message, reply) {
    sendMessageToChannel(message.channel.id, reply);    
}

function sendMessageToChannel(channelId, msg) {
    client.channels.get(channelId).send(msg)
        .catch(log);
}

function sendPrivateMessage() {

}

function log(msg) {
    let formattedMsg = `[${getDateTime()}] ${msg}`;
    if (recentLogs.length >= MAX_RECENT_LOG_LENGTH) {
        recentLogs.shift();
    }
    recentLogs.push(formattedMsg);
    console.log(formattedMsg);
}

function sendMessageLog(message, reply, logNote) {
    client.channels.get(message.channel.id).send(reply)
        .then(log(message.author.tag + " " + logNote))
        .catch(log);
}

function getDateTime() {
    return (new Date()).toISOString();
}


