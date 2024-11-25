import { SlashCommandBuilder } from 'discord.js'
import { timerManager } from '../../classes/timerManager.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

const timers = new Map()

export default {
	data: new SlashCommandBuilder()
		.setName('remind')
		.setDescription('Set a reminder')
		.addStringOption((option) =>
			option
				.setName('reminder')
				.setDescription('The reminder you want to set')
				.setRequired(true),
		)
		.addIntegerOption((option) =>
			option
				.setName('time')
				.setDescription('How long you want the reminder to be in minutes')
				.setRequired(true),
		),
	execute: errorHandler('Command Remind')(async(interaction) => {
		await commandRouter.handle(interaction)
	}),
}
