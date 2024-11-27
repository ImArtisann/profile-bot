import 'dotenv/config'
import { highOrLower } from './handlers/holHandler.js'
import fs from 'fs'

async function test(guildId, userId) {
	let image = await highOrLower.startGame('0', '100', '100')
	fs.writeFileSync('test.png', image)
}

await test()
