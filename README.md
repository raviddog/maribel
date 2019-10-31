# Readme

A discord bot to help manage Touhou Replay Theatre. I'm not sure why I'm making this public. It's called Maribel because she's really cute and also because of some other inside joke that probably shouldn't be written here.

## How to use

- Upload `.rpy` or `.dat` files to Discord as a message attachment, the bot will pick up the links.
- Deleting a message will automatically remove an associated replay
- `!replays` - list all saved replays
- `!remove #` - remove specified replay
- `!drop (# | all)` - remove a number of replays from the top of the queue
- `!add (link) (notes)` - manually add a non-replay link

## Setup

You'll need a Discord bot account. There's a good article on how to make one [here](https://discordpy.readthedocs.io/en/latest/discord.html).
You'll also need [node.js](https://nodejs.org/).

- Clone or download the repo into a folder
- Create a `config.json` file in the following format:

```json
{
    "token" : "your bot token",
    "game" : "your game or message here",
    "channel" : "channel id you want to run the bot in",
    "master" : "a user id that accepts commands regardless of channel"
}
```

- Install discord.js with `node install discord.js`
- Run the bot with `node maribel`
