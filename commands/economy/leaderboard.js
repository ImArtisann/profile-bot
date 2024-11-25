import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { guildActions } from '../../actions/guildActions.js'
import { embedHelper } from '../../classes/embedHelper.js'

export default {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('View the leaderboard econ is default')
		.addStringOption((option) =>
			option
				.setName('leaderboard')
				.setDescription('The leaderboard you want to view')
				.addChoices(
					{ name: 'Econ', value: 'econ' },
					{ name: 'VC Hours', value: 'hoursVC' },
					{ name: 'Messages', value: 'messages' },
				),
		),
	async execute(interaction) {
		try {
			let leaderboard = await guildActions.getServerLeaderboard(
				interaction.guild.id,
				interaction.options.getString('leaderboard') ?? 'econ',
			)
			let embed = await embedHelper.makeLeaderboard(
				interaction.options.getString('leaderboard') ?? 'econ',
				leaderboard,
			)

			await interaction.reply({ embeds: [embed], ephemeral: false })
		} catch (e) {
			console.log(`Error occurred in command leaderboard: ${e}`)
		}
	},
}
