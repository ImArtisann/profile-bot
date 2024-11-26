import { SlashCommandBuilder } from 'discord.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder().setName('race').setDescription('Bet on some horses'),
	async execute(interaction) {
		await commandRouter.handle(interaction)
	},
}
