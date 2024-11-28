import { guildActions } from './guildActions.js'
import { userActions } from './userActions.js'
import { ChannelType, PermissionsBitField } from 'discord.js'
import { timerManager } from '../classes/timerManager.js'
import { actionHelper } from '../classes/actionsHelper.js'
import { embedHelper } from '../classes/embedHelper.js'

class RoomsClass {
	constructor() {
		this.client = null
	}

	async initialize(client) {
		this.client = client
	}

	/**
	 * Creates a new room for the specified guild and user.
	 *
	 * @param {object} guild - The guild object for which the room is being created.
	 * @param {string} userId - The ID of the user creating the room.
	 * @param {object} roomData - The data for the new room.
	 * @param {string} roomData.name - The name of the room
	 * @param {string} roomData.createdAt - When the room was created
	 * @param {string} roomData.owner - The owner of the room
	 * @param {Array} roomData.members - The members in the room
	 * @param {number} roomData.rentTime - The rent time for the room
	 * @param {number} roomData.roomBalance - The room's balance
	 * @returns {Promise<boolean>} - Returns false if the user does not have enough funds to rent the room, or if the room data contains a `time` property.
	 */
	async createRoom(guild, userId, roomData) {
		try {
			const rent = await guildActions.getServerRent(guild.id)
			const userEcon = await userActions.getUserEcon(guild.id, userId)

			if (userEcon < rent || roomData.rentTime * rent > userEcon) {
				return false
			} else {
				const cata = await guildActions.getRoomCategory(guild.id)
				await guild.channels
					.create({
						name: roomData.name,
						type: ChannelType.GuildVoice,
						parent: cata,
						permissionOverwrites: [
							{
								id: guild.roles.everyone.id,
								allow: [PermissionsBitField.Flags.ViewChannel],
								deny: [
									PermissionsBitField.Flags.Speak,
									PermissionsBitField.Flags.Connect,
								],
							},
							{
								id: userId,
								allow: [
									PermissionsBitField.Flags.ViewChannel,
									PermissionsBitField.Flags.Connect,
									PermissionsBitField.Flags.Speak,
									PermissionsBitField.Flags.Stream,
									PermissionsBitField.Flags.SendMessages,
									PermissionsBitField.Flags.UseApplicationCommands,
									PermissionsBitField.Flags.UseExternalEmojis,
									PermissionsBitField.Flags.EmbedLinks,
									PermissionsBitField.Flags.AttachFiles,
									PermissionsBitField.Flags.AddReactions,
									PermissionsBitField.Flags.ReadMessageHistory,
								],
							},
							{
								id: guild.client.user.id,
								allow: [
									PermissionsBitField.Flags.ViewChannel,
									PermissionsBitField.Flags.Connect,
									PermissionsBitField.Flags.Speak,
									PermissionsBitField.Flags.SendMessages,
									PermissionsBitField.Flags.ReadMessageHistory,
								],
							},
						],
					})
					.then(async (channel) => {
						roomData.roomBalance -= rent
						await this.client.hset(
							`${guild.id}:privateChannels`,
							channel.id,
							JSON.stringify(roomData),
						)
						await guildActions.addPrivateChannel(guild.id, userId, channel.id, roomData)
						await guildActions.addTrackedChannel(guild.id, channel.id)
						const embed = await embedHelper.roomStats(guild, channel.id)
						const actions = await actionHelper.createRoomActions(guild, channel.id)
						await channel.send({
							embeds: [embed],
							components: actions,
						})
						await timerManager.createTimer({
							name: `room:${channel.id}`,
							userId: channel.id,
							duration: roomData.rentTime * 86400000,
							callback: async () => {
								const room = await this.deductRent(guild.id, channel.id)
								if (room.roomBalance > 0) {
									await channel.send({
										embeds: [
											{
												title: 'Daily Rent',
												description: `Daily Rent deducted from your room balance. New Balance: ${room.roomBalance}`,
												color: 0xff0000,
											},
										],
									})
									timerManager.resetTimer(channel.id)
								} else {
									await channel.delete()
								}
							},
						})
						return true
					})
			}
		} catch (e) {
			console.log(`Error creating room: ${e}`)
		}
	}

	/**
	 * Deducts the daily rent from the specified room's balance.
	 * @param {object} guild - The ID of the guild the room belongs to.
	 * @param {string} roomId - The ID of the room to deduct rent from.
	 * @returns {Promise<Object>} The updated room data with the new balance.
	 */
	async deductRent(guild, roomId) {
		try {
			let room = JSON.parse(await this.client.hget(`${guild.id}:privateChannels`, roomId))
			const rent = await guildActions.getServerRent(guild.id)
			room.roomBalance -= rent
			await this.client.hset(`${guild.id}:privateChannels`, roomId, JSON.stringify(room))
			return room
		} catch (e) {
			console.log(`Error deduction room balance ${roomId} ${e}`)
		}
	}

	/**
	 * Deposits an amount of currency into a room's balance.
	 * @param {string} guildId - The ID of the guild the room belongs to.
	 * @param {string} roomId - The ID of the room to deposit the currency into.
	 * @param {string} userId - The ID of the user making the deposit.
	 * @param {number} amount - The amount of currency to deposit.
	 * @returns {Promise<boolean>} - Returns true if the deposit was successful, false otherwise.
	 */
	async deposit(guildId, roomId, userId, amount) {
		try {
			let room = JSON.parse(await this.client.hget(`${guildId}:privateChannels`, roomId))
			const userEcon = await userActions.getUserEcon(guildId, userId)
			if (userEcon < amount) {
				return false
			}
			room.roomBalance += userEcon
			await this.client.hset(`${guildId}:privateChannels`, roomId, JSON.stringify(room))
			await userActions.updateUserEcon(guildId, userId, Number(userEcon - amount))
			return true
		} catch (e) {
			console.log(`Error depositing to room balance ${e}`)
		}
	}

