import { SlashCommandBuilder } from 'discord.js'
import { userActions } from '../../actions/userActions.js'
import { embedHelper } from '../../classes/embedHelper.js'

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
	async execute(interaction) {
		try {
			const guildId = interaction.guild.id
			const userId = interaction.options.getUser('user')?.id || interaction.user.id
			switch (interaction.options.getSubcommand()) {
				case 'set':
					await userActions.setUserQuest(guildId, userId, {
						name: interaction.options.getString('quest'),
						description: interaction.options.getString('description'),
						deadline: interaction.options.getString('deadline'),
						reward: interaction.options.getString('reward'),
					})
					break
				case 'view':
					let embed
					const quest = await userActions.getUserQuest(guildId, userId)
					if (quest) {
						embed = await embedHelper.makeQuest(quest, userId)
						await interaction.reply({ embeds: [embed] })
					} else {
						await interaction.reply({
							content: 'You do not have a quest set',
							ephemeral: true,
						})
					}
					break
				default:
					await interaction.reply({
						content: 'This command is not yet implemented',
						ephemeral: true,
					})
					break
			}
		} catch (e) {
			console.log(`Error occurred in quest command: ${e}`)
		}
	},
}
