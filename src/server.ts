import express from 'express'
const app = express()
import http from 'http'
const server = http.createServer(app)
import { Server, Socket } from 'socket.io'
import * as ai from './ai'
import { BeltItem, SpeedrunStatus } from './types'
const io = new Server(server)

export let userSocket:null|Socket = null

app.use(express.static(__dirname + '/public'))

io.on('connection', (socket) => {
	userSocket = socket
  console.log('A user connected')

	socket.on('restart', () => {
		ai.restart()
	})

	socket.on('requestPixelColor', async (data, callback) => {
		
		await ai.refocus()
		await ai.sleep(100)
		let color = await ai.getColor(data.x, data.y)
		callback({ x: data.x, y: data.y, color })
	})
})

server.listen(3000, () => {
	console.log('Server started on port 3000')
})

app.get('/screenshot', async (req, res) => {
	let success = await ai.takeScreenshot()
	if(success) {
		res.sendFile(__dirname + '\\screenshot.jpg')
	}
	else res.send(null)
})

export async function sendText(id: string, text: string) {
	if(userSocket) userSocket.emit('text', { id, text })
}

export async function sendSpeedrunStatus(status: SpeedrunStatus) {
	if(userSocket) userSocket.emit('speedrunStatus', status)
}

export async function sendBeltStatus(belt:BeltItem[]) {
	if(userSocket) userSocket.emit('beltStatus', belt)
}

export async function sendMouseClick(x: number, y: number) {
	if(userSocket) userSocket.emit('mouseClick', { x, y })
}