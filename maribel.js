const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
var fs = require('fs');

const placeholder = {
    "user" : "sample",
    "url" : "sample",
    "notes" : "placeholder value",
    "msgid" : "sample"
}
var replays = [];

client.on('ready', () => {
    console.log(getDateTime());
    console.log('Logged in as ' + client.user.tag);
    client.user.setActivity(config.game, {type : 'PLAYING'},);
    fs.readFile('replays.json', (err, data) => {
        if(err) throw err;
        replays = JSON.parse(data);
        console.log('Loaded ' + replays.length + ' saved replays');
        replays.unshift(placeholder);
    })
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
    if(message.author.id == client.user.id) return;
    if(message.author.id == config.master) {
        if(message.content == '!save') {
            saveReplays();
        }
    }
    if(message.channel.id == config.channel || message.author.id == config.master) {
        if(message.attachments.size != 0) {
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
                    console.log(replay);
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
                if(args[0] == 'replays') {
                    sendMessage(message, 'There are currently ' + (replays.length - 1) + ' replays');
                    var msg = "";
                    replays.forEach( function (value, index) {
                        if(value.msgid != "sample") {
                            var s = '\n-\n#' + index + ' ' + value.user + ' <' + value.url + '>\nMessage: ' + value.notes;
                            var newmsg = msg + s;
                            if(newmsg.length >= 2000) {
                                sendMessage(message, msg);
                                msg = s;
                            } else {
                                msg = newmsg;
                            }
                        }
                    });
                    sendMessageLog(message, msg, "Sent replays");
                } else if(args[0] == 'remove') {
                    if(args.length > 1) {
                        var num = parseInt(args[1]);
                        if(num != NaN) {
                            if(num < replays.length && num > 0) {
                                replays.splice(num, 1);
                                sendMessageLog(message, "Removed replay #" + num, "Removed replay #" + num);
                                saveReplays();
                            } else {
                                sendMessage(message, "Invalid replay number");
                            }
                        }
                    }
                } else if(args[0] == 'drop') {
                    if(replays.length <= 1) {
                        sendMessage(message, "No replays to drop");
                    } else if(args.length > 1) {
                        if(args[1] == 'all') {
                            replays.splice(1, replays.length - 1);
                            sendMessageLog(message, "Dropped all replays", "Dropped all replays");
                            saveReplays();
                        } else {
                            var num = parseInt(args[1]);
                            if(num != NaN) {
                                if(num < (replays.length - 1)) {
                                    replays.splice(1, num);
                                    sendMessageLog(message, "Dropped " + num + " replays", "Dropped " + num + " replays");
                                } else {
                                    replays.splice(1, replays.length - 1);
                                    sendMessageLog(message, "Dropped all replays", "Dropped all replays");
                                }
                                saveReplays();
                            }
                        }
                    } else {
                        //assume 1
                        replays.splice(1, 1);
                        sendMessageLog(message, "Dropped 1 replay", "Dropped 1 replay");
                        saveReplays();
                    }
                } else if(args[0] == 'help') {
                    var msg =   "!replays - list all replays\n" +
                                "!remove # - remove specified replay\n" +
                                "!drop (#/all) - remove x replays from the front\n" +
                                "!add (link) (notes) - manually add a non-replay file\n" +
                                "Directly uploading a replay file will also add it\n" +
                                "Deleting your message will remove the associated replay";
                    sendMessage(message, msg);
                } else if(args[0] == 'add') {
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
                        console.log(replay);
                        saveReplays();
                    }
                }
            }
        }
        
    }
});

function saveReplays() {
    replays.shift();
    var data = JSON.stringify(replays, null, 2);
    fs.writeFile('replays.json', data,
        function(err) {
            if(err) {
                console.log(err);
            }
        });
    replays.unshift(placeholder);
    console.log('Saved replays to disk');
}

function sendMessage(message, reply) {
    client.channels.get(message.channel.id).send(reply)
        .catch(console.error);
}

function sendMessageLog(message, reply, log) {
    client.channels.get(message.channel.id).send(reply)
        .then(console.log(message.author.tag + " " + log))
        .catch(console.error);
}

function getDateTime() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return year + ":" + month + ":" + day + " " + hour + ":" + min + ":" + sec;
}

client.login(config.token);
