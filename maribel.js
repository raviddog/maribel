const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
var fs = require('fs');

let moment = require('moment');

// replay data structure

const placeholder = { 
    date : 2020-01-01,
    host : "raviddog#7629",
    title : "[PLACEHOLDER]",
    desc : "",
    vod : "",
    active : true,
    replays : [
        {
            url : "sample",
            user : "sample",
            notes : "placeholder value",
            msgid : "sample",
            game : "",      //  game data to be shown in discord
            shortgame : ""  //  game data to be shown in twitch schedule command
        }
    ]
}


// singleton
var Renko = null;

module.exports = {
    initialize: function() {
        client.login(config.maribel.token);
        theaters = loadFromJson('theaters');
        gameList = loadFromJson('games');
        try {
            a = fs.statSync("./currentSchedule.json");
            currentSchedule = loadFromJson('currentSchedule');
          }
          catch (e) {
            currentSchedule = -1;
          }
        generateActiveTheaterCache();
    },

    setRenko: function(r) {
        Renko = r;
    },

    getSchedule: function() {
        //  return twitch formatted schedule
        return commands.scheduleTwitch();
    },

    getWebSchedule: function() {

    },

    getWebArchive: function() {

    }
}

var theaters = [];
var activeTheaters = [];
var currentSchedule = -1;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);    
    client.user.setActivity(config.maribel.game, {type : 'PLAYING'});
});

// delete replay if submitter deletes their original message
// client.on('messageDelete', message => {
//     var index = replays.findIndex(replay => replay.msgid == message.id);
//     if(index > -1) {
//         replays.splice(index, 1);
//         sendMessageLog(message, 'Removed replay from ' + message.author.tag, 'Removed replay from ' + message.author.tag);
//         saveReplays();
//     }
// });

client.on('message', message => {
    // ignore bots messages
    if(message.author.id == client.user.id) return;

    // add attachments as replays
    if(isChannel(message.channel.id)) {
        if(message.attachments.size != 0) {
            message.attachments.forEach(attachment => {
                var extension = attachment.filename.split('.').pop();
                if(config.maribel.fileext.indexOf(extension) != -1) {
                    //replay file
                    commands.submitReplay(attachment.url, attachment.filename, message.content, message);
                }
            });
        }
    }

    // commands
    if(message.content.substring(0,1) == '!') {
        var args = message.content.slice(1).split(' '); 
        if(args.length > 0) {
            let command = args[0];

            // check if command is in replay channel or by master
            if(isChannel(message.channel.id) || isMaster(message.author.id)) {
                let arg = args[1] || null;
                // master/VIP commands
                
                if (isMaster(message.author.id) || isVIP(message.author.id)) {
                    switch (command) {
                        case 'create':
                            commands.createTheater(args, message);
                            break;
                        case 'setdesc':
                            commands.setTheaterDesc(args, message);
                            break;
                        case 'show':
                            commands.showTheater(arg, message);
                            break;
                        case 'unshow':
                            commands.unshowTheater(arg, message);
                            break;
                        case 'archive':
                            commands.archiveTheater(arg, message);
                            break;
                        case `deleteTheater`:
                            commands.removeTheater(arg, message);
                            break;
                    }
                }

                // common commands
                switch (command) {
                    case 'theaters':
                        commands.theaters(message);
                        break;
                    case 'details':
                        commands.viewTheater(arg, message);
                        break;
                    case 'schedule':
                        commands.schedule(message);
                        break;
                    case 'add':
                        commands.add(args, message);
                        break;
                    case 'help':
                        commands.help(message);
                        break;
                    case 'remove':
                        commands.remove(args, message);
                        break;
                }  
            }
        }
    }
});







// command functions
var commands = {};

commands.createTheater = function(args, message) {
    //  !createTheater date title
    if(args.length > 2) {
        var theater = {
            date : moment(args[1]),
            host : message.author.tag,
            title : "",
            desc : "No description",
            vod : "",
            active : true,
            replays : []
        };

        //  add title
        if(args.length > 3) {
            var desc = args[2];
            args.forEach( function (value, index) {
                if(index > 2) {
                    desc = desc.concat(" ").concat(value);
                }
            });
            theater.title = desc;
        } else {
            theater.title = args[2];
        }

        var showDate = moment(theater.date, "YYYY-MM-DD").format("MMMM Do YYYY");
        sendMessage(message, "Created Theater #" + theaters.length + ": \"" + theater.title + "\" by " + theater.host + ", scheduled for " + showDate);
        theaters.push(theater);
        generateActiveTheaterCache();

    } else {
        //  not enough args
        sendMessage(message, "Not enough arguments provided.");
    }
}

