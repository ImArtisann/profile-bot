import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js'
import path from 'node:path'
import { dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { userActions } from '../../actions/userActions.js'

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
		try {
			await interaction.deferReply()
			const targetUser = interaction.options.getUser('user')
			const user = targetUser ? targetUser : interaction.user
			const targetMember = interaction.options.getMember('user')
			const member = targetMember ? targetMember : interaction.member
			const image = await userActions.createProfilePic(interaction.guild.id, user, member)
			await interaction.editReply({ files: [image] })
		} catch (e) {
			console.log(`Error occurred in profile command: ${e}`)
		}
	},
}
