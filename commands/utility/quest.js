import { SlashCommandBuilder } from 'discord.js'
import { userActions } from '../../actions/userActions.js'
import { embedHelper } from '../../classes/embedHelper.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('quest')
		.setDescription('Set your quest or look at another users quest')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('set')
				.setDescription('Set your quest')
				.addStringOption((option) =>
					option
						.setName('quest')
						.setDescription('The quest name you want to set')
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName('description')
						.setDescription('The description of the quest')
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName('deadline')
						.setDescription('The deadline for the quest')
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName('reward')
						.setDescription('The reward for completing the quest')
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('view')
				.setDescription('View your quest or someones quest')
				.addUserOption((option) =>
					option
						.setName('user')
						.setDescription('The user whose quest you want to view')
						.setRequired(false),
				),
		),
	execute: errorHandler('Command Quest')( async (interaction) => {
		await commandRouter.handle(interaction)
	}),
}
