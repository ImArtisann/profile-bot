import Timer from './timer.js'
import { roomsActions } from '../actions/roomsActions.js'

class TimerManager {
	constructor() {
		this.timers = new Map()
		this.initializedGuilds = new Set()
		this.client = null
	}

	async initialize(client) {
		this.client = client
	}

	getTimerStorageKey(guildId) {
		return `${guildId}:activeTimers`
	}

	/**
	 * Saves the state of a timer to the database.
	 * @param {string} guildId - The ID of the guild the timer is associated with.
	 * @param {Timer} timer - The timer instance to save.
	 * @returns {Promise<void>} A promise that resolves when the timer state has been saved.
	 */
	async saveTimerState(guildId, timer) {
		const timerState = {
			id: timer.id,
			name: timer.name,
			userId: timer.userId,
			duration: timer.duration,
			remainingTime: timer.remainingTime,
			startTime: timer.startTime,
			status: timer.status,
			type: timer.type,
			guildId: guildId,
		}

		// Add callback type and necessary data based on timer name
		if (timer.name.startsWith('room:')) {
			timerState.callbackType = 'roomRentCallback'
		} else if (timer.name.startsWith('reminder:')) {
			timerState.callbackType = 'reminderCallback'
			// Extract channel and reminder text from the timer name
			// Assuming format: reminder:{channelId}:{reminder text}
			const [_, channelId, ...reminderParts] = timer.name.split(':')
			timerState.reminderData = {
				channelId,
				reminder: reminderParts.join(':'), // Rejoin in case reminder text had colons
			}
		}

		await this.client.hset(
			this.getTimerStorageKey(guildId),
			timer.id,
			JSON.stringify(timerState),
		)
	}

	async setTimerToRunning(guildId, timerId) {
		const timer = this.timers.get(`${guildId}:${timerId}`)
		if (timer) {
			timer.status = 'running'
			timer.startTime = Date.now()
			await this.saveTimerState(guildId, timer)
		}
	}

	/**
	 * Creates a new timer instance and adds it to the timer collection
	 * @param {string} guildId - The ID of the guild the timer is associated with
	 * @param {Object} config - The configuration object for the timer
	 * @param {string} config.name - Name of the timer
	 * @param {string} config.userId - ID of the user who created the timer
	 * @param {number} config.duration - Duration of the timer in mins
	 * @param {Function} [config.callback] - Optional callback function to be executed when the timer completes
	 * @param {string} [config.type='countdown'] - Type of timer (default is 'countdown')
	 * @param {Object} [config.reminderData] - Optional data for reminder timers
	 * @param {number} [config.remainingTime] - the remaining time for the timer
	 * @returns {Promise<Timer>} The newly created timer instance
	 */
	async createTimer(guildId, config) {
		let timerName = config.name

		// For reminder timers, construct the name to include necessary data
		if (config.reminderData) {
			timerName = `reminder:${config.reminderData.channelId}:${config.reminderData.reminder}`
		}

		const timer = new Timer(
			config.duration,
			timerName,
			config.userId,
			config?.callback,
			config?.type,
			config?.remainingTime,
		)

		const timerKey = `${guildId}:${timer.id}`
		this.timers.set(timerKey, timer)
		await this.saveTimerState(guildId, timer)
		return timer
	}

	/**
	 * Retrieves a timer instance by its ID from the timer collection
	 * @param {string} guildId - The guild ID
	 * @param {string} timerId - The unique identifier of the timer
	 * @returns {Timer|undefined} The timer instance if found, undefined otherwise
	 */
	getTimerById(guildId, timerId) {
		return this.timers.get(`${guildId}:${timerId}`)
	}

	/**
	 * Retrieves all timer instances associated with a specific user
	 * @param {string} userId - The ID of the user to find timers for
	 * @param {string} guildId - The guild ID
	 * @returns {Timer[]} Array of timer instances belonging to the user
	 */
	getTimersByUserId(guildId, userId) {
		const guildPrefix = `${guildId}:`
		return Array.from(this.timers.entries())
			.filter(([key, timer]) => key.startsWith(guildPrefix) && timer.userId === userId)
			.map(([_, timer]) => timer)
	}