commands.theaters = function(message) {
    //  !theaters
    var data = "List of active theaters:";
    activeTheaters.forEach( function(value) {
        data += "\n\n#" + value + ": \"**" + theaters[value].title + "**\" scheduled for " + moment(theaters[value].date).format("MMMM Do") + " (" + theaters[value].replays.length + " replays)\n       " + theaters[value].desc;
    });

    data += "\n\nFor information on inactive theaters, please check the site";
    sendMessage(message, data);
}

commands.viewTheater = function(arg, message) {
    //  !viewTheater id
    if(arg < theaters.length) {
        //  valid id
        var run = theaters[arg];
        var data = "#" + arg + ": \"**" + run.title + "**\" ( " + moment(run.date).format("MMMM Do") + ")\n*" + run.desc + "*\n\n";
        run.replays.forEach( function (value, index) {
            data += "#" + index + ": " + value.user + " - " + value.game + "\n";
        });
        sendMessage(message, data);
    }
}

commands.schedule = function(message) {
    //  view discord formatted schedule
    //  picks between theaters or viewtheater command based on if anything is scheduled
    if(currentSchedule != -1) {
        commands.viewTheater(currentSchedule, message);
    } else {
        //  show list of current active theaters
        commands.theaters(message);
    }
}

commands.scheduleTwitch = function() {
    //  twitch version of schedule
    //  gonna copy paste of the shit out of this code
    if(currentSchedule != -1) {
        //  theater scheduled
        var text = "Schedule: ";
        var run = theaters[currentSchedule];
        run.replays.forEach(function(current) {
            text += current.shortgame;
            text += " | ";
        });
        text = text.slice(0, text.length - 3);
        text += " Full schedule: https://raviddog.site/schedule";
        return text;
    } else {
        //  no theater scheduled
        return "No theater currently in progress, check the discord for more information";
    }
}

commands.removeTheater = function(arg, message) {
    //  deletes a theater
    //  be super careful using this
    //  maybe ill make a backup everytime you use it
    if(arg < theaters.length) {
        saveBackup();
        var run = theaters.splice(arg, 1);
        sendMessage(message, "Removed \"" + run.title + "\"");
        generateActiveTheaterCache();
    } else {
        sendMessage(message, "Invalid theater ID");
    }
}

commands.setTheaterDesc = function(args, message) {
    //  !setTheaterDesc id desc
    if(args.length > 2) {
        if(args[1] < theaters.length) {
            var desc = args[2];
            args.forEach( function (value, index) {
                if(index > 2) {
                    desc = desc.concat(" ").concat(value);
                }
            });
    
            theaters[args[1]].desc = desc;
            sendMessage(message, "Updated Theater \"" + theaters[args[1]].title + "\" description");
    
            save();
        } else {
            //  invalid theater id
            sendMessage(message, "Invalid theater ID.");
        }
    } else {
        //  not enough args
        sendMessage(message, "Not enough arguments provided.");
    }
}

commands.submitReplay = function(link, filename, desc, message) {
    //  should go through this function even if the replay is attached to message
    //  !submitReplay link desc

    var replay = {
        url     : link,
        user    : message.author.tag,
        notes   : desc,
        msgid   : message.id,
        game    : "",
        shortgame: ""
    }

    //  temp
    replay.game = filename;
    replay.shortgame = filename;

    //  TODO
    //  optionally attempt to decode replay here
    //  decode and dump game title/run info/whatever here too

    if(activeTheaters.length > 1) {
        //  TODO gotta query for which theater to add to
    } else if(activeTheaters.length == 1) {
        theaters[activeTheaters[0]].replays.push(replay);
        save();
        sendMessage(message, "Added replay to \"" + theaters[activeTheaters[0]].title + "\"");
    } else {
        //  no active theaters
        sendMessage(message, "There are no theaters active to submit to");
    }
}

commands.showTheater = function(arg, message) {
    //  !showTheater id
    //  for now, can only show 1 theater at a time (makes sense, probs wont change but eh)    
    if(currentSchedule == -1) {
        var checkactive = activeTheaters.find( function(value) {
            return value == arg;
        });
        if(arg == checkactive) {
            theaters[arg].active = false;
            currentSchedule = arg;
            generateActiveTheaterCache();
            sendMessage(message, "Submissions closed. Theater \"" + theaters[arg].title + "\" is now scheduled.");
        } else {
            //  theater id is invalid or not active
            sendMessage(message, "Theater ID is invalid or belongs to an inactive theater");
        }
    } else {
        //  a theater already being shown
        sendMessage(message, "A theater is in progress. Archive it before showing another");
    }
}

