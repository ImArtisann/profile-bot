class towerHandler {
	constructor() {
		this.games = new Map()
	}

	async startGamer(userId, bet, mode, userEcon, interaction) {
		try {
			let gameState = {
				bet: Number(bet),
				userEcon: Number(userEcon),
				gameOver: false,
				mode: mode,
				mines: [],
				passed: 0,
			}
		} catch (e) {
			console.log(`Error in tower start game: ${e}`)
		}
	}

	async generateMineSpaces(mode) {
		for (let i = 0; i <= mode; ++i) {}
	}
}

export const tower = new towerHandler()
