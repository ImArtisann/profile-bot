import { SlashCommandBuilder } from 'discord.js'

/**
 * Ping command module
 * @module commands/utility/ping
 */
export default {
	/**
	 * Command data for Discord slash command
	 * @type {SlashCommandBuilder}
	 */
	data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),

	/**
	 * Execute the ping command
	 * @param {import(discord.js).CommandInteraction} interaction - The command interaction
	 */
	async execute(interaction) {
		try {
			await interaction.reply(`Pong! (${interaction.client.ws.ping}ms)`, {
				ephemeral: true,
			})
		} catch (e) {
			console.log(`Error occurred in ping command: ${e}`)
		}
	},
}
