import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js'
import path from 'node:path'
import { dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { userActions } from '../../actions/userActions.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('Replies with profile!')
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('The user whose profile you want to see')
				.setRequired(false),
		),
	async execute(interaction) {
		await commandRouter.handle(interaction)
	},
}
