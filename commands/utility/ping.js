import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

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
		await commandRouter.handle(interaction)
	},
}