	/**
	 * Retrieves a callback function that handles the deduction of room rent for a specific guild.
	 * The callback function is executed when a timer associated with the room rent deduction completes.
	 * @param {Object} guild - The guild object for which the room rent is being deducted.
	 * @returns {Function} - An asynchronous callback function that deducts the room rent and handles the result.
	 */
	getRoomRentCallback(guild) {
		return async (timer) => {
			try {
				const channelId = timer.userId
				const room = await roomsActions.deductRent(guild, channelId)
				if (room.roomBalance > 0) {
					const channel = await guild.channels.fetch(channelId)
					await channel.send({
						embeds: [
							{
								title: 'Daily Rent',
								description: `Daily Rent deducted from your room balance. New Balance: ${room.roomBalance}`,
								color: 0xff0000,
							},
						],
					})
					let timer = this.getTimersByUserId(guild.id, channelId)
					await this.resetTimer(guild.id, timer[0].id)
				} else {
					const channel = await guild.channels.fetch(channelId)
					await channel.delete()
					await this.cancelTimer(guild.id, timer.id)
				}
			} catch (e) {
				console.log(`Error deducting rent: ${e}`)
			}
		}
	}

	/**
	 * Sends a reminder message to a user in a specific channel.
	 * @param {Object} guild - The guild object where the reminder is being sent.
	 * @param {string} channelId - The ID of the channel where the reminder is being sent.
	 * @param {string} userId - The ID of the user receiving the reminder.
	 * @param {string} reminder - The text of the reminder message.
	 * @returns {Promise<void>} - A promise that resolves when the reminder message is sent.
	 */
	async getReminderCallback(guild, channelId, userId, reminder) {
		return async (timer) => {
			try {
				const channel = await guild.channels.fetch(channelId)
				await channel.send({
					embeds: [
						{
							title: 'Reminder',
							description: `Hey <@${userId}>, dont forget to ${reminder}!`,
							color: 0xff0000,
						},
					],
				})
				await this.cancelTimer(guild.id, timer.id)
			} catch (e) {
				console.log(`Error sending reminder: ${e}`)
			}
		}
	}

	/**
	 * Initializes the timers for a specific guild by loading any saved timers from storage and recreating them.
	 * @param {Object} guild - The guild object to initialize the timers for.
	 * @returns {Promise<void>} - A promise that resolves when the timers have been initialized.
	 */
	async initializeGuildTimers(guild) {
		if (this.initializedGuilds.has(guild.id)) return

		try {
			const storageKey = this.getTimerStorageKey(guild.id)
			const savedTimers = await this.client.hgetall(storageKey)

			if (!savedTimers) {
				this.initializedGuilds.add(guild.id)
				return
			}

			for (const [timerId, timerStateJson] of Object.entries(savedTimers)) {
				const timerState = JSON.parse(timerStateJson)

				// Calculate remaining time
				let remainingTime = timerState.remainingTime
				if (timerState.startTime && timerState.status === 'running') {
					const elapsedTime = (Date.now() - timerState.startTime) / 60000
					remainingTime = Math.max(0, timerState.remainingTime - elapsedTime)
				}

				// Skip and delete if timer has expired
				if (remainingTime <= 0) {
					await this.client.hdel(storageKey, timerId)
					continue
				}

				// Recreate callback based on type
				let callback = null
				let config = {
					name: timerState.name,
					userId: timerState.userId,
					duration: timerState.duration,
					type: timerState.type,
					remainingTime: remainingTime,
				}

				if (timerState.callbackType === 'roomRentCallback') {
					try {
						const channelId = timerState.name.split(':')[1]
						const channel = await guild.channels.fetch(channelId)
						if (!channel) {
							await this.client.hdel(storageKey, timerId)
							continue
						}
						callback = this.getRoomRentCallback(guild)
					} catch (e) {
						await this.client.hdel(storageKey, timerId)
						continue
					}
				} else if (timerState.callbackType === 'reminderCallback') {
					const { channelId, reminder } = timerState.reminderData
					try {
						const channel = await guild.channels.fetch(channelId)
						if (!channel) {
							await this.client.hdel(storageKey, timerId)
							continue
						}
						callback = await this.getReminderCallback(
							guild,
							channelId,
							timerState.userId,
							reminder,
						)
						config.reminderData = { channelId, reminder }
					} catch (e) {
						await this.client.hdel(storageKey, timerId)
						continue
					}
				}

				config.callback = callback

				// Create new timer
				const timer = await this.createTimer(guild.id, config)

				// Delete old timer data after successful creation
				await this.client.hdel(storageKey, timerId)

				// Start if it was running
				if (timerState.status === 'running') {
					timer.start()
					await this.setTimerToRunning(guild.id, timer.id)
				}
			}

			this.initializedGuilds.add(guild.id)
		} catch (error) {
			console.error(`Error initializing timers for guild ${guild.id}:`, error)
		}
	}

