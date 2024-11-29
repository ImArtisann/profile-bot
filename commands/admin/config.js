import { SlashCommandBuilder, ChannelType } from 'discord.js'
import { commandRouter } from '../../routers/commandRouter.js'

export default {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Configuration for how the bot interacts with the server')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('setup')
				.setDescription('Setup the bot for the server')
				.addChannelOption((option) =>
					option
						.setName('logs')
						.setDescription('The channel you want the logs to be sent to')
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true),
				)
				.addChannelOption((option) =>
					option
						.setName('tracked')
						.setDescription('The channel you want to add to the tracked channels')
						.addChannelTypes(ChannelType.GuildVoice)
						.setRequired(true),
				)
				.addNumberOption((option) =>
					option
						.setName('vcrate')
						.setDescription('ie 1 = 1 coin per min in tracked vc')
						.setRequired(true),
				)
				.addNumberOption((option) =>
					option
						.setName('messagerate')
						.setDescription('ie 1 = 1 coin per message')
						.setRequired(true),
				)
				.addNumberOption((option) =>
					option
						.setName('rent')
						.setDescription('ie 150 = 150 coins per day')
						.setRequired(true),
				)
				.addRoleOption((option) =>
					option
						.setName('admin')
						.setDescription('The role you want to add to the admin roles')
						.setRequired(true),
				)
				.addChannelOption((option) =>
					option
						.setName('welcome')
						.setDescription('The channel you want to send the welcome message to')
						.setRequired(true),
				)
				.addNumberOption((option) =>
					option
						.setName('econ')
						.setDescription('Set up the starting econ for a user when they first join')
						.setRequired(true),
				)
				.addChannelOption((option) =>
					option
						.setName('category')
						.setDescription('the category for the rooms to be created under')
						.setRequired(true),
				)
				.addRoleOption((option) =>
					option
						.setName('starter')
						.setDescription('The role you want to add to users when they join')
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('econ')
				.setDescription('add or remove econ to a user')
				.addUserOption((option) =>
					option
						.setName('user')
						.setDescription('The user you want to add econ to')
						.setRequired(true),
				)
				.addBooleanOption((option) =>
					option
						.setName('add')
						.setDescription('Do you want to add or remove econ')
						.setRequired(true),
				)
				.addNumberOption((option) =>
					option
						.setName('amount')
						.setDescription('The amount of econ you want to add or remove')
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('badge')
				.setDescription('Add a new badge to a users profile or remove a badge')
				.addUserOption((option) =>
					option
						.setName('user')
						.setDescription('The user you want to add a badge to')
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName('badge')
						.setDescription('The badge you want to add to the users profile')
						.setAutocomplete(true)
						.setRequired(true),
				)
				.addBooleanOption((option) =>
					option
						.setName('add')
						.setDescription('Do you want to add or remove the badge')
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('upload')
				.setDescription('Upload a new badge or profile base to the bot for the server')
				.addAttachmentOption((option) =>
					option
						.setName('image')
						.setDescription('The image you want to add to you server options')
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName('name')
						.setDescription('The name of the image')
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName('type')
						.setDescription('The type of the image')
						.addChoices(
							{ name: 'badge', value: 'badges' },
							{ name: 'profile', value: 'profiles' },
						)
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('tracked')
				.setDescription('Add more tracked channels for the bot')
				.addChannelOption((option) =>
					option
						.setName('channel')
						.setDescription('The channel you want to add to the tracked channels')
						.addChannelTypes(ChannelType.GuildVoice)
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('admin')
				.setDescription('add and admin role to the bot')
				.addRoleOption((option) =>
					option
						.setName('role')
						.setDescription('The admin role you want to add')
						.setRequired(true),
				),
		),
	async execute(interaction) {
		await commandRouter.handle(interaction)
	},
}
