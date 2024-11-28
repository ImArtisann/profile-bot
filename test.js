import 'dotenv/config'
import fs from 'fs'
import { videoPoker } from './handlers/videoPokerHandler.js'

async function test() {
	let image = await videoPoker.startGame('0', '100', '100')
	fs.writeFileSync('test.png', image.buffer)
}

await test()
