import { AttachmentBuilder, Client as client, Events } from 'discord.js'
import { guildActions } from '../actions/guildActions.js'
import { userActions } from '../actions/userActions.js'
import { errorHandler } from '../handlers/errorHandler.js'
import 'dotenv/config'

export const name = Events.GuildMemberAdd
export const once = false

export const execute = errorHandler('Event Member Joined')(async function (member) {
	if (member.guild.id !== '1242915877632999445') return

	await guildActions.addMember(member.guild.id, member.id)
	const channel = member.guild.channels.cache.get('1253016548080222261')
	const user = member.user
	let serverBadges = await guildActions.getServerBadges(member.guild.id)
	const testGuild = await member.client.guilds.fetch(process.env.TEST_GUILD_ID)
	const imageChannel = await testGuild.channels.fetch(process.env.IMAGE_HOSTING_CHANNEL)
	for (const [key, value] of Object.entries(serverBadges)) {
		serverBadges[key] = await imageChannel.messages.fetch(value).then((message) => {
			return message.attachments.first().url
		})
	}
	const image = await userActions.callWorker({
		name: member.nickname || member.user.displayName,
		avatarUrl: user.avatarURL({ extension: 'png', size: 512 }),
		profileData: await userActions.getUserProfile(member.guild.id, member.id),
		serverBadges: serverBadges,
		type: 'profile',
	})
	const attachment = new AttachmentBuilder(Buffer.from(image.image.buffer), {
		name: 'profile.png',
	})
	const embed = {
		title: '**Are you ready to Gamify your Life?**',
		description: `${member} has spawned into :fleur_de_lis: • 𝐆𝐚𝐦𝐢𝐟𝐟𝐲𝐧𝐢𝐚 • :fleur_de_lis:
			
			*Please check out these channels to get started!*
			
			<#1252425598240952331>
			<#1252286880859295811>
			<#1252286791940046898>
			`,
		color: 0x0099ff,
	}
	channel.send({
		embeds: [embed],
	})
	channel.send({
		files: [attachment],
	})
	member.roles.add('1252692250958237828')
	await guildActions.addMember(member.guild.id, member.id)
})
