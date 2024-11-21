import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await import(pathToFileURL(filePath));
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

let rest;
let data;

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        const isTestEnvironment = process.env.NODE_ENV === 'development';
        if(isTestEnvironment) {
            rest = new REST().setToken(process.env.TEST_BOT_TOKEN);
            data = await rest.put(
                Routes.applicationGuildCommands(process.env.TEST_CLIENT_ID, process.env.TEST_GUILD_ID),
                {body: commands},
            );
        }else {
            rest = new REST().setToken(process.env.BOT_TOKEN);
            data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                {body: commands},
            );
        }

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
