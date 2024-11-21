class GuildClass {
    constructor() {
        this.client = null;
        this.guildData = {
            roomRent: 150,
            econRate: 1,
            experienceRate: [.2,1],
            adminRolesId: [""],
            logChannelId: "",
            welcomeChannelId: "",
            ticketChannelId: "",
            configChannelId: "",
            trackedChannelsIds: [],
            serverShop: [],
            badges: [],
        };
        this.userData = {
            hp: 4,
            mood: 4,
            focus: 4,
            mana: 4,
            level: "???",
            class: "???",
            timezone: "America/Los_Angeles",
            timestamp: "",
            badges: [],
            econ: 0,
            hoursVC: 0,
            messages: 0,
            privateChannels: [],
            tasks: [],
            mainQuest: {},
        };
    }

    /**
     * Initialize the class with the redis client
     * @param {import('ioredis').Redis} client Redis client instance
     */
    async initialize(client) {
        this.client = client;
    }

    /**
     * When the bot joins the server create the entry in the database for the servers config
     * and create a db for all the users that are in that server
     * @param {import('discord.js').Guild} guild
     */
    async createServer(guild){
        await this.client.set(`${guild.id}:config`, JSON.stringify(this.guildData))
        let members = await guild.members.fetch()
        for (const [memberId, member] of members) {
            if (!member.user.bot) {
                await this.addMember(guild.id, memberId);
            }
        }
    }

    /**
     * Add a user to the servers db
     * @param {String|import('discord.js').Snowflake} guildId
     * @param {String|import('discord.js').Snowflake} userId
     * @returns {Promise<void>}
     */
    async addMember(guildId, userId){
        await this.client.hset(`${guildId}:users`, userId, JSON.stringify(this.userData));
    }

    /**
     * Get the user profile data for creating the image
     * @param guildId
     * @param userId
     * @returns {Promise<{
     * badges: ([]|any),
     * econ: (number),
     * mood: (number),
     * mana: (number),
     * level: (string),
     * timezone: (string),
     * hp: (number),
     * focus: (number),
     * class: (string)}>}
     */
    async getUserProfile(guildId, userId){
        const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        return {
            hp: data.hp,
            mood: data.mood,
            focus: data.focus,
            mana: data.mana,
            level: data.level,
            class: data.class,
            timezone: data.timezone,
            badges: data.badges,
            econ: data.econ,
        }
    }

    /**
     * Get the users econ in the guild
     * @param {String} guildId - guild id
     * @param {String} userId - user id
     * @returns {Promise<number>}
     */
    async getUserEcon(guildId, userId){
        const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        return data.econ;
    }

    /**
     * Get the users private vc they own
     * @param {String} guildId - guild id
     * @param {String} userId - user id
     * @returns {Promise<[]>}
     */
    async getUserPrivateChannels(guildId, userId){
        const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        return data.privateChannels;
    }

    /**
     * Update a users econ either add or remove econ
     * @param {String} guildId - guild id
     * @param {String} userId - user id
     * @param {Number} econ - amount of econ to add or remove
     * @param {Boolean} add - default is true
     * @returns {Promise<void>}
     */
    async updateUserEcon(guildId, userId, econ, add = true) {
        let data = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        data.econ = add ? data.econ + econ : data.econ - econ;
        await this.client.hset(`${guildId}:users`, userId, JSON.stringify(data));
    }

    /**
     * Update the users profile data
     * @param {String} guildId - guild id
     * @param {String} userId - user id
     * @param {Array} data - data to update
     * @param {Number} [data.hp] - health
     * @param {Number} [data.mood] - mood
     * @param {Number} [data.focus] - focus
     * @param {Number} [data.mana] - mana
     * @param {Number} [data.level] - level
     * @param {String} [data.class] - class
     * @param {String} [data.timezone] - user timezone
     * @param {Array} [data.badges] - user badges earned
     * @param {Number} [data.econ] - user econ
     * @returns {Promise<void>}
     */
    async updateUserProfile(guildId, userId, data){
        let userData = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        for (const key in data) {
            userData[key] = data[key]
        }
        await this.client.hset(`${guildId}:users`, userId, JSON.stringify(userData));
    }

    /**
     * Update the users vc hours
     * @param {String} guildId - guild id
     * @param {String} userId - user id
     * @param {Number} hours - amount of hours to add
     * @returns {Promise<void>}
     */
    async updateUserVCHours(guildId, userId, hours) {
        let userData = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        userData.hoursVC += hours;
        await this.client.hset(`${guildId}:users`, userId, JSON.stringify(userData));
    }

    /**
     * Increment the users message count
     * @param {String} guildId - guild id
     * @param {String} userId - user id
     * @returns {Promise<void>}
     */
    async incrementUserMessageCount(guildId, userId) {
        let userData = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        userData.messages ++;
        await this.client.hset(`${guildId}:users`, userId, JSON.stringify(userData));
    }

    /**
     * Get the servers rent per day in coins for a private VC
     * @param {String} guildId
     * @returns {Promise<number>}
     */
    async getServerRent(guildId){
        const data = JSON.parse(await this.client.get(`${guildId}:config`));
        return data.roomRent;
    }

    /**
     * Get the servers econ rate for each min in a tracked VC
     * @param {String} guildId
     * @returns {Promise<number>}
     */
    async getServerRate(guildId){
        const data = JSON.parse(await this.client.get(`${guildId}:config`))
        return data.econRate
    }

    /**
     * Get the servers experience rate [Messages, VCMins]
     * @param {String} guildId
     * @returns {Promise<number[]>}
     */
    async getServerExperienceRate(guildId){
        const data = JSON.parse(await this.client.get(`${guildId}:config`))
        return data.experienceRate
    }

    /**
     * Get the tracked VC channel ids where people can earn econ in
     * @param {String} guildId
     * @returns {Promise<[]>}
     */
    async getServerTracked(guildId){
        const data = JSON.parse(await this.client.get(`${guildId}:config`))
        return data.trackedChannelsIds
    }

    /**
     * Get the servers shop
     * @param {String} guildId
     * @returns {Promise<[]>}
     */
    async getServerShop(guildId){
        const data = JSON.parse(await this.client.get(`${guildId}:config`))
        return data.serverShop
    }

    /**
     * Get the server log channel where it tracks the vc and econ transfers
     * @param {String} guildId
     * @returns {Promise<string>}
     */
    async getServerLogChannel(guildId){
        const data = JSON.parse(await this.client.get(`${guildId}:config`))
        return data.logChannelId
    }

    /**
     * Get the server ticket channel
     * @param guildId{String}
     * @returns {Promise<string>}
     */
    async getServerTicketChannel(guildId){
        const data = JSON.parse(await this.client.get(`${guildId}:config`))
        return data.ticketChannelId
    }

    /**
     * Get the server config channel id
     * @param guildId{String}
     * @returns {Promise<string>}
     */
    async getServerConfigChannel(guildId){
        const data = JSON.parse(await this.client.get(`${guildId}:config`))
        return data.configChannelId
    }

    /**
     * Get the server welcome channel id
     * @param guildId{String}
     * @returns {Promise<string>}
     */
    async getServerWelcomeChannel(guildId){
        const data = JSON.parse(await this.client.get(`${guildId}:config`))
        return data.welcomeChannelId
    }

    /**
     * update the server config
     * @param {String} guildId
     * @param {Object} data
     * @param {Number} [data.roomRent] - The rent per day in coins
     * @param {Number} [data.econRate] - The econ rate per min
     * @param {Array} [data.experienceRate] - The experience rate per message
     * @param {Array} [data.trackedChannelsIds] - The tracked channels ids
     * @param {Array} [data.serverShop] - The server shop
     * @param {Array} [data.logChannelId] - The log channel id
     * @param {string} [data.ticketChannelId] - The ticket channel id
     * @param {string} [data.configChannelId] - The config channel id
     * @param {string} [data.welcomeChannelId] - The welcome channel id
     * @returns {Promise<void>}
     */
    async updateServerConfig(guildId, data){
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
    async addPrivateChannel(guildId, userId, channelId, roomInfo){
        let data = JSON.parse(await this.client.hget(`${guildId}:users`, userId))
        data.privateChannels.push(channelId)
        await this.client.hset(`${guildId}:users`, userId, JSON.stringify(data))
        await this.client.hset(`${guildId}:privateChannels`, channelId, JSON.stringify(roomInfo))
    }

    /**
     * update the private channel balance
     * @param guildId{String} the guild id
     * @param channelId{String} the channel id to update
     * @param change{Number} the amount to add or remove
     * @param add{Boolean} default true
     * @returns {Promise<void>}
     */
    async updatePrivateChannelBalance(guildId, channelId, change, add = true){
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
    async updatePrivateChannelMembers(guildId, channelId, userId, add = true){
        let data = JSON.parse(await this.client.hget(`${guildId}:privateChannels`, channelId))
        data.members = add ? data.members.push(userId) : data.members.filter(id => id !== userId)
        await this.client.hset(`${guildId}:privateChannels`, channelId, JSON.stringify(data))
    }

}

export const guildActions = new GuildClass();