commands.unshowTheater = function(arg, message) {
    //  !unshowTheater id
    //  basically just undos show theater
    if(arg < theaters.length) {
        if(theaters[arg].active) {
            //  cant unshow something thats been shown
            sendMessage(message, "Theater has not been shown yet.");
        } else {
            currentSchedule = -1;
            theaters[arg].active = true;
            sendMessage(message, "Restored theater. Submissions are reopened.");
            generateActiveTheaterCache();
        }
    } else {
        //  invalid id
        sendMessage(message, "Invalid theater ID");
    }
}

commands.archiveTheater = function(arg, message) {
    //  !archiveTheater url
    //  assumes currently shown theater
    if(currentSchedule != -1) {
        theaters[currentSchedule].vod = arg;
        sendMessage(message, "Theater \"" + theaters[currentSchedule].title + "\" archived.");
        currentSchedule = -1;
        generateActiveTheaterCache();
    } else {
        //  no theater being shown so nothing to archive
        sendMessage(message, "No theater being shown, nothing to archive");
    }
}

commands.add = function(args, message) {
    //  !add link desc
     if(args.length > 2) {
        var desc = "";
        if(args.length > 3) {
            desc = args[2];
            args.forEach( function (value, index) {
                if(index > 2) {
                    desc = desc.concat(" ").concat(value);
                }
            });
        }
        
        var templink = args[1];
        var filename = templink.split("/").pop();
        commands.submitReplay(args[1], filename, desc, message);
    } else {
        //  put a link
        sendMessage(message, "No replay link provided");
    }
}

commands.remove = function(args, message) {
    //  !remove 15 7
    if(args.length > 2) {
        if(args[1] < theaters.length) {
            var t = theaters[args[1]];
            if(t.active) {
                if(args[2] < t.replays.length) {
                    var r = t.replays[args[2]];
                    var msg = message.channel.messages.fetch(r.msgid).catch(console.log);
                    if(message.author.id === msg.author.id || isVIP(message.author.id)) {
                        //  passed all the checks lol
                        saveBackup();
                        var removed = t.replays.splice(args[2], 1);
                        sendMessage(message, "Removed \"" + removed.game + "\"");
                    } else {
                        sendMessage(message, "You cannot remove someone else's replay");
                    }
                } else {
                    sendMessage(message, "Invalid replay ID provided");
                }
            } else {
                sendMessage(message, "You cannot remove replays from a theater that has been shown");
            }
        } else {
            sendMessage(message, "Invalid theater ID provided");
        }
    } else {
        sendMessage(message, "Not enough arguments provided");
    }
}

commands.help = function(message) {
    var msg =   "Host Commands:\n\n" +
                " - !create date title *(create a theater)*\n" + 
                " - !setdesc id description *(set a theater description)*\n" + 
                " - !show id *(close submissions and schedule theater for showing)*\n" + 
                " - !unshow id *(undo show)*\n" + 
                " - !archive url *(set the VOD link and archive a theater)*\n" +
                " - !deleteTheater id *(deletes a theater)*\n" +
                "\nCommands:\n\n" +
                " - !theaters *(list theaters with open submissions)*\n" +
                " - !details id *(get details about a theater)*\n" +
                " - !schedule *(view open theaters, or check submissions for a theater being shown)*\n" +
                " - !add link description *(submit)*\n" +
                " - !remove theatreID replayID *(remove a replay you submitted)";
    sendMessage(message, msg);
}

function generateActiveTheaterCache() {
    save();
    activeTheaters = [];
    theaters.forEach( function (value, index) {
        if(value.active) {
            activeTheaters.push(index);
        }
    });
}

function isChannel(id) {
    return id == config.maribel.replaychannel;
}

function isMaster(id) {
    return config.maribel.master.indexOf(id) != -1;
}

function isVIP(id) {
    return config.maribel.VIP.indexOf(id) != -1;
}

function save() {
    saveToJson("theaters", theaters);
    saveToJson("currentSchedule", currentSchedule);
}

function saveBackup() {
    saveToJson("theaters" + Date.now().toString(), theaters);
}

function loadFromJson(filename) {
    let fullFilename = filename+'.json';
    let result = [];
    try {
        let data = fs.readFileSync(fullFilename);
        result = JSON.parse(data)
    } catch (err) {
        console.log(err);
        // result = [];
    }
    return result;
}

function saveToJson(filename, data) {
    let fullFilename = filename + '.json';
    let backupFile = filename + Date.now() + '.json';
    fs.writeFile(fullFilename, JSON.stringify(data),
        function(err) {
            if (err) {
                log(err);
            } else {
                // log(`Saved ${fullFilename} to disk`);
            }
    });
}

function sendMessage(message, reply) {
    sendMessageToChannel(message.channel.id, reply);    
}

function sendMessageToChannel(channelId, msg) {
    client.channels.get(channelId).send(msg)
        .catch(console.log);
}