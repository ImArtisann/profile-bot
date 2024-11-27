import { errorHandler } from '../handlers/errorHandler.js'

class GuildClass {
	constructor() {
		this.client = null
		this.guildData = {
			roomRent: 150,
			econRate: [0.2, 1],
			experienceRate: [0.2, 1],
			adminRolesId: [''],
			logChannelId: '',
			welcomeChannelId: '',
			starterRoleId: '',
			welcomeEcon: 100,
			ticketChannelId: '',
			configChannelId: '',
			trackedChannelsIds: [],
			serverShop: {},
			badges: {},
			profiles: {},
			roomCata: '',
		}
		this.userData = {
			hp: 4,
			mood: 4,
			focus: 4,
			mana: 4,
			level: '???',
			class: '???',
			timezone: 'America/Los_Angeles',
			timestamp: '',
			vcJoined: '',
			badges: [],
			econ: 100,
			hoursVC: 0,
			messages: 0,
			privateChannels: [],
			tasks: [],
			mainQuest: {},
			profileImage: '',
		}
	}

	/**
	 * Initialize the class with the redis client
	 * @param {import('ioredis').Redis} client Redis client instance
	 */
	initialize = errorHandler('Initializing guild actions')(async (client) => {
		this.client = client
	})

	/**
	 * When the bot joins the server create the entry in the database for the servers config
	 * and create a db for all the users that are in that server
	 * @param {import('discord.js').Guild} guild
	 */
	createServer = errorHandler('Create Server Guild Actions')(async (guild) => {
		await this.client.set(`${guild.id}:config`, JSON.stringify(this.guildData))
		let members = await guild.members.fetch()
		for (const [memberId, member] of members) {
			if (!member.user.bot) {
				await this.addMember(guild.id, memberId)
			}
		}
	})

	/**
	 * Add a user to the servers db
	 * @param {String|import('discord.js').Snowflake} guildId
	 * @param {String|import('discord.js').Snowflake} userId
	 * @returns {Promise<void>}
	 */
	addMember = errorHandler('Add Member Guild Actions')(async (guildId, userId) => {
		await this.client.hset(`${guildId}:users`, userId, JSON.stringify(this.userData))
	})

	/**
	 * Get the servers rent per day in coins for a private VC
	 * @param {String} guildId
	 * @returns {Promise<number>}
	 */
	getServerRent = errorHandler('Get Server Rent Guild Actions')(async (guildId) => {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.roomRent
	})

	/**
	 * Get the servers econ rate for each min in a tracked VC
	 * @param {String} guildId
	 * @returns {Promise<[]>} - 0 - messages, 1 - VCMins
	 */
	getServerRate = errorHandler('Get Server Rate Guild Actions')(async (guildId) => {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.econRate
	})

	/**
	 * Get the servers experience rate [Messages, VCMins]
	 * @param {String} guildId
	 * @returns {Promise<number[]>}
	 */
	getServerExperienceRate = errorHandler('Get Server Exp Rate Guild Actions')(
		async (guildId) => {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.experienceRate
		},
	)

	/**
	 * Get the tracked VC channel ids where people can earn econ in
	 * @param {String} guildId
	 * @returns {Promise<[]>}
	 */
	getServerTracked = errorHandler('Get Server Tracked Guild Actions')(async (guildId) => {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.trackedChannelsIds
	})

	/**
	 * Get the servers shop
	 * @param {String} guildId
	 * @returns {Promise<[]>}
	 */
	getServerShop = errorHandler('Get Server Shop Guild Actions')(async (guildId) => {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.serverShop
	})

	/**
	 * Get the server log channel where it tracks the vc and econ transfers
	 * @param {String} guildId
	 * @returns {Promise<string>}
	 */
	getServerLogChannel = errorHandler('Get Server Log Channel Guild Actions')(
		async (guildId) => {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.logChannelId
		},
	)

	/**
	 * Get the server ticket channel
	 * @param guildId{String}
	 * @returns {Promise<string>}
	 */
	getServerTicketChannel = errorHandler('Get Server Ticket Channel Guild Actions')(
		async (guildId) => {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.ticketChannelId
		},
	)

	/**
	 * Get the server config channel id
	 * @param guildId{String}
	 * @returns {Promise<string>}
	 */
	getServerConfigChannel = errorHandler('Get Server Config Channel Guild Actions')(
		async (guildId) => {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.configChannelId
		},
	)

	/**
	 * Get the server welcome channel id
	 * @param guildId{String}
	 * @returns {Promise<string>}
	 */
	getServerWelcomeChannel = errorHandler('Get Server Welcome Channel Guild Actions')(
		async (guildId) => {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.welcomeChannelId
		},
	)

	/**
	 * Get the names of the server badges
	 * @param {String} guildId - The ID of the guild
	 * @returns {Promise<string[]>} - An array of badge names
	 */
	getServerBadgesNames = errorHandler('Get Server Badges Names Guild Actions')(
		async (guildId) => {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			let names = []
			for (const [key] of Object.entries(data.badges)) {
				names.push(key)
			}
			return names
		},
	)

