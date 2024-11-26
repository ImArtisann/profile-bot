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
	async createServer(guild) {
		await this.client.set(`${guild.id}:config`, JSON.stringify(this.guildData))
		let members = await guild.members.fetch()
		for (const [memberId, member] of members) {
			if (!member.user.bot) {
				await this.addMember(guild.id, memberId)
			}
		}
	}

	/**
	 * Add a user to the servers db
	 * @param {String|import('discord.js').Snowflake} guildId
	 * @param {String|import('discord.js').Snowflake} userId
	 * @returns {Promise<void>}
	 */
	async addMember(guildId, userId) {
		await this.client.hset(`${guildId}:users`, userId, JSON.stringify(this.userData))
	}

	/**
	 * Get the servers rent per day in coins for a private VC
	 * @param {String} guildId
	 * @returns {Promise<number>}
	 */
	async getServerRent(guildId) {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.roomRent
	}

	/**
	 * Get the servers econ rate for each min in a tracked VC
	 * @param {String} guildId
	 * @returns {Promise<[]>} - 0 - messages, 1 - VCMins
	 */
	async getServerRate(guildId) {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.econRate
	}

	/**
	 * Get the servers experience rate [Messages, VCMins]
	 * @param {String} guildId
	 * @returns {Promise<number[]>}
	 */
	async getServerExperienceRate(guildId) {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.experienceRate
	}

	/**
	 * Get the tracked VC channel ids where people can earn econ in
	 * @param {String} guildId
	 * @returns {Promise<[]>}
	 */
	async getServerTracked(guildId) {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.trackedChannelsIds
	}

	/**
	 * Get the servers shop
	 * @param {String} guildId
	 * @returns {Promise<[]>}
	 */
	async getServerShop(guildId) {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.serverShop
	}

	/**
	 * Get the server log channel where it tracks the vc and econ transfers
	 * @param {String} guildId
	 * @returns {Promise<string>}
	 */
	async getServerLogChannel(guildId) {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.logChannelId
	}

	/**
	 * Get the server ticket channel
	 * @param guildId{String}
	 * @returns {Promise<string>}
	 */
	async getServerTicketChannel(guildId) {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.ticketChannelId
	}

	/**
	 * Get the server config channel id
	 * @param guildId{String}
	 * @returns {Promise<string>}
	 */
	async getServerConfigChannel(guildId) {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.configChannelId
	}

	/**
	 * Get the server welcome channel id
	 * @param guildId{String}
	 * @returns {Promise<string>}
	 */
	async getServerWelcomeChannel(guildId) {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.welcomeChannelId
	}

	/**
	 * Get the names of the server badges
	 * @param {String} guildId - The ID of the guild
	 * @returns {Promise<string[]>} - An array of badge names
	 */
	async getServerBadgesNames(guildId) {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		let names = []
		for (const key in data.badges) {
			names.push(data.badges[key])
		}
		return names
	}

	/**
	 * Get the server badges
	 * @param {String} guildId - The ID of the guild
	 * @returns {Promise<Object>} - The badges object
	 */
	async getServerBadges(guildId) {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.badges
	}

	/**
	 * Get the server profiles
	 * @param {String} guildId - The ID of the guild
	 * @returns {Promise<Object>} - The profiles object
	 */
	async getServerProfiles(guildId) {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.profiles
	}

	/**
	 * Get the server admin roles IDs
	 * @param {String} guildId - The ID of the guild
	 * @returns {Promise<string[]>} - An array of admin roles IDs
	 */
	async getServerAdminRole(guildId) {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.adminRolesId
	}

	/**
	 * Get the room category ID where the rooms are created
	 * @param {String} guildId - The ID of the guild
	 * @returns {Promise<string>} - The room category ID
	 */
	async getRoomCategory(guildId) {
		const data = JSON.parse(await this.client.get(`${guildId}:config`))
		return data.roomCata
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
	async updateServerConfig(guildId, data) {
		let config = JSON.parse(await this.client.get(`${guildId}:config`))
		for (const key in data) {
			config[key] = data[key]
		}
		await this.client.set(`${guildId}:config`, JSON.stringify(config))
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
	async addPrivateChannel(guildId, userId, channelId, roomInfo) {
		let data = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
		data.privateChannels.push(channelId)
		await this.client.hset(`${guildId}:users`, userId, JSON.stringify(data))
		await this.client.hset(
			`${guildId}:privateChannels`,
			channelId,
			JSON.stringify(roomInfo),
		)
	}

	async addTrackedChannel(guildId, channelId) {
		let data = JSON.parse(await this.client.get(`${guildId}:config`))
		data.trackedChannelsIds.push(channelId)
		await this.client.set(`${guildId}:config`, JSON.stringify(data))
	}

	/**
	 * update the private channel balance
	 * @param guildId{String} the guild id
	 * @param channelId{String} the channel id to update
	 * @param change{number} the amount to add or remove
	 * @param add{Boolean} default true
	 * @returns {Promise<void>}
	 */
	async updatePrivateChannelBalance(guildId, channelId, change, add = true) {
		let data = JSON.parse(await this.client.hget(`${guildId}:privateChannels`, channelId))
		data.balance = add ? data.balance + change : data.balance - change
		await this.client.hset(`${guildId}:privateChannels`, channelId, JSON.stringify(data))
	}

	/**
	 * update the private channel members
	 * @param guildId{String} the guild id
	 * @param channelId{String} the channel id to update
	 * @param userId{String} the user id to add or remove
	 * @param add{Boolean} default true
	 * @returns {Promise<void>}
	 */
	async updatePrivateChannelMembers(guildId, channelId, userId, add = true) {
		let data = JSON.parse(await this.client.hget(`${guildId}:privateChannels`, channelId))
		data.members = add
			? data.members.push(userId)
			: data.members.filter((id) => id !== userId)
		await this.client.hset(`${guildId}:privateChannels`, channelId, JSON.stringify(data))
	}

	/**
	 * Retrieves the server leaderboard for the specified guild.
	 * @param {string} guildId - The ID of the guild.
	 * @param {string} [type='econ'] - The type of leaderboard to retrieve, defaults to 'econ'.
	 *                                 Possible values: 'econ', 'messages', 'hoursVC'.
	 * @returns {Promise<Object[]>} - An array of user objects representing the leaderboard.
	 */
	async getServerLeaderboard(guildId, type = 'econ') {
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
	}
}

export const guildActions = new GuildClass()
