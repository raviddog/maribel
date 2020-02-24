const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const gameList = require('./games.json');
var fs = require('fs');

let Keine = require('./keine.js');
let moment = require('moment');

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
    initialize: function(isDebug) {
        if (isDebug) {
            return;
        }
        client.login(config.maribel.token);
    },
    setRenko: function(r) {
        Renko = r;
    },
    sendMessage: function(msg) {
        sendMessageToChannel(config.maribel.channel, msg);
    },
    devLog: function(s) {
        sendMessageToChannel(config.maribel.logChannel, s);
    },
    // move replays?
    getReplays: function() {
        return replays;
    },
    getSchedule: function() {
        return getScheduleTwitch();
    }
    // sendMessage: function(msg) {
    //     sendMessageToChannel(config.maribel.channel, msg);
    // }
}

var replays = [];
replays = loadFromJson('replays');
var schedule = [];

// hold recent logging info so we can query it from discord instead of server side
var MAX_RECENT_LOG_LENGTH = 20;
var recentLogs = [];

client.on('ready', () => {
    log(`Logged in as ${client.user.tag}`);
    client.user.setActivity(config.maribel.game, {type : 'PLAYING'});
});

// delete replay if submitter deletes their original message
client.on('messageDelete', message => {
    var index = replays.findIndex(replay => replay.msgid == message.id);
    if(index > -1) {
        replays.splice(index, 1);
        sendMessageLog(message, 'Removed replay from ' + message.author.tag, 'Removed replay from ' + message.author.tag);
        saveReplays();
    }
});

