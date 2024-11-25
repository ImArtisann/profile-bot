import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('shop')
		.setDescription('Buy items from the shop'),
	execute: errorHandler('Command Shop')(async (interaction) => {
		await commandRouter.handle(interaction)
	}),
}
