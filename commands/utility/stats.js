import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Set your player stats!')
		.addNumberOption((option) =>
			option.setName('hp').setDescription('Enter your HP value').setRequired(false),
		)
		.addNumberOption((option) =>
			option.setName('mana').setDescription('Enter your mana value').setRequired(false),
		)
		.addNumberOption((option) =>
			option.setName('mood').setDescription('Enter your Mood value').setRequired(false),
		)
		.addNumberOption((option) =>
			option.setName('focus').setDescription('Enter your Focus value').setRequired(false),
		)
		.addNumberOption((option) =>
			option.setName('level').setDescription('Enter your Level value').setRequired(false),
		)
		.addStringOption((option) =>
			option
				.setName('class')
				.setDescription('Enter your class')
				.setRequired(false)
				.setAutocomplete(true),
		)
		.addStringOption((option) =>
			option
				.setName('timezone')
				.setDescription('Enter your timeZone')
				.addChoices(
					{ name: 'US Pacific (Los Angeles)', value: 'America/Los_Angeles' },
					{ name: 'US Mountain (Denver)', value: 'America/Denver' },
					{ name: 'US Central (Chicago)', value: 'America/Chicago' },
					{ name: 'US Eastern (New York)', value: 'America/New_York' },
					{ name: 'US Alaska (Anchorage)', value: 'America/Anchorage' },
					{ name: 'US Hawaii (Honolulu)', value: 'Pacific/Honolulu' },
					{ name: 'Canada Atlantic (Halifax)', value: 'America/Halifax' },
					{ name: 'Mexico (Mexico City)', value: 'America/Mexico_City' },
					{ name: 'Brazil (São Paulo)', value: 'America/Sao_Paulo' },
					{ name: 'UK (London)', value: 'Europe/London' },
					{ name: 'Central Europe (Paris)', value: 'Europe/Paris' },
					{ name: 'Eastern Europe (Helsinki)', value: 'Europe/Helsinki' },
					{ name: 'Russia (Moscow)', value: 'Europe/Moscow' },
					{ name: 'UAE (Dubai)', value: 'Asia/Dubai' },
					{ name: 'India (Mumbai)', value: 'Asia/Kolkata' },
					{ name: 'China (Beijing)', value: 'Asia/Shanghai' },
					{ name: 'Japan (Tokyo)', value: 'Asia/Tokyo' },
					{ name: 'Singapore', value: 'Asia/Singapore' },
					{ name: 'Australia (Sydney)', value: 'Australia/Sydney' },
					{ name: 'New Zealand (Auckland)', value: 'Pacific/Auckland' },
				)
				.setRequired(false),
		),
	choices: [
		{ name: 'Warrior', value: 'Warrior' },
		{ name: 'Mage', value: 'Mage' },
		{ name: 'Rogue', value: 'Rogue' },
		{ name: 'Priest', value: 'Priest' },
		{ name: 'Paladin', value: 'Paladin' },
		{ name: 'Druid', value: 'Druid' },
		{ name: 'Hunter', value: 'Hunter' },
		{ name: 'Shaman', value: 'Shaman' },
		{ name: 'Warlock', value: 'Warlock' },
		{ name: 'Monk', value: 'Monk' },
	],
	execute: errorHandler('Command Stats')(async (interaction) => {
		await commandRouter.handle(interaction)
	}),
}

/**
 * Checks the validity of the input values for various user stats.
 *
 * @param {string} name - The name of the user stat.
 * @param {string|number} value - The value of the user stat.
 * @returns {boolean} - True if the input value is valid, false otherwise.
 */
function checkValid(name, value) {
	if (name === 'level') {
		return value <= 100
	} else if (['hp', 'focus', 'mood', 'mana'].includes(name)) {
		if (isNaN(Number(value))) {
			return false
		} else {
			return value <= 10
		}
	} else {
		return typeof value === 'string'
	}
}
