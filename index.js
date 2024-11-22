import { Client, Collection, Events, GatewayIntentBits, REST } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

import 'dotenv/config';
import Redis from 'ioredis';
import { guildActions } from './actions/guild.js';
import EventHandler from './classes/eventHandler.js';
import CommandHandler from './classes/commandHandler.js';
import { userActions } from './actions/user.js';
import { roomsActions } from './actions/rooms.js';

async function main() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildVoiceStates,
        ],
    });

    const connection = new Redis(process.env.REDIS_URL);

    await guildActions.initialize(connection);
    await userActions.initialize(connection);
    await roomsActions.initialize(connection);

    const commandHandler = new CommandHandler(client);
    await commandHandler.loadCommands();
    commandHandler.setupInteractionHandler();

    const eventHandler = new EventHandler(client);
    await eventHandler.loadEvents();

    client
        .login(process.env.NODE_ENV === 'development' ? process.env.TEST_BOT_TOKEN : process.env.BOT_TOKEN)
        .then(r => {
            console.log('Bot is running!');
        });
}

await main();
