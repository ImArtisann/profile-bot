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
	async initialize(client) {
		this.client = client
	}

	/**
	 * When the bot joins the server create the entry in the database for the servers config
	 * and create a db for all the users that are in that server
	 * @param {import('discord.js').Guild} guild
	 */
	createServer = async (guild) => {
		try {
			await this.client.set(`${guild.id}:config`, JSON.stringify(this.guildData))
			let members = await guild.members.fetch()
			for (const [memberId, member] of members) {
				if (!member.user.bot) {
					await this.addMember(guild.id, memberId)
				}
			}
		} catch (error) {
			console.error('Create Server Guild Actions Error:', error)
		}
	}

	/**
	 * Add a user to the servers db
	 * @param {String|import('discord.js').Snowflake} guildId
	 * @param {String|import('discord.js').Snowflake} userId
	 * @returns {Promise<void>}
	 */
	addMember = async (guildId, userId) => {
		try {
			await this.client.hset(`${guildId}:users`, userId, JSON.stringify(this.userData))
		} catch (e) {
			console.log(`Error in addMember: ${e}`)
		}
	}

	/**
	 * Get the servers rent per day in coins for a private VC
	 * @param {String} guildId
	 * @returns {Promise<number>}
	 */
	getServerRent = async (guildId) => {
		try {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.roomRent
		} catch (e) {
			console.log(`Error in getServerRent: ${e}`)
		}
	}

	/**
	 * Get the servers econ rate for each min in a tracked VC
	 * @param {String} guildId
	 * @returns {Promise<[]>} - 0 - messages, 1 - VCMins
	 */
	getServerRate = async (guildId) => {
		try {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.econRate
		} catch (e) {
			console.log(`Error in getServerRate: ${e}`)
		}
	}

	/**
	 * Get the servers experience rate [Messages, VCMins]
	 * @param {String} guildId
	 * @returns {Promise<number[]>}
	 */
	getServerExperienceRate = async (guildId) => {
		try {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.experienceRate
		} catch (e) {
			console.log(`Error in getServerExperienceRate: ${e}`)
		}
	}

	/**
	 * Get the tracked VC channel ids where people can earn econ in
	 * @param {String} guildId
	 * @returns {Promise<[]>}
	 */
	getServerTracked = async (guildId) => {
		try {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.trackedChannelsIds
		} catch (e) {
			console.log(`Error in getServerTracked: ${e}`)
		}
	}

	/**
	 * Get the servers shop
	 * @param {String} guildId
	 * @returns {Promise<[]>}
	 */
	getServerShop = async (guildId) => {
		try {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.serverShop
		} catch (e) {
			console.log(`Error in getServerShop: ${e}`)
		}
	}

	/**
	 * Get the server log channel where it tracks the vc and econ transfers
	 * @param {String} guildId
	 * @returns {Promise<string>}
	 */
	getServerLogChannel = async (guildId) => {
		try {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.logChannelId
		} catch (e) {
			console.log(`Error in getServerLogChannel: ${e}`)
		}
	}

	/**
	 * Get the server ticket channel
	 * @param guildId{String}
	 * @returns {Promise<string>}
	 */
	getServerTicketChannel = async (guildId) => {
		try {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.ticketChannelId
		} catch (e) {
			console.log(`Error in getServerTicketChannel: ${e}`)
		}
	}

	/**
	 * Get the server config channel id
	 * @param guildId{String}
	 * @returns {Promise<string>}
	 */
	getServerConfigChannel = async (guildId) => {
		try {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.configChannelId
		} catch (e) {
			console.log(`Error in getServerConfigChannel: ${e}`)
		}
	}

	/**
	 * Get the server welcome channel id
	 * @param guildId{String}
	 * @returns {Promise<string>}
	 */
	getServerWelcomeChannel = async (guildId) => {
		try {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.welcomeChannelId
		} catch (e) {
			console.log(`Error in getServerWelcomeChannel: ${e}`)
		}
	}

	/**
	 * Get the names of the server badges
	 * @param {String} guildId - The ID of the guild
	 * @returns {Promise<string[]>} - An array of badge names
	 */
	getServerBadgesNames = async (guildId) => {
		try {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			let names = []
			for (const [key] of Object.entries(data.badges)) {
				names.push(key)
			}
			return names
		} catch (e) {
			console.log(`Error in getServerBadgesNames: ${e}`)
		}
	}

	/**
	 * Get the server badges
	 * @param {String} guildId - The ID of the guild
	 * @returns {Promise<Object>} - The badges object
	 */
	getServerBadges = async (guildId) => {
		try {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.badges
		} catch (e) {
			console.log(`Error in getServerBadges: ${e}`)
		}
	}

	/**
	 * Get the server profiles
	 * @param {String} guildId - The ID of the guild
	 * @returns {Promise<Object>} - The profiles object
	 */
	getServerProfiles = async (guildId) => {
		try {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.profiles
		} catch (e) {
			console.log(`Error in getServerProfiles: ${e}`)
		}
	}

	/**
	 * Get the server admin roles IDs
	 * @param {String} guildId - The ID of the guild
	 * @returns {Promise<string[]>} - An array of admin roles IDs
	 */
	getServerAdminRole = async (guildId) => {
		try {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.adminRolesId
		} catch (e) {
			console.log(`Error in getServerAdminRole: ${e}`)
		}
	}

	/**
	 * Get the room category ID where the rooms are created
	 * @param {String} guildId - The ID of the guild
	 * @returns {Promise<string>} - The room category ID
	 */
	getRoomCategory = async (guildId) => {
		try {
			const data = JSON.parse(await this.client.get(`${guildId}:config`))
			return data.roomCata
		} catch (e) {
			console.log(`Error in getRoomCategory: ${e}`)
		}
	}

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
	updateServerConfig = async (guildId, data) => {
		try {
			let config = JSON.parse(await this.client.get(`${guildId}:config`))
			for (const key in data) {
				config[key] = data[key]
			}
			await this.client.set(`${guildId}:config`, JSON.stringify(config))
		} catch (e) {
			console.log(`Error updating server config: ${e}`)
		}
	}

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
	addPrivateChannel = async (guildId, userId, channelId, roomInfo) => {
		try {
			let data = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
			data.privateChannels.push(channelId)
			await this.client.hset(`${guildId}:users`, userId, JSON.stringify(data))
			await this.client.hset(
				`${guildId}:privateChannels`,
				channelId,
				JSON.stringify(roomInfo),
			)
		} catch (e) {
			console.log(`Error adding a private channel: ${e}`)
		}
	}

	/**
	 * Adds a new channel ID to the list of tracked channels for the specified guild.
	 * @param {string} guildId - The ID of the guild.
	 * @param {string} channelId - The ID of the channel to add to the tracked channels list.
	 * @returns {Promise<void>} - A Promise that resolves when the channel has been added.
	 */
	addTrackedChannel = async (guildId, channelId) => {
		try {
			let data = JSON.parse(await this.client.get(`${guildId}:config`))
			data.trackedChannelsIds.push(channelId)
			await this.client.set(`${guildId}:config`, JSON.stringify(data))
		} catch (e) {
			console.log(`Error adding a tracked channel: ${e}`)
		}
	}

	/**
	 * Retrieves the server leaderboard for the specified guild.
	 * @param {string} guildId - The ID of the guild.
	 * @param {string} [type='econ'] - The type of leaderboard to retrieve, defaults to 'econ'.
	 *                                 Possible values: 'econ', 'messages', 'hoursVC'.
	 * @returns {Promise<Object[]>} - An array of user objects representing the leaderboard.
	 */
	getServerLeaderboard = async (guildId, type = 'econ') => {
		try {
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
			return leaderboard
				.sort((a, b) => a.amount - b.amount)
				.slice(0, 10)
				.reverse()
		} catch (e) {
			console.log(`Error getting server leaderboard: ${e}`)
		}
	}
}

export const guildActions = new GuildClass()
