import { Client as client, Events } from 'discord.js'
import { guildActions } from '../actions/guildActions.js'
import { errorHandler } from '../handlers/errorHandler.js'
import { timerManager } from '../classes/timerManager.js'

export const name = Events.GuildCreate
export const once = false

export const execute = errorHandler('Event Guild Joined')(async function (guild) {
	await guildActions.createServer(guild)
	await timerManager.initializeGuildTimers(guild)
})
