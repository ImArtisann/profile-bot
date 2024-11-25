import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = dirname(dirname(fileURLToPath(import.meta.url)))

class EventHandler {
	/**
	 * Create a new CommandHandler
	 * @param {Client<Boolean>} client - The Discord client
	 */
	constructor(client) {
		this.client = client
		this.eventsPath = path.join(__dirname, 'events')
	}

	/**
	 * Loads all event handlers from the 'events' directory.
	 * This method reads all JavaScript files in the 'events' directory, imports them, and registers the event handlers with the Discord client.
	 * It handles both one-time ('once') and recurring ('on') events.
	 */
	async loadEvents() {
		const eventFiles = fs
			.readdirSync(this.eventsPath)
			.filter((file) => file.endsWith('.js'))

		for (const file of eventFiles) {
			const filePath = path.join(this.eventsPath, file)
			try {
				const eventModule = await import(pathToFileURL(filePath))

				// Destructure event details with default fallbacks
				const { name, once = false, execute } = eventModule.default || eventModule

				if (!name || !execute) {
					console.warn(`Skipping invalid event in ${file}`)
					continue
				}

				// Use a method to handle both once and on events
				this._registerEvent(name, execute, once)
			} catch (error) {
				console.error(`Error loading event from ${file}:`, error)
			}
		}
	}

	/**
	 * Registers an event handler with the Discord client.
	 * @param {import(discord.js).Events} eventName - The discord.js event name ie Events.MessageCreate
	 * @param {Function} executeFunction - The function to execute when the event is triggered.
	 * @param {boolean} [isOnce=false] - Whether the event should only be listened for once.
	 */
	_registerEvent(eventName, executeFunction, isOnce = false) {
		if (isOnce) {
			this.client.once(eventName, executeFunction)
		} else {
			this.client.on(eventName, executeFunction)
		}
	}
}

export default EventHandler
