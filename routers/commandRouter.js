import {
	CommandError,
	createCommandError,
	errorHandler,
} from '../handlers/errorHandler.js'
import { userActions } from '../actions/userActions.js'
import { embedHelper } from '../classes/embedHelper.js'
import { timerManager } from '../classes/timerManager.js'
import { blackJack } from '../handlers/blackJackHandler.js'
import { actionHelper } from '../classes/actionsHelper.js'
import { guildActions } from '../actions/guildActions.js'
import { roomsActions } from '../actions/roomsActions.js'
import { AttachmentBuilder } from 'discord.js'
import { highOrLower } from '../handlers/holHandler.js'
import { mineSweeper } from '../handlers/mineSweeperHandler.js'
import { raceHandler } from '../handlers/raceHandler.js'
import 'dotenv/config'

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
		const handler = this.router.get(String(commandKey).toLowerCase())

		if (!handler) {
			interaction.reply({
				content: 'Command not found',
				ephemeral: true,
			})
		}

		if (admin) {
			const adminRoles = await guildActions.getServerAdminRole(interaction.guild.id)
			if (
				adminRoles.some((role) => interaction.member.roles.cache.has(role)) ||
				interaction.guild.ownerId === interaction.user.id
			) {
				try {
					await handler(interaction, interaction.guild, interaction.user)
				} catch (error) {
					console.error(`Error executing ${commandKey}:`, error)
				}
			} else {
				await interaction.reply({
					content: 'You are not authorized to use this command',
					ephemeral: true,
				})
			}
		} else {
			try {
				await handler(interaction, interaction.guild, interaction.user)
			} catch (error) {
				console.error(`Error executing ${commandKey}:`, error)
			}
		}
	}
}

export const commandRouter = new CommandRouter()

