import { errorHandler } from '../handlers/errorHandler.js'
import { userActions } from '../actions/userActions.js'
import { embedHelper } from '../classes/embedHelper.js'
import { timerManager } from '../classes/timerManager.js'
import { blackJack } from '../handlers/blackJackHandler.js'
import { actionHelper } from '../classes/actionsHelper.js'
import { guildActions } from '../actions/guildActions.js'
import { roomsActions } from '../actions/roomsActions.js'
import { AttachmentBuilder } from 'discord.js'

class CommandRouter {
	constructor() {
		this.router = new Map()
	}

	register(commandName, callback) {
		this.router.set(commandName, callback)
	}

	async handle(interaction, admin = false) {
		const command = interaction.commandName
		const subcommand = interaction.options.getSubcommand(false)

		const commandKey = subcommand ? `${command}.${subcommand}` : command
		const handler = this.router.get(commandKey)

		if (!handler) {
			console.log(`No handler found for ${commandKey}`)
			return
		}

		try {
			await handler(interaction, interaction.guild, interaction.user)
		} catch (error) {
			console.error(`Error executing ${commandKey}:`, error)
			// Handle error response to user
			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({
					content: 'There was an error executing this command.',
					ephemeral: true,
				})
			}
		}
	}
}

export const commandRouter = new CommandRouter()

