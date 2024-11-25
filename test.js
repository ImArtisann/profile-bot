import { blackJack } from './handlers/blackJackHandler.js'

async function test() {
	await blackJack.startGame('123456789', 20)
}

await test()