	/**
	 * Retrieves all the private channels (rooms) for the specified guild.
	 * @param {string} guildId - The ID of the guild to retrieve the rooms for.
	 * @returns {Promise<Array[string]>} An array of room IDs for the specified guild.
	 */
	async getServerRooms(guildId) {
		try {
			return this.client.hkeys(`${guildId}:privateChannels`)
		} catch (e) {
			console.log(`Error getting server rooms ${guildId} ${e}`)
		}
	}

	/**
	 * Invites a user to a room and grants them permissions.
	 * @param {Object} guild - The Discord guild object.
	 * @param {string} roomId - The ID of the room to invite the user to.
	 * @param {string} userId - The  user to invite to the room.
	 * @returns {Promise<boolean>} - Returns true if the user was successfully invited, false otherwise.
	 */
	async roomInvite(guild, roomId, userId) {
		try {
			let room = JSON.parse(await this.client.hget(`${guild.id}:privateChannels`, roomId))
			if (room.roomInvite.includes(userId)) {
				return false
			} else {
				room.members.push(userId)
				await guild.channels.fetch(roomId).channel.edit({
					permissionOverwrites: [
						{
							id: userId,
							allow: [
								PermissionsBitField.Flags.ViewChannel,
								PermissionsBitField.Flags.Connect,
								PermissionsBitField.Flags.Speak,
								PermissionsBitField.Flags.Stream,
								PermissionsBitField.Flags.SendMessages,
								PermissionsBitField.Flags.UseApplicationCommands,
								PermissionsBitField.Flags.UseExternalEmojis,
								PermissionsBitField.Flags.EmbedLinks,
								PermissionsBitField.Flags.AttachFiles,
								PermissionsBitField.Flags.AddReactions,
								PermissionsBitField.Flags.ReadMessageHistory,
							],
						},
					],
				})
				await this.client.hset(
					`${guild.id}:privateChannels`,
					roomId,
					JSON.stringify(room),
				)
				return true
			}
		} catch (e) {
			console.log(`Error inviting user to room ${roomId} ${e}`)
		}
	}

	/**
	 * Removes a user from a room and revokes their permissions.
	 * @param {Object} guild - The Discord guild object.
	 * @param {string} roomId - The ID of the room to kick the user from.
	 * @param {string} userId - The ID of the user to kick from the room.
	 * @returns {Promise<boolean>} - Returns true if the user was successfully kicked, false otherwise.
	 */
	async roomKick(guild, roomId, userId) {
		try {
			let room = JSON.parse(await this.client.hget(`${guild.id}:privateChannels`, roomId))
			if (room.members.includes(userId)) {
				room.members = room.members.filter((member) => member !== userId)
				await guild.channels.fetch(roomId).channel.edit({
					permissionOverwrites: [
						{
							id: userId,
							deny: [
								PermissionsBitField.Flags.ViewChannel,
								PermissionsBitField.Flags.Connect,
								PermissionsBitField.Flags.Speak,
								PermissionsBitField.Flags.Stream,
								PermissionsBitField.Flags.SendMessages,
								PermissionsBitField.Flags.UseApplicationCommands,
								PermissionsBitField.Flags.UseExternalEmojis,
								PermissionsBitField.Flags.EmbedLinks,
								PermissionsBitField.Flags.AttachFiles,
								PermissionsBitField.Flags.AddReactions,
								PermissionsBitField.Flags.ReadMessageHistory,
							],
						},
					],
				})
				await this.client.hset(
					`${guild.id}:privateChannels`,
					roomId,
					JSON.stringify(room),
				)
				return true
			} else {
				return false
			}
		} catch (e) {
			console.log(`Error kicking user from room ${roomId}: ${e}`)
		}
	}

	/**
	 * Retrieves the details of a private room in the Discord guild.
	 * @param {Object} guild - The Discord guild object.
	 * @param {string} roomId - The ID of the private room to retrieve.
	 * @returns {Promise<Object>} - The details of the private room.
	 */
	async getRoom(guild, roomId) {
		try {
			return JSON.parse(await this.client.hget(`${guild.id}:privateChannels`, roomId))
		} catch (e) {
			console.log(`Error getting rooms for ${guild.id}: ${e}`)
		}
	}

	/**
	 * Retrieves the status of a private room in the Discord guild, including room statistics and available actions.
	 * @param {Object} guild - The Discord guild object.
	 * @param {string} roomId - The ID of the private room to retrieve the status for.
	 * @returns {Promise<[EmbedHelper, Object]>} - An array containing the room statistics embed and the available room actions.
	 */
	async getRoomStatus(guild, roomId) {
		try {
			const embed = await embedHelper.roomStats(guild, roomId)
			const actions = actionHelper.createRoomActions(guild, roomId)
			return [embed, actions]
		} catch (e) {
			console.log(`Error getting room status: ${e}`)
		}
	}

	/**
	 * Retrieves the members of a private room in the Discord guild.
	 * @param {Object} guild - The Discord guild object.
	 * @param {string} roomId - The ID of the private room to retrieve the members for.
	 * @returns {Promise<Array>} - An array of the members in the private room.
	 */
	async getRoomMembers(guild, roomId) {
		try {
			const room = JSON.parse(
				await this.client.hget(`${guild.id}:privateChannels`, roomId),
			)
			return room.members
		} catch (e) {
			console.log('Error getting room members:', e)
		}
	}
}

export const roomsActions = new RoomsClass()