//utility commands
commandRouter.register(
	'ping',
	errorHandler()(async (interaction) => {
		await interaction.reply({
			content: `Pong! ${interaction.client.ws.ping}ms`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'profile',
	errorHandler('Profile Command')(async (interaction, guild, user) => {
		await interaction.deferReply({})

		const targetUser = interaction.options.getUser('user')
		user = targetUser ? targetUser : user
		const targetMember = interaction.options.getMember('user')
		const member = targetMember ? targetMember : interaction.member
		let serverBadges = await guildActions.getServerBadges(guild.id)
		const testGuild = await interaction.client.guilds.fetch(process.env.TEST_GUILD_ID)
		const imageChannel = await testGuild.channels.fetch(process.env.IMAGE_HOSTING_CHANNEL)
		for (const [key, value] of Object.entries(serverBadges)) {
			serverBadges[key] = await imageChannel.messages.fetch(value).then((message) => {
				return message.attachments.first().url
			})
		}

		const image = await userActions.callWorker({
			name: member.nickname || member.user.displayName,
			avatarUrl: user.avatarURL({ extension: 'png', size: 512 }),
			profileData: await userActions.getUserProfile(guild.id, user.id),
			serverBadges: serverBadges,
			type: 'profile',
		})
		const attachment = new AttachmentBuilder(Buffer.from(image.image.buffer), {
			name: 'profile.png',
		})
		await interaction.editReply({ files: [attachment] })
	}),
)

commandRouter.register(
	'quest.set',
	errorHandler('Quest.Set Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

		await userActions.setUserQuest(guild.id, user.id, {
			name: interaction.options.getString('quest'),
			description: interaction.options.getString('description'),
			deadline: interaction.options.getString('deadline'),
			reward: interaction.options.getString('reward'),
		})
		await interaction.editReply({
			content: 'Quest set!',
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'quest.view',
	errorHandler('Quest.View Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

		let embed
		const userId = interaction.options.getUser('user')?.id || interaction.user.id
		const quest = await userActions.getUserQuest(guild.id, userId)
		if (quest && Object.keys(quest).length > 0) {
			embed = await embedHelper.makeQuest(quest, userId)
			await interaction.editReply({ embeds: [embed] })
		} else {
			await interaction.editReply({
				content: 'User does not have a quest set!',
				ephemeral: true,
			})
		}
	}),
)
commandRouter.register(
	'remind',
	errorHandler('Remind Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

		const reminder = interaction.options.getString('reminder')
		const time = interaction.options.getInteger('time')
		let timer = await timerManager.createReminderTimer(
			guild,
			interaction.channel.id,
			user.id,
			reminder,
			time,
		)
		timer.start()
		await timerManager.setTimerToRunning(guild.id, timer.id)
		await interaction.editReply({
			content: `Reminder ${reminder} set for ${time} ${time === 1 ? 'minute' : 'minutes'}`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'schedule',
	errorHandler('Schedule Command')(async (interaction) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'stats',
	errorHandler('Stats Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

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
				await interaction.reply({
					content: 'Invalid Option Given!',
					ephemeral: true,
				})
			}
			data[option.name] = option.value
			data['timestamp'] = new Date().toLocaleString('en-US', options)
		}
		await userActions.updateUserProfile(guild.id, user.id, data)
		await interaction.editReply({ content: 'Stats Updated!', ephemeral: true })
	}),
)

//game commands
commandRouter.register(
	'blackjack.play',
	errorHandler('Blackjack Command')(async (interaction, guild, user) => {
		await interaction.deferReply({})

		const bet = interaction.options.getNumber('bet')
		let userEcon = await userActions.getUserEcon(guild.id, user.id)

		if (userEcon < bet) {
			await interaction.editReply({
				content: "You don't have enough money to bet that much!",
				ephemeral: true,
			})
			return
		}

		if (await blackJack.userHasGame(user.id)) {
			await interaction.editReply({
				content: 'You already have a game in progress!',
				ephemeral: true,
			})
			return
		}

		await userActions.updateUserEcon(guild.id, user.id, bet, false)
		await blackJack.startGame(user.id, bet, userEcon, interaction)
	}),
)

commandRouter.register(
	'blackjack.leave',
	errorHandler('Blackjack.Leave Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

		if (!(await blackJack.userHasGame(user.id))) {
			await interaction.editReply({
				content: 'You dont have a game in progress!',
				ephemeral: true,
			})
			return
		}

		await blackJack.handleLeave(user.id, interaction)
	}),
)

commandRouter.register(
	'cf',
	errorHandler('CoinFlip Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

		const bet = interaction.options.getNumber('bet')
		const userEcon = await userActions.getUserEcon(guild.id, user.id)
		if (userEcon < bet) {
			await interaction.reply({
				content: "You don't have enough money to bet that much!",
				ephemeral: true,
			})
			return
		}
		await userActions.updateUserEcon(guild.id, user.id, bet, false)
		const randomNumber = Math.floor(Math.random() * 2)
		const result = randomNumber === 0 ? 'Heads' : 'Tails'
		const side = interaction.options.getString('side')
		if (side && side.toLowerCase() === result.toLowerCase()) {
			await interaction
				.editReply({
					content: `You won ${bet * 1.5}! the result was ${result} you chose ${side}`,
					ephemeral: true,
				})
				.then(async () => {
					await userActions.updateUserEcon(guild.id, user.id, bet * 1.5, true)
				})
		} else {
			await interaction.editReply({
				content: `You lost ${bet}! the result was ${result} you chose ${side}`,
				ephemeral: true,
			})
		}
	}),
)

commandRouter.register(
	'slots.play',
	errorHandler('Slots Command')(async (interaction) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'slots.leave',
	errorHandler('Slots leave Command')(async (interaction) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'roulette',
	errorHandler('Roulette Command')(async (interaction) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'dice',
	errorHandler('Dice Command')(async (interaction) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'wheel',
	errorHandler('Wheel Command')(async (interaction) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'hol.play',
	errorHandler('Hol Command')(async (interaction, guild, user) => {
		await interaction.deferReply({})

		const bet = interaction.options.getNumber('bet')
		let userEcon = await userActions.getUserEcon(guild.id, user.id)

		if (userEcon < bet) {
			await interaction.editReply({
				content: "You don't have enough money to bet that much!",
				ephemeral: true,
			})
			return
		}

		if (await highOrLower.userHasGame(user.id)) {
			await interaction.editReply({
				content: 'You already have a game in progress!',
				ephemeral: true,
			})
			return
		}

		await userActions.updateUserEcon(guild.id, user.id, bet, false)
		await highOrLower.startGame(user.id, bet, userEcon, interaction)
	}),
)

commandRouter.register(
	'race.play',
	errorHandler('Race Play Command')(async (interaction, guild, user) => {
		await interaction.deferReply({})

		const bet = interaction.options.getNumber('bet')
		let userEcon = await userActions.getUserEcon(guild.id, user.id)

		if (userEcon < bet) {
			await interaction.editReply({
				content: "You don't have enough money to bet that much!",
				ephemeral: true,
			})
			return
		}

		if (await raceHandler.userHasGame(user.id)) {
			await interaction.editReply({
				content: 'You already have a game in progress!',
				ephemeral: true,
			})
			return
		}
		await userActions.updateUserEcon(guild.id, user.id, bet, false)
		await raceHandler.startGame(user.id, bet, userEcon, interaction)
	}),
)

commandRouter.register(
	'race.leave',
	errorHandler('Race Leave Command')(async (interaction, guild, user) => {
		await interaction.deferReply({})

		if (!(await raceHandler.userHasGame(user.id))) {
			await interaction.editReply({
				content: 'You dont have a game in progress!',
				ephemeral: true,
			})
			return
		}

		await raceHandler.handleLeave(user.id, interaction)
	}),
)

commandRouter.register(
	'minesweeper.play',
	errorHandler('Mine Sweeper Play Command')(async (interaction, guild, user) => {
		await interaction.deferReply({})

		const bet = interaction.options.getNumber('bet')
		const mode = interaction.options.getString('difficulty')
		let userEcon = await userActions.getUserEcon(guild.id, user.id)

		if (userEcon < bet) {
			await interaction.editReply({
				content: "You don't have enough money to bet that much!",
				ephemeral: true,
			})
		}

		if (await mineSweeper.userHasGame(user.id)) {
			await interaction.editReply({
				content: 'You already have a game in progress!',
				ephemeral: true,
			})
		}
		const options = {
			easy: 5,
			medium: 10,
			hard: 15,
		}

		await userActions.updateUserEcon(guild.id, user.id, bet, false)
		await mineSweeper.startGame(user.id, bet, userEcon, options[mode], interaction)
	}),
)

commandRouter.register(
	'minesweeper.cashout',
	errorHandler('Mine Sweeper Cash Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

		if (!(await mineSweeper.userHasGame(user.id))) {
			await interaction.editReply({
				content: 'You dont have a game in progress!',
				ephemeral: true,
			})
		}

		await mineSweeper.handleCashOut(user.id, interaction)
	}),
)

commandRouter.register(
	'minesweeper.leave',
	errorHandler('Mine Sweeper Leave Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })
		if (!(await mineSweeper.userHasGame(user.id))) {
			await interaction.editReply({
				content: 'You dont have a game in progress!',
				ephemeral: true,
			})
		}
		await mineSweeper.handleLeave(user.id, interaction)
	}),
)

commandRouter.register(
	'poker.play',
	errorHandler('Poker Play Command')(async (interaction, guild, user) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'poker.leave',
	errorHandler('Poker Leave Command')(async (interaction, guild, user) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'roulette.play',
	errorHandler('Roulette Play Command')(async (interaction, guild, user) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'roulette.leave',
	errorHandler('Roulette leave Command')(async (interaction, guild, user) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'tower.play',
	errorHandler('Tower Play Command')(async (interaction, guild, user) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'tower.leave',
	errorHandler('Tower leave Command')(async (interaction, guild, user) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'wheel.play',
	errorHandler('Wheel Play Command')(async (interaction, guild, user) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'wheel.leave',
	errorHandler('Wheel Leave Command')(async (interaction, guild, user) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'keno.play',
	errorHandler('Keno Play Command')(async (interaction, guild, user) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'keno.leave',
	errorHandler('Keno Leave Command')(async (interaction, guild, user) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'baccarat.play',
	errorHandler('Baccarat Play Command')(async (interaction, guild, user) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'baccarat.leave',
	errorHandler('Baccarat Leave Command')(async (interaction, guild, user) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'tictactoe.play',
	errorHandler('Wheel Play Command')(async (interaction, guild, user) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'tictactoe.leave',
	errorHandler('Wheel Leave Command')(async (interaction, guild, user) => {
		await interaction.reply({
			content: `Command will be coming soon`,
			ephemeral: true,
		})
	}),
)

//Economy Commands
commandRouter.register(
	'balance',
	errorHandler('Balance Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

		user = interaction.options.getUser('user') || interaction.user
		const econ = await userActions.getUserEcon(guild.id, user.id)
		await interaction.editReply({
			content: `Balance: ${econ}`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'leaderboard',
	errorHandler('Leaderboard Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

		let leaderboard = await guildActions.getServerLeaderboard(
			guild.id,
			interaction.options.getString('leaderboard') ?? 'econ',
		)
		let embed = await embedHelper.makeLeaderboard(
			interaction.options.getString('leaderboard') ?? 'econ',
			leaderboard,
		)

		await interaction.editReply({ embeds: [embed], ephemeral: false })
	}),
)

commandRouter.register(
	'room.rent',
	errorHandler('Room.Rent Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

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
			await interaction.editReply({
				content: 'You do not have enough funds to rent a room',
				ephemeral: true,
			})
		} else {
			await interaction.editReply({
				content: 'You have rented a room',
				ephemeral: true,
			})
		}
	}),
)

commandRouter.register(
	'room.deposit',
	errorHandler('Room.Deposit Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

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
				await interaction.editReply({
					content:
						'You have deposited ' + interaction.options.getInteger('amount') + ' coins',
					ephemeral: true,
				})
			} else {
				await interaction.editReply({
					content: 'You do not have enough funds to deposit that amount',
					ephemeral: true,
				})
			}
		} else {
			await interaction.editReply({
				content: 'You must be in a room to deposit',
				ephemeral: true,
			})
		}
	}),
)

commandRouter.register(
	'room.invite',
	errorHandler('Room.invite Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

		const channel = interaction.channel
		if (!(await roomsActions.getServerRooms(guild.id)).includes(channel.id)) {
			await interaction.editReply({
				content: 'You must use this command in a room chat',
				ephemeral: true,
			})
			return
		}

		const invite = await roomsActions.roomInvite(
			guild.id,
			channel.id,
			interaction.options.getUser('user'),
		)
		if (!invite) {
			await interaction.editReply({
				content: 'You must use this command in a room chat',
				ephemeral: true,
			})
			return
		}

		await interaction.editReply({
			content: `You have invited ${interaction.options.getUser('user')} to the room`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'room.kick',
	errorHandler('Room.Kick Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

		const channel = interaction.channel
		if (!(await roomsActions.getServerRooms(guild.id)).includes(channel.id)) {
			await interaction.editReply({
				content: 'You must use this command in a room chat',
				ephemeral: true,
			})
			return
		}

		const kick = await roomsActions.roomKick(
			guild.id,
			channel.id,
			interaction.options.getUser('user'),
		)

		if (!kick) {
			await interaction.editReply({
				content: 'You must use this command in a room chat or not the owner',
				ephemeral: true,
			})
			return
		}

		await interaction.editReply({
			content: `You have kicked ${interaction.options.getUser('user')} from the room`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'room.status',
	errorHandler('Room.Status Command')(async (interaction, guild, user) => {
		await interaction.deferReply({})

		const channel = interaction.channel
		if (!(await roomsActions.getServerRooms(guild.id)).includes(channel.id)) {
			await interaction.editReply({
				content: 'You must use this command in a room chat',
				ephemeral: true,
			})
		}
		const status = await roomsActions.getRoomStatus(guild, channel.id)
		if (status.length > 0) {
			await interaction.editReply({
				embeds: [status[0]],
				components: status[1],
			})
		} else {
			await interaction.editReply({
				content: 'You must use this command in a room chat',
				ephemeral: true,
			})
		}
	}),
)

commandRouter.register(
	'send',
	errorHandler('Send Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

		const receivingUser = interaction.options.getUser('user')
		const amount = interaction.options.getInteger('amount')

		if (amount <= 0) {
			await interaction.editReply({
				content: 'You must send a positive amount of coins!',
				ephemeral: true,
			})
			return
		}

		if (!(await userActions.sendEcon(guild.id, user.id, receivingUser.id, amount))) {
			await interaction.reply({
				content: 'You do not have enough coins to send that amount!',
				ephemeral: true,
			})
			return
		}

		await interaction.editReply({
			content: `Successfully sent ${amount} coins to ${receivingUser.username}!`,
			ephemeral: true,
		})
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
	'config.setup',
	errorHandler('Config.Setup Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

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
		await interaction.editReply({
			content: `Server config updated`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'config.econ',
	errorHandler('Config.Econ Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

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
		await interaction.deferReply({ ephemeral: true })

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
		const type = interaction.options.getString('type')

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
			throw createCommandError('Failed To Upload Image', {
				userMessage: `Failed To Upload Image`,
				severity: 'error',
			})
		}

		let data =
			type === 'badges'
				? await guildActions.getServerBadges(guild.id)
				: await guildActions.getServerProfiles(guild.id)

		if (data.badges && Object.entries(data.badges).length > 0) {
			for (const [key] of Object.entries(data.badges)) {
				if (key === name) {
					await interaction.editReply({
						content: `A Image With That Name Already Exists`,
						ephemeral: true,
					})
				}
			}
		}

		data[name] = imageUrl

		await guildActions.updateServerConfig(guild.id, { [type]: data })

		await interaction.editReply({
			content: `Image uploaded`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'config.tracked',
	errorHandler('Config.tracked Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

		await guildActions.addTrackedChannel(
			guild.id,
			interaction.options.getChannel('channel').id,
		)
		await interaction.editReply({
			content: `The channel has been added to the tracked channels`,
			ephemeral: true,
		})
	}),
)

commandRouter.register(
	'config.admin',
	errorHandler('Config.admin Command')(async (interaction, guild, user) => {
		await interaction.deferReply({ ephemeral: true })

		await guildActions.addAdminRole(guild.id, interaction.options.getRole('role').id)
		await interaction.editReply({
			content: `The role has been added to the admin roles`,
			ephemeral: true,
		})
	}),
)