	/**
	 * Get the server badges
	 * @param {String} guildId - The ID of the guild
	 * @returns {Promise<Object>} - The badges object
	 */
	getServerBadges = errorHandler('Get Server Badges Guild Actions')(async (guildId) => {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.badges
	})

	/**
	 * Get the server profiles
	 * @param {String} guildId - The ID of the guild
	 * @returns {Promise<Object>} - The profiles object
	 */
	getServerProfiles = errorHandler('Get Server Profiles Guild Actions')(
		async (guildId) => {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.profiles
		},
	)

	/**
	 * Get the server admin roles IDs
	 * @param {String} guildId - The ID of the guild
	 * @returns {Promise<string[]>} - An array of admin roles IDs
	 */
	getServerAdminRole = errorHandler('Get Server Admin Role Guild Actions')(
		async (guildId) => {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.adminRolesId
		},
	)

	/**
	 * Get the room category ID where the rooms are created
	 * @param {String} guildId - The ID of the guild
	 * @returns {Promise<string>} - The room category ID
	 */
	getRoomCategory = errorHandler('Get Room Category Guild Actions')(async (guildId) => {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.roomCata
	})

	/**
	 * update the server config
	 * @param {String} guildId
	 * @param {Object} data
	 * @param {number} [data.roomRent] - The rent per day in coins
	 * @param {number} [data.econRate] - The econ rate per min
	 * @param {Array} [data.experienceRate] - The experience rate per message
	 * @param {Array} [data.trackedChannelsIds] - The tracked channels ids
	 * @param {Array} [data.serverShop] - The server shop
	 * @param {Array} [data.logChannelId] - The log channel id
	 * @param {string} [data.ticketChannelId] - The ticket channel id
	 * @param {string} [data.configChannelId] - The config channel id
	 * @param {string} [data.starterRoleId] - The starter role id
	 * @param {string} [data.welcomeChannelId] - The welcome channel id
	 * @param {number} [data.welcomeEcon] - The welcome econ a user gets when joining
	 * @param {Array} [data.adminRolesId] - The admin roles ids that can use the admin commands
	 * @param {Object} [data.badges] - The badges
	 * @param {Object} [data.profiles] - The profiles
	 * @param {string} [data.roomCata] - the room category id where the rooms are created
	 * @returns {Promise<void>}
	 */
	updateServerConfig = errorHandler('Update Server Config Guild Actions')(
		async (guildId, data) => {
			let config = JSON.parse(await this.client.get(`${guildId}:config`))
			for (const key in data) {
				config[key] = data[key]
			}
			await this.client.set(`${guildId}:config`, JSON.stringify(config))
		},
	)

	/**
	 * add a private channel to a user and to the server
	 * @param {string} guildId - The guild ID
	 * @param {string} userId - The user ID
	 * @param {string} channelId - The channel ID
	 * @param {Object} roomInfo - The room information
	 * @param {string} roomInfo.name - The name of the room
	 * @param {string} roomInfo.createdAt - When the room was created
	 * @param {string} roomInfo.owner - The owner of the room
	 * @param {Array} roomInfo.members - The members in the room
	 * @param {number} roomInfo.rentTime - The rent time for the room
	 * @param {number} roomInfo.roomBalance - The room's balance
	 * @returns {Promise<void>}
	 */
	addPrivateChannel = errorHandler('Add Private Channel Guild Actions')(
		async (guildId, userId, channelId, roomInfo) => {
			let data = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
			data.privateChannels.push(channelId)
			await this.client.hset(`${guildId}:users`, userId, JSON.stringify(data))
			await this.client.hset(
				`${guildId}:privateChannels`,
				channelId,
				JSON.stringify(roomInfo),
			)
		},
	)

	addTrackedChannel = errorHandler('Add Tracked Channel Guild Actions')(
		async (guildId, channelId) => {
			let data = JSON.parse(await this.client.get(`${guildId}:config`))
			data.trackedChannelsIds.push(channelId)
			await this.client.set(`${guildId}:config`, JSON.stringify(data))
		},
	)

	/**
	 * Retrieves the server leaderboard for the specified guild.
	 * @param {string} guildId - The ID of the guild.
	 * @param {string} [type='econ'] - The type of leaderboard to retrieve, defaults to 'econ'.
	 *                                 Possible values: 'econ', 'messages', 'hoursVC'.
	 * @returns {Promise<Object[]>} - An array of user objects representing the leaderboard.
	 */
	getServerLeaderboard = errorHandler('Get Server Leaderboard Guild Actions')(
		async (guildId, type = 'econ') => {
			const data = await this.client.hgetall(`${guildId}:users`)
			const leaderboard = []
			for (const userId in data) {
				const userData = JSON.parse(data[userId])
				if (type === 'econ') {
					leaderboard.push({
						userId: userId,
						amount: Number(userData.econ),
					})
				} else if (type === 'messages') {
					leaderboard.push({
						userId: userId,
						amount: Number(userData.messages),
					})
				} else if (type === 'hoursVC') {
					leaderboard.push({
						userId: userId,
						amount: Number(userData.hoursVC),
					})
				}
			}
			return leaderboard.sort((a, b) => b[type] - a[type]).slice(0, 10)
		},
	)
}

export const guildActions = new GuildClass()
