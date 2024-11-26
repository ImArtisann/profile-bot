import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('hol')
		.setDescription('Play a game of higher or lower'),
	async execute(interaction) {
		await commandRouter.handle(interaction)
	},
}