//utility commands
commandRouter.register(
	'ping',
	errorHandler()(async (interaction) => {
		await interaction.reply(`Pong! (${interaction.client.ws.ping}ms)`, {
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'profile',
	errorHandler('Profile Command')(async (interaction) => {
		await interaction.deferReply()
		const targetUser = interaction.options.getUser('user')
		const user = targetUser ? targetUser : interaction.user
		const targetMember = interaction.options.getMember('user')
		const member = targetMember ? targetMember : interaction.member
		const image = await userActions.createProfilePic(interaction.guild.id, user, member)
		await interaction.editReply({ files: [image] })
	}),
)

commandRouter.register(
	'quest',
	errorHandler('Quest Command')(async (interaction, guild, user) => {
		let embed
		const quest = await userActions.getUserQuest(guild.id, user.id)
		if (quest) {
			embed = await embedHelper.makeQuest(quest, user.id)
			await interaction.reply({ embeds: [embed] })
		} else {
			await interaction.reply({
				content: 'You do not have a quest set',
				ephemeral: true,
			})
		}
	}),
)

commandRouter.register(
	'quest.set',
	errorHandler('Quest.Set Command')(async (interaction, guild, user) => {
		await userActions.setUserQuest(guild.id, user.id, {
			name: interaction.options.getString('quest'),
			description: interaction.options.getString('description'),
			deadline: interaction.options.getString('deadline'),
			reward: interaction.options.getString('reward'),
		})
		await interaction.reply({
			content: 'Quest set!',
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'quest.view',
	errorHandler('Quest.View Command')(async (interaction, guild, user) => {
		let embed
		const userId = interaction.options.getUser('user')?.id || interaction.user.id
		const quest = await userActions.getUserQuest(guild.id, userId)
		if (quest) {
			embed = await embedHelper.makeQuest(quest, userId)
			await interaction.reply({ embeds: [embed] })
		} else {
			await interaction.reply({
				content: 'You do not have a quest set',
				ephemeral: true,
			})
		}
	}),
)

commandRouter.register(
	'remind',
	errorHandler('Remind Command')(async (interaction, guild, user) => {
		const reminder = interaction.options.getString('reminder')
		const time = interaction.options.getInteger('time')
		const timeInMs = time * 60 * 1000
		timerManager.createTimer({
			name: reminder,
			userId: user.id,
			duration: timeInMs,
			callback: () => {
				interaction.channel.send(`Reminder for <@${user.id}> : ${reminder}`)
			},
		})
		await interaction.reply({
			content: `Reminder ${reminder} set for ${time} ${time === 1 ? 'minute' : 'minutes'}`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'schedule',
	errorHandler('Schedule Command')(async (interaction) => {
		await interaction.reply({
			content: 'This command is not yet implemented',
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'stats',
	errorHandler('Stats Command')(async (interaction, guild, user) => {
		const checkValid = (name, value) => {
			if (name === 'level') {
				return value <= 100
			} else if (['hp', 'focus', 'mood', 'mana'].includes(name)) {
				if (isNaN(Number(value))) {
					return false
				} else {
					return value <= 10
				}
			} else {
				return typeof value === 'string'
			}
		}

		const options = interaction.options.data
		let data = {}
		for (const option of options) {
			if (!checkValid(option.name, option.value)) {
				await interaction.reply({ content: 'Invalid input!', ephemeral: true })
				return
			}
			data[option.name] = option.value
			data['timestamp'] = new Date().toLocaleString('en-US', options)
		}
		await userActions.updateUserProfile(guild.id, user.id, data)
		await interaction.reply({ content: 'Stats Updated!', ephemeral: true })
	}),
)

//game commands
commandRouter.register(
	'blackjack',
	errorHandler('Blackjack Command')(async (interaction, guild, user) => {
		try {
			interaction.deferReply()
			const bet = interaction.options.getNumber('bet')
			let userEcon = await userActions.getUserEcon(guild.id, user.id)

			if (userEcon < bet) {
				return interaction.reply({
					content: `You do not have enough money to bet ${bet}`,
					ephemeral: true,
				})
			}

			if (blackJack.userHasGame(user.id)) {
				return interaction.reply({
					content: `You already have a game in progress`,
					ephemeral: true,
				})
			}

			await userActions.updateUserEcon(guild.id, user.id, bet, false)
			await blackJack.startGame(user.id, bet, userEcon, interaction)
		} catch (error) {
			console.error('Error in blackjack command:', error)
			await interaction.followUp({
				content: 'There was an error starting the game. Please try again.',
				ephemeral: true,
			})
		}
	}),
)

commandRouter.register(
	'cf',
	errorHandler('CoinFlip Command')(async (interaction) => {
		await interaction.reply('CoinFlip!', {
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'slots',
	errorHandler('Slots Command')(async (interaction) => {
		await interaction.reply('Slots!', {
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'roulette',
	errorHandler('Roulette Command')(async (interaction) => {
		await interaction.reply('Roulette!', {
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'dice',
	errorHandler('Dice Command')(async (interaction) => {
		await interaction.reply('Dice!', {
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'wheel',
	errorHandler('Wheel Command')(async (interaction) => {
		await interaction.reply('Wheel!', {
			ephemeral: true,
		})
	}),
)

//Economy Commands
commandRouter.register(
	'balance',
	errorHandler('Balance Command')(async (interaction, guild, user) => {
		user = interaction.options.getUser('user') || interaction.user
		const econ = await userActions.getUserEcon(guild.id, user.id)
		await interaction.reply({
			content: `Balance: ${econ}`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'leaderboard',
	errorHandler('Leaderboard Command')(async (interaction, guild, user) => {
		let leaderboard = await guildActions.getServerLeaderboard(
			guild.id,
			interaction.options.getString('leaderboard') ?? 'econ',
		)
		let embed = await embedHelper.makeLeaderboard(
			interaction.options.getString('leaderboard') ?? 'econ',
			leaderboard,
		)

		await interaction.reply({ embeds: [embed], ephemeral: false })
	}),
)

commandRouter.register(
	'room',
	errorHandler('Room Command')(async (interaction) => {}),
)

commandRouter.register(
	'room.rent',
	errorHandler('Room.Rent Command')(async (interaction, guild, user) => {
		const rent = await guildActions.getServerRent(guild.id)
		const success = await roomsActions.createRoom(guild, user.id, {
			name: interaction.options.getString('name'),
			createdAt: Date.now(),
			owner: user.id,
			members: [user.id],
			rentTime: interaction.options.getInteger('time'),
			roomBalance: Number(rent * interaction.options.getInteger('time')),
		})
		if (!success) {
			await interaction.reply({
				content: 'You do not have enough coins to rent a room',
				ephemeral: true,
			})
			return
		}
		await interaction.reply({
			content: 'You have rented a room',
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'room.deposit',
	errorHandler('Room.Deposit Command')(async (interaction, guild, user) => {
		const channel = interaction.channel
		const serverRooms = await roomsActions.getServerRooms(guild.id)
		if (serverRooms.includes(channel.id)) {
			const deposit = await roomsActions.deposit(
				guild.id,
				channel.id,
				user.id,
				interaction.options.getInteger('amount'),
			)
			if (deposit) {
				await interaction.reply({
					content:
						'You have deposited ' + interaction.options.getInteger('amount') + ' coins',
					ephemeral: true,
				})
			} else {
				await interaction.reply({
					content: 'You do not have enough coins to deposit',
					ephemeral: true,
				})
			}
		} else {
			await interaction.reply({
				content: 'You must use this command in the room you want to deposit to',
				ephemeral: true,
			})
		}
	}),
)

commandRouter.register(
	'room.invite',
	errorHandler('Room.invite Command')(async (interaction, guild, user) => {
		const channel = interaction.channel
		const serverRooms = await roomsActions.getServerRooms(guild.id)
		if (serverRooms.includes(channel.id)) {
			const invite = await roomsActions.roomInvite(
				guild.id,
				channel.id,
				interaction.options.getUser('user'),
			)
			if (invite) {
				await interaction.reply({
					content:
						'You have invited ' + interaction.options.getUser('user') + ' to the room',
					ephemeral: true,
				})
			} else {
				await interaction.reply({
					content:
						'You must use this command in the room youd like to invite the user to or the user is already in the room',
					ephemeral: true,
				})
			}
		} else {
			await interaction.reply({
				content: 'You must use this command in the room youd like to invite the user to',
				ephemeral: true,
			})
		}
	}),
)

commandRouter.register(
	'room.kick',
	errorHandler('Room.Kick Command')(async (interaction, guild, user) => {
		const channel = interaction.channel
		const serverRooms = await roomsActions.getServerRooms(guild.id)
		if (serverRooms.includes(channel.id)) {
			const kick = await roomsActions.roomKick(
				guild.id,
				channel.id,
				interaction.options.getUser('user'),
			)
			if (kick) {
				await interaction.reply({
					content:
						'You have kicked ' + interaction.options.getUser('user') + ' from the room',
					ephemeral: true,
				})
			} else {
				await interaction.reply({
					content:
						'You must use this command in the room youd like to kick the user from',
					ephemeral: true,
				})
			}
		} else {
			await interaction.reply({
				content: 'You must use this command in the room youd like to kick the user from',
				ephemeral: true,
			})
		}
	}),
)

commandRouter.register(
	'room.status',
	errorHandler('Room.Status Command')(async (interaction, guild, user) => {
		const channel = interaction.channel
		const serverRooms = await roomsActions.getServerRooms(guild.id)
		if (serverRooms.includes(channel.id)) {
			const status = await roomsActions.getRoomStatus(guild, channel.id)
			if (status.length > 0) {
				await interaction.reply({
					embeds: [status[0]],
					components: status[1],
				})
			} else {
				await interaction.reply({
					content: 'You must use this command in the room you like to get the status of',
					ephemeral: true,
				})
			}
		} else {
			await interaction.reply({
				content: 'You must use this command in the room youd like to get the status of',
				ephemeral: true,
			})
		}
	}),
)

commandRouter.register(
	'send',
	errorHandler('Send Command')(async (interaction, guild, user) => {
		const receivingUser = interaction.options.getUser('user')
		const amount = interaction.options.getInteger('amount')
		if (await userActions.sendEcon(guild.id, user.id, receivingUser.id, amount)) {
			await interaction.reply({
				content: `You sent ${amount} coins to ${receivingUser.username}`,
				ephemeral: true,
			})
		} else {
			await interaction.reply({
				content: `You do not have enough money to send ${amount} coins`,
				ephemeral: true,
			})
		}
	}),
)

commandRouter.register(
	'shop',
	errorHandler('Shop Command')(async (interaction) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

//Admin Commands
commandRouter.register(
	'config',
	errorHandler('Config Command')(async (interaction, guild, user) => {
		await interaction.reply({
			content: `Please use one of the following subcommands: setup, econ, badge, upload`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'config.setup',
	errorHandler('Config.Setup Command')(async (interaction, guild, user) => {
		await guildActions.updateServerConfig(guild.id, {
			logChannelId: interaction.options.getChannel('logs').id,
			trackedChannelsIds: [
				...(await guildActions.getServerTracked(guild.id)),
				interaction.options.getChannel('tracked').id,
			],
			econRate: [
				interaction.options.getNumber('messagerate'),
				interaction.options.getNumber('vcrate'),
			],
			roomRent: interaction.options.getNumber('rent'),
			adminRolesId: [
				...(await guildActions.getServerAdminRole(guild.id)),
				interaction.options.getRole('admin').id,
			],
			welcomeChannelId: interaction.options.getChannel('welcome').id,
			welcomeEcon: interaction.options.getNumber('econ'),
			roomCata: interaction.options.getChannel('category').id,
			starterRoleId: interaction.options.getRole('starter').id,
		})
		await interaction.reply({
			content: `Server config updated`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'config.econ',
	errorHandler('Config.Econ Command')(async (interaction, guild, user) => {
		await userActions.updateUserEcon(
			guild.id,
			String(interaction.options.getUser('user').id),
			interaction.options.getNumber('amount'),
			interaction.options.getBoolean('add'),
		)
		interaction.editReply({
			content: `The users econ has been updated`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'config.badge',
	errorHandler('Config.Badge Command')(async (interaction, guild, user) => {
		await userActions.updateUserBadges(
			guild.id,
			String(interaction.options.getUser('user').id),
			interaction.options.getString('badge'),
			interaction.options.getBoolean('add'),
		)
		interaction.editReply({
			content: `The users badges has been updated`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'config.upload',
	errorHandler('Config.Upload Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

		const file = interaction.options.getAttachment('image')
		const name = interaction.options.getString('name')
		const type = interaction.options.getString('type').value

		// Get the target channel for image hosting
		const imageChannel = await interaction.client.channels.fetch(
			process.env.IMAGE_HOSTING_CHANNEL,
		)

		const attachment = new AttachmentBuilder(file.url)
		const message = await imageChannel.send({
			files: [attachment],
		})

		const imageUrl = message.attachments.first()?.url

		if (!imageUrl) {
			await interaction.editReply({
				content: 'Failed to upload image',
				ephemeral: true,
			})
			return
		}

		let data =
			type === 'badges'
				? await guildActions.getServerBadges(guild.id)
				: await guildActions.getServerProfiles(guild.id)

		for (const key in data) {
			if (data[key] === name) {
				await interaction.editReply({
					content: `A ${type} with that name already exists`,
					ephemeral: true,
				})
				return
			}
		}

		data[name] = imageUrl

		await guildActions.updateServerConfig(guild.id, {
			[type]: data,
		})

		await interaction.editReply({
			content: `Image uploaded`,
			ephemeral: true,
		})
	}),
)
