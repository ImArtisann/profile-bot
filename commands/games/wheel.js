import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder().setName('wheel').setDescription('spin the wheel'),
	async execute(interaction) {
		await commandRouter.handle(interaction)
	},
}
