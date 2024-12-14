import 'dotenv/config'
import fs from 'fs'
import { videoPoker } from './handlers/videoPokerHandler.js'

async function test(startTime) {
	const elapsedtime = Date.now() - startTime
	console.log(`Elapsed time: ${elapsedtime}`)
}

await test(1733181187911)
