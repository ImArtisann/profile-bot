import {Client, Collection, Events, GatewayIntentBits, REST} from 'discord.js';
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
import {databaseActions} from "./database/mongodb.js";
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildPresences
        ]
    });

    await databaseActions.connect();

    client.commands = new Collection();

    /**
     * Dynamically loads and registers all command modules from the 'commands' directory.
     *
     * This code iterates through the 'commands' directory, imports each command module, and
     * registers it with the client's `commands` collection. The command module must have
     * `data` and `execute` properties in order to be registered.
     */
    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = await import(pathToFileURL(filePath));
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            } else {
                console.log(`[WARNING] The command at $index.js is missing a required "data" or "execute" property.`);
            }
        }
    }

    /**
     * Dynamically loads and registers all event handlers from the 'events' directory.
     *
     * This code iterates through the 'events' directory, imports each event handler module, and
     * registers it with the client. If the event handler has a `once` property set to `true`, it
     * is registered using `client.once()`, otherwise it is registered using `client.on()`.
     */
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = await import(pathToFileURL(filePath));
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }

    client.login(process.env.BOT_TOKEN).then(r => {
        console.log('Bot is running!');
    });
}

await main();
