import { ChannelType, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { guildActions } from '../../actions/guildActions.js'
import { roomsActions } from '../../actions/roomsActions.js'
import { errorHandler } from '../../handlers/errorHandler.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('room')
		.setDescription('used to rent a private VC')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('rent')
				.setDescription('Rent a private VC with penta coins')
				.addIntegerOption((option) =>
					option
						.setName('time')
						.setDescription('How long you want to rent the VC for in days')
						.setRequired(true),
				)
				.addStringOption((option) =>
					option.setName('name').setDescription('The name of the VC').setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('deposit')
				.setDescription('Add more funds to the room')
				.addIntegerOption((option) =>
					option
						.setName('amount')
						.setDescription('How many coins you want to deposit')
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('invite')
				.setDescription('Invite someone to the room')
				.addUserOption((option) =>
					option
						.setName('user')
						.setDescription('What user would you like to invite')
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('kick')
				.setDescription('Kick someone to the room')
				.addUserOption((option) =>
					option
						.setName('user')
						.setDescription('What user would you like to kick')
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('status').setDescription('Display the status of the room'),
		),
	async execute(interaction) {
		await commandRouter.handle(interaction)
	},
}