client.on('message', message => {
    // ignore bots messages
    if(message.author.id == client.user.id) return;

    // add attachments as replays
    if(isChannel(message.channel.id)) {
        if(message.attachments.size != 0) {
            var hasReplay = false;
            var replayCount = 0;
            message.attachments.forEach(attachment => {
                var extension = attachment.filename.split('.').pop();
                if(config.maribel.fileext.indexOf(extension) != -1) {
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
                // you can't have more than 1 attachment per replay, so it's just singular replay
                // instead of plural 
                sendMessage(message, "Added " + replayCount + " replay");
                saveReplays();
            }
        }
    }

    // commands
    if(message.content.substring(0,1) == '!') {
        var args = message.content.slice(1).split(' '); 
        if(args.length > 0) {
            let command = args[0];
            
            // master commands from anywhere
            if(isMaster(message.author.id)) {
                switch(command) {
                    case 'save':
                        saveReplays();
                        break;
                    case 'logs':
                        commands.logs(message);
                        break;
                    case 'twitchsay':
                        commands.twitchsay(args, message);
                        break;
                }
            }

            // check if command is in replay channel or by master
            if(isChannel(message.channel.id) || isMaster(message.author.id)) {
                let arg = args[1] || null;
                // master/VIP commands
                if (isMaster(message.author.id) || isVIP(message.member)) {
                    switch (command) {
                        // case 'twitch':
                        //     commands.twitch(arg, message);
                        //     break;
                        case 'settheatre':
                            commands.theatre(arg, message);
                            break;
                        case 'remove': 
                            commands.remove(arg, message);
                            break;
                        case 'setDate':
                            commands.setDate(args, message);
                            break;
                        case 'organize':
                            commands.organize(args, message);
                            break;
                        case 'swap':
                            commands.swap(args, message);
                            break;
                    }
                }

                // common commands
                switch (command) {
                    case 'replays':
                    case 'schedule':
                        commands.getNextSchedule(message);
                        break;
                    case 'help':
                        commands.help(arg, message);
                        break;
                    case 'add':
                        commands.add(args, message);
                        break;
                }  
            }
        }
    }
});


// command functions
var commands = {};

function getTodaySchedule() {
    //  get a formatted list of the upcoming replays

    var todayMinus2 = moment().add(-2, 'd').format('YYYY-MM-DD');
    var todayPlus5 = moment().add(5, 'd').format('YYYY-MM-DD');
    var nextSchedule = replays.filter(function(r) {
        return todayMinus2 < r.theater_date && todayPlus5 > r.theater_date;
    });
    var returnSchedule = [];
    returnSchedule.push({
        name: "TRT Host",
        game: "unknown",
        file: "none"
    });
    //  trim discord tags and convert games
    nextSchedule.forEach(function(current) {
        //  get end of url
        var filename = current.url.split('/').pop();
        var filecopy = filename;
        var curGame;
        //  check if url is a replay file
        if(config.maribel.fileext.indexOf(filecopy.split('.').pop()) > -1) {
            curGame = filename;
            //  find game
            gameList.touhou.forEach(function(current) {
                if(filename.findIndex(current) > -1) {
                    curGame = current;
                }
                break;
            });
        } else {
            //  not a file
            //  temp
            curGame = 'video';
        }

        //  trim discord tag from name
        var username = current.user.split('#').shift();
        
        returnSchedule.push({
            name: username,
            game: curGame,
            file: filename
        });
    });

    return returnSchedule;
}

commands.getNextSchedule = function(message) {
    var returnText = "Schedule:\n";
    var nextSchedule = getTodaySchedule();
    nextSchedule.forEach(function(current) {
        returnText = returnText + current.name + ': ' + current.game + ' (' + current.file + ')\n';
    });
    returnText = returnText + "The full schedule can be found at https://trt.mamizou.wtf/schedule";
    sendMessage(message, returnText);
}

function getScheduleTwitch() {
    var nextSchedule = getTodaySchedule();
    nextSchedule.forEach(function(current, index) {
        returnText = returnText + current.name + ': ' + current.game + ' | ';
    });
    returnText = returnText + "Full schedule: https://trt.mamizou.wtf/schedule";
    return returnText;
}

commands.replays = function(message) {
    sendMessage(message, 'https://trt.mamizou.wtf/schedule');
}

commands.remove = function(n, message) {
    let num = parseInt(n);
    if(!isNaN(num)) {
        if(num < replays.length && num >= 0) {
            replays.splice(num, 1);
            sendMessageLog(message, "Removed replay #" + num, "Removed replay #" + num);
            saveReplays();
        } else {
            sendMessage(message, "Invalid replay number");
        }
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
        // commands.organize(args, message);
        // console.log(replay);
        saveReplays();
    }
}
commands.logs = function(message) {
    sendMessage(message, 'Logs:\n'+recentLogs.join('\n'));
}

commands.theatre = function(arg, message) {
    try {
        Renko.setTheatre(arg);
        sendMessage(message, `Set theatre channel to ${arg}`);
        log(`theatre channel set to ${arg}`);
    } catch (err) {
        log(err);
        sendMessage(message, `Error setting theatre channel. Check logs.`);
    }
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

commands.swap = function(args,message) {
    try {
        Keine.swapReplay(replays[args[1]], replays[args[2]]);
        saveReplays();
        sendMessage(message, `Swapped replay #${args[1]} with #${args[2]}.`);
    } catch (err) {
        log(err.toString());
        sendMessage(message, `Error swapping`);
    }
}

commands.setDate = function(args,message) {
    let r = replays[args[1]];
    // TODO: error check me

    r.theater_date = args[2];
    r.theater_order = args[3];

    saveReplays();

    log("setDate "+JSON.stringify(r));
    sendMessage(message, `setDate completed.`);
}

commands.organize = function(args, message) {
    Keine.organizeReplays(replays);
    saveReplays();
    sendMessage(message, 'Organized replays.');
}

function formatReplay(index, replay) {
    return `\n-\n# ${index} ${replay.theater_date} ${replay.user} ${replay.url}\nMessage: ${replay.notes}`;
}


function isChannel(id) {
    return id == config.maribel.replaychannel;
}

function isMaster(id) {
    return config.maribel.master.indexOf(id) != -1;
}

function isVIP(member) {
    return member.roles.some(role => role.id == config.maribel.VIP);
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
    let backupFile = filename+Date.now()+'.json';
    fs.writeFile(fullFilename, data,
        function(err) {
            if (err) {
                log(err);
            } else {
                // log(`Saved ${fullFilename} to disk`);
            }
    });
    fs.writeFile(backupFile, data,
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


