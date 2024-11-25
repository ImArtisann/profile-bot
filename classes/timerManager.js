import Timer from './timer.js'

class TimerManager {
	constructor() {
		this.timers = new Map()
	}

	/**
	 * Creates a new timer instance and adds it to the timer collection
	 * @param {Object} config - The configuration object for the timer
	 * @param {string} config.name - Name of the timer
	 * @param {string} config.userId - ID of the user who created the timer
	 * @param {number} config.duration - Duration of the timer in mins
	 * @param {Function} [config.callback] - Optional callback function to be executed when the timer completes
	 * @param {string} [config.type='countdown'] - Type of timer (default is 'countdown')
	 * @returns {Timer} The newly created timer instance
	 */
	createTimer(config) {
		const timer = new Timer(
			config.duration,
			config.name,
			config.userId,
			config?.callback,
			config?.type,
		)
		this.timers.set(timer.id, timer)
		return timer
	}

	/**
	 * Retrieves a timer instance by its ID from the timer collection
	 * @param {string} id - The unique identifier of the timer to find
	 * @returns {Timer|undefined} The timer instance if found, undefined otherwise
	 */
	getTimerById(id) {
		return this.timers.get(id)
	}

	/**
	 * Retrieves all timer instances associated with a specific user
	 * @param {string} userId - The ID of the user to find timers for
	 * @returns {Timer[]} Array of timer instances belonging to the user
	 */
	getTimersByUserId(userId) {
		return Array.from(this.timers.values()).filter((timer) => timer.userId === userId)
	}

	/**
	 * Cancels and removes a timer from the collection by its ID
	 * @param {string} id - The unique identifier of the timer to cancel
	 * @returns {void}
	 */
	cancelTimer(id) {
		const timer = this.timers.get(id)
		if (timer) {
			clearTimeout(timer.timer)
			timer.clearIntervals()
			this.timers.delete(id)
		}
	}

	resetTimer(id) {
		const timer = this.timers.get(id)
		if (timer) {
			timer.reset()
		}
	}

	/**
	 * Cancels and removes all timers associated with a specific user
	 * @param {string} userId - The ID of the user whose timers should be cancelled
	 * @returns {void}
	 */
	cancelAllUserTimers(userId) {
		const timers = this.getTimersByUserId(userId)
		timers.forEach((timer) => {
			this.cancelTimer(timer.id)
		})
	}

	/**
	 * Exports all timers as an array of simplified timer objects
	 * @returns {Object[]} Array of timer objects containing id, name, userId, status, remainingTime, and duration
	 */
	exportTimers() {
		return Array.from(
			this.timers.values().map((timer) => ({
				id: timer.id,
				name: timer.name,
				userId: timer.userId,
				status: timer.status,
				remainingTime: timer.remainingTime,
				duration: timer.duration,
			})),
		)
	}
}

export const timerManager = new TimerManager()
