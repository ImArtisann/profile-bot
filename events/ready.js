import { Events } from 'discord.js'
import { errorHandler } from '../handlers/errorHandler.js'

export const name = Events.ClientReady
export const once = true

export const execute = errorHandler('On Bot Ready')(async function(client) {
	console.log(`Ready! Logged in as ${client.user.tag}`)
})