	async createReminderTimer(guild, channelId, userId, reminder, duration) {
		return this.createTimer(guild.id, {
			name: `reminder:${channelId}:${reminder}`,
			userId: userId,
			duration: duration,
			callback: await this.getReminderCallback(guild, channelId, userId, reminder),
			reminderData: {
				channelId,
				reminder,
			},
		})
	}

	/**
	 * Initializes timers for all guilds the client is a member of.
	 * @param {Object} client - The Discord client instance.
	 * @returns {Promise<void>}
	 */
	async initializeAllGuilds(client) {
		for (const guild of client.guilds.cache.values()) {
			await this.initializeGuildTimers(guild)
		}
	}

	/**
	 * Retrieves all timer instances associated with a specific guild
	 * @param {string} guildId - The ID of the guild to find timers for
	 * @returns {Timer[]} Array of timer instances belonging to the guild
	 */
	getTimersByGuild(guildId) {
		const guildPrefix = `${guildId}:`
		return Array.from(this.timers.entries())
			.filter(([key]) => key.startsWith(guildPrefix))
			.map(([_, timer]) => timer)
	}

	/**
	 * Cancels and removes a timer from the collection by its ID
	 * @param {string} guildId - The ID of the guild to find timers for
	 * @param {string} timerId - The unique identifier of the timer to cancel
	 * @returns {void}
	 */
	async cancelTimer(guildId, timerId) {
		const timerKey = `${guildId}:${timerId}`
		const timer = this.timers.get(timerKey)
		if (timer) {
			clearTimeout(timer.timer)
			timer.clearIntervals()
			this.timers.delete(timerKey)
			await this.client.hdel(this.getTimerStorageKey(guildId), timerId)
		}
	}

	/**
	 * Cancels and removes all timers associated with a specific guild
	 * @param {string} guildId - The ID of the guild whose timers should be cancelled
	 * @returns {Promise<void>}
	 */
	async cancelAllGuildTimers(guildId) {
		const guildTimers = this.getTimersByGuild(guildId)
		for (const timer of guildTimers) {
			await this.cancelTimer(guildId, timer.id)
		}
	}

	/**
	 * Resets and restarts a timer associated with a specific guild and timer ID.
	 * @param {string} guildId - The ID of the guild the timer belongs to.
	 * @param {string} timerId - The unique identifier of the timer to reset.
	 * @returns {Promise<void>}
	 */
	async resetTimer(guildId, timerId) {
		const timerKey = `${guildId}:${timerId}`
		const timer = this.timers.get(timerKey)
		if (timer) {
			timer.reset()
			timer.start()
			await this.saveTimerState(guildId, timer)
		} else {
			console.log(`Timer ${timerId} not found in guild ${guildId}`)
		}
	}

	// For cleanup purposes
	async removeGuild(guildId) {
		await this.cancelAllGuildTimers(guildId)
		await this.client.del(this.getTimerStorageKey(guildId))
		this.initializedGuilds.delete(guildId)
	}
}

export const timerManager = new TimerManager()
