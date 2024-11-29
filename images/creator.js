import { Worker } from 'worker_threads'
import { fileURLToPath } from 'url'
import path from 'path'

export let creatorWorker

export async function startWorker() {
	const workerPath = path.join(
		path.dirname(fileURLToPath(import.meta.url)),
		'creator.worker.js',
	)

	// Create new worker instance
	creatorWorker = new Worker(workerPath, {
		type: 'module',
	})

	// Return a promise that resolves when worker is ready
	return new Promise((resolve, reject) => {
		creatorWorker.on('error', (error) => {
			console.error(`Worker error: ${error}`)
			reject(error)
		})

		creatorWorker.on('exit', (code) => {
			if (code !== 0) {
				console.error(`Worker stopped with exit code ${code}`)
				startWorker()
			}
		})

		creatorWorker.on('online', () => {
			console.log('Worker is online and ready')
			resolve(creatorWorker)
		})
	})
}
