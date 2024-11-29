import { Client, Collection, Events, GatewayIntentBits, REST } from 'discord.js'
import 'dotenv/config'
import Redis from 'ioredis'
import { guildActions } from './actions/guildActions.js'
import EventRegister from './register/eventRegister.js'
import CommandRegister from './register/commandRegister.js'
import { userActions } from './actions/userActions.js'
import { roomsActions } from './actions/roomsActions.js'
import { startWorker } from './images/creator.js'
import { timerManager } from './classes/timerManager.js'

async function main() {
	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.MessageContent,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildPresences,
			GatewayIntentBits.GuildVoiceStates,
		],
	})

	const connection = new Redis(process.env.REDIS_URL)

	await guildActions.initialize(connection)
	await userActions.initialize(connection)
	await roomsActions.initialize(connection)
	await timerManager.initialize(connection)

	await startWorker()
	const commandHandler = new CommandRegister(client)
	await commandHandler.loadCommands()
	commandHandler.setupInteractionHandler()

	const eventHandler = new EventRegister(client)
	await eventHandler.loadEvents()

	try {
		await client.login(
			process.env.NODE_ENV === 'development'
				? process.env.TEST_BOT_TOKEN
				: process.env.BOT_TOKEN,
		)

		console.log('Bot is running!')
	} catch (error) {
		console.log('Login error:', error)
	}
}

await main()
