import {SlashCommandBuilder} from 'discord.js';
import {databaseActions} from "../../database/mongodb.js";

export const data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Set your player stats!')
    .addNumberOption(option =>
        option.setName('hp')
            .setDescription('Enter your HP value')
            .setRequired(false)
    )
    .addNumberOption(option =>
        option.setName('mana')
            .setDescription('Enter your mana value')
            .setRequired(false)
    )
    .addNumberOption(option =>
        option.setName('mood')
            .setDescription('Enter your Mood value')
            .setRequired(false)
    )
    .addNumberOption(option =>
        option.setName('focus')
            .setDescription('Enter your Focus value')
            .setRequired(false)
    )
    .addNumberOption(option =>
        option.setName('level')
            .setDescription('Enter your Level value')
            .setRequired(false)

    )
    .addStringOption(option =>
        option.setName('class')
            .setDescription('Enter your class')
            .setRequired(false)
            .setAutocomplete(true)
    )
    .addStringOption(option => 
        option.setName('timezone')
            .setDescription('Enter your timeZone')
            .addChoices(
                { name: "US Pacific (Los Angeles)", value: "America/Los_Angeles" },
                { name: "US Mountain (Denver)", value: "America/Denver" },
                { name: "US Central (Chicago)", value: "America/Chicago" },
                { name: "US Eastern (New York)", value: "America/New_York" },
                { name: "US Alaska (Anchorage)", value: "America/Anchorage" },
                { name: "US Hawaii (Honolulu)", value: "Pacific/Honolulu" },
                { name: "Canada Atlantic (Halifax)", value: "America/Halifax" },
                { name: "Mexico (Mexico City)", value: "America/Mexico_City" },
                { name: "Brazil (São Paulo)", value: "America/Sao_Paulo" },
                { name: "UK (London)", value: "Europe/London" },
                { name: "Central Europe (Paris)", value: "Europe/Paris" },
                { name: "Eastern Europe (Helsinki)", value: "Europe/Helsinki" },
                { name: "Russia (Moscow)", value: "Europe/Moscow" },
                { name: "UAE (Dubai)", value: "Asia/Dubai" },
                { name: "India (Mumbai)", value: "Asia/Kolkata" },
                { name: "China (Beijing)", value: "Asia/Shanghai" },
                { name: "Japan (Tokyo)", value: "Asia/Tokyo" },
                { name: "Singapore", value: "Asia/Singapore" },
                { name: "Australia (Sydney)", value: "Australia/Sydney" },
                { name: "New Zealand (Auckland)", value: "Pacific/Auckland" }
            )
            .setRequired(false)
    );
/**
 * Handles the autocomplete functionality for the 'class' option in the '/stats' command.
 *
 * When the user starts typing in the 'class' option, this function will be called to provide a list of
 * available class options that match the user's input.
 *
 * @param {import('discord.js').AutocompleteInteraction} interaction - The autocomplete interaction object.
 * @returns {Promise<void>} - A Promise that resolves when the autocomplete options have been sent.
 */
export async function autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const choices = [
        { name: 'Warrior', value: 'Warrior' },
        { name: 'Mage', value: 'Mage' },
        { name: 'Rogue', value: 'Rogue' },
        { name: 'Priest', value: 'Priest' },
        { name: 'Paladin', value: 'Paladin' },
        { name: 'Druid', value: 'Druid' },
        { name: 'Hunter', value: 'Hunter' },
        { name: 'Shaman', value: 'Shaman' },
        { name: 'Warlock', value: 'Warlock' },
        { name: 'Monk', value: 'Monk' }
    ];    const filtered = choices.filter(choice => choice.name.startsWith(focusedValue));
    await interaction.respond(
        filtered.map(choice => ({ name: choice.name, value: choice.value })),
    );
}

export async function execute(interaction) {
    let user = interaction.user.id;
    let choices = interaction.options.data;
    let data = {};
    for (const choice of choices){
        if(!checkValid(choice.name, choice.value)){
            await interaction.reply({content: 'Invalid input!', ephemeral: true});
            return;
        }
        data[choice.name] = choice.value;
        let options = {
            timeZone: data["timezone"] || "America/New_York",
        }
        data["timestamp"] = new Date().toLocaleString('en-US', options)
    }
    await databaseActions.updateUser(user, data);
    await interaction.reply({content: 'Stats Updated!', ephemeral: true});
}

/**
 * Checks the validity of the input values for various user stats.
 *
 * @param {string} name - The name of the user stat.
 * @param {string|number} value - The value of the user stat.
 * @returns {boolean} - True if the input value is valid, false otherwise.
 */
function checkValid(name, value){
    if (name === 'level'){
        return value <= 100;
    }else if(['hp','focus','mood','mana'].includes(name)){
        if(isNaN(Number(value))){
            return false;
        }else{
            return value <= 10;
        }
    }else{
        return typeof value === 'string';
    }
}
