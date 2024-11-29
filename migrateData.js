import { MongoClient } from 'mongodb'
import 'dotenv/config'
import Redis from 'ioredis'
import { userActions } from './actions/userActions.js'
import fs from 'fs'

async function migrateData() {
	const connection = new Redis(process.env.REDIS_URL)
	await userActions.initialize(connection)
	let data = fs.readFileSync('./econ.json')
	data = JSON.parse(data)
	for (const [user, econ] of Object.entries(data)) {
		console.log(`User ${user} econ: ${econ}`)
		await userActions.updateUserProfile('1242915877632999445', user, {
			econ: Number(econ),
		})
	}
	// let data = {
	// 	hp: 4,
	// 	mood: 4,
	// 	focus: 4,
	// 	mana: 4,
	// 	level: '???',
	// 	class: '???',
	// 	timezone: 'America/Los_Angeles',
	// 	timestamp: '',
	// 	vcJoined: '',
	// 	badges: [],
	// 	econ: 100,
	// 	hoursVC: 0,
	// 	messages: 0,
	// 	privateChannels: [],
	// 	tasks: [],
	// 	mainQuest: {},
	// 	profileImage: '',
	// }
	// for (const user of allUsers) {
	// 	const { _id, ...rest } = user
	// 	data['badges'] = []
	// 	for (const key in rest) {
	// 		if (key === 'wendigo') {
	// 			if (rest[key] === true) {
	// 				data['badges'].push('wendigo')
	// 			}
	// 		} else if (key === 'abyssal') {
	// 			if (rest[key] === true) {
	// 				data['badges'].push('abyssal')
	// 			}
	// 		} else if (key === 'chart' || key === 'motivation') {
	// 		} else {
	// 			data[key] = rest[key]
	// 		}
	// 	}
	//
	// 	console.log(`user: ${_id} data:`, JSON.stringify(data, null, 2))
	// }
}

await migrateData()
