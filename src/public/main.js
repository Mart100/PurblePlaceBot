const socket = io()
let lastScreenshotResponse = false

let canvas, ctx, video

let cake = {}
let allText = {}
let lastMouseClick = { x: 0, y: 0 }
let allPixelReads = []
let hoverPixelRead = null
let settings = { difficulty: '' }
let mousePos = { x: 0, y: 0 }
let belt = []

$(() => {
	console.log('START')

	socket.on('getPixel', (pixel) => {
		let replace = allPixelReads.find(p => p.x == pixel.x && p.y == pixel.y)
		if(replace) {
			let idx = allPixelReads.indexOf(replace)
			allPixelReads[idx] = pixel
		}
		else allPixelReads.push(pixel)
	})

	socket.on('text', (data) => {
		allText[data.id] = data.text
	})

	socket.on('cake', (data) => {
		console.log(data)
		cake = data
		setCakeDescription(cake)
	})

	socket.on('beltStatus', (data) => {
		belt = data
		console.log(data)
	})

	socket.on('cakeSlice', (slices) => {

		$('#cakeslices').html('')

		console.log(slices)

		for(let i = 0; i < slices.length; i++) {
			let s = slices[i]
			let sliceDiv = $('<div></div>').css('background-color', `rgb(${s[0].R}, ${s[0].G}, ${s[0].B})`).css('flex', `${s[1]} 0 auto`)
			$('#cakeslices').append(sliceDiv)
		}
	})

	socket.on('mouseClick', (data) => {
		lastMouseClick = data
	})

	socket.on('start', (s) => {
		settings = s
		$('#difficulty').html(`Mode: ${settings.difficulty}`)
	})

	let timerInterval = null
	socket.on('speedrunStatus', (status) => {

		let html = ``
		
		let startTime = status.start

		html += `<div class="timer"></div><br>`
		if(timerInterval) clearInterval(timerInterval)
		timerInterval = setInterval(() => {
			let time = Date.now() - startTime
			if(status.finished) time = status.finished
			$('.timer').html(`${(time/1000)}s`)
		}, 1)

		let cakes = status.cakes
		for(let i = 0; i < cakes.length; i++) {
			let cake = cakes[i]
			let layers = cake.layers

			if(cake.finished) {
				html += `<div class="s">Cake ${i+1}: <span class="n">${cake.finished/1000}</span></div>`
				continue
			}
			else html += `<div>Cake ${i+1}:</div>`

			html += `<div class="cake">`

			if(settings.difficulty == 'beginner') {
				if(cake.layers[0].shape) html += `<div class="s">Shape: <span class="n">${cake.layers[0].shape/1000}</span></div>`
				else html += `<div>Shape</div>`
				if(cake.layers[0].cakeMix) html += `<div class="s">Cake Mix: <span class="n">${cake.layers[0].cakeMix/1000}</span></div>`
				else html += `<div>Cake Mix</div>`
				if(cake.frosting) html += `<div class="s">Frosting: <span class="n">${cake.frosting/1000}</span></div>`
				else html += `<div>Frosting</div>`
			} 
			
			else if (settings.difficulty == 'advanced') {

				for(let j = 0; j < layers.length; j++) {
					let layer = layers[j]

					let collapse = false

					if(typeof layer.filling == 'number') collapse = layer.filling
					if(layer.filling == undefined && typeof layer.cakeMix == 'number') collapse = layer.cakeMix

					if(collapse) html += `<div class="s">Layer ${j+1}: <span class="n">${collapse/1000}</span></div>`
					else {
						html += `<div>Layer ${j+1}:</div>`
						html += `<div class="layer">`
						if(layer.shape) html += `<div class="s">Shape: <span class="n">${layer.shape/1000}</span></div>`
						else html += `<div>Shape</div>`
						if(layer.cakeMix) html += `<div class="s">Cake Mix: <span class="n">${layer.cakeMix/1000}</span></div>`
						else html += `<div>Cake Mix</div>`
						if(layer.filling) html += `<div class="s">Filling: <span class="n">${layer.filling/1000}</span></div>`
						else if(layer.filling == false) html += `<div>Filling</div>`
						html += `</div>`
					}
				}

				if(cake.frosting) html += `<div class="s">Frosting: <span class="n">${cake.frosting/1000}</span></div>`
				else if(cake.frosting == false) html += `<div>Frosting</div>`
			}

			if(cake.topping) html += `<div class="s">Topping: <span class="n">${cake.topping/1000}</span></div>`
			else html += `<div>Topping</div>`

			html += `</div>`

		}

		$('#speedrunStatus').html(html)
	})

	video = document.getElementById('video')
	canvas = document.getElementById('canvas')
	ctx = canvas.getContext('2d')
	ctx.imageSmoothingEnabled = false

	canvas.width = 800 + 16
	canvas.height = 568 + 10

	//requestScreenshot()
	startCapture()
	buttonListener()
	frame()
})

function buttonListener() {

	let restartCooldown = Date.now()
	$('button#restart').click(() => {
		if(Date.now() - restartCooldown < 1000) return

		console.log('restarting...')
		socket.emit('restart')
		restartCooldown = Date.now()
		allPixelReads = []
		$('#speedrunStatus').html('')
		$('#cake').html('')
		$('#cakeslices').html('')
	})

	$('#canvas').on("mousemove", (e) => {

		let rect = e.target.getBoundingClientRect()
		let x = Math.round(e.clientX - rect.left)
		let y = Math.round(e.clientY - rect.top)

		if(x < 5 || x > canvas.width-5 || y < 5 || y > canvas.height-5) {
			mousePos = null
			return
		}

		mousePos = { x, y }

		let hover = allPixelReads.find(p => Math.abs(p.x-x) < 2 && Math.abs(p.y-y) < 2)

		if(hover) {
			hoverPixelRead = hover
		} else {
			hoverPixelRead = null
		}
	})

	$('#canvas').on("click", (e) => {
		let rect = e.target.getBoundingClientRect()
		let x = Math.round(e.clientX - rect.left)
		let y = Math.round(e.clientY - rect.top)
		console.log(x, y)

		let hover = allPixelReads.find(p => Math.abs(p.x-x) < 2 && Math.abs(p.y-y) < 2)
		if(hover) {
			console.log(hover)
			$('#colorclick').html(`x: ${hover.x}, y: ${hover.y}`)
			$('#colorclick').css('background-color', `${hover.color}}`)
		}

		else {
			socket.emit('requestPixelColor', { x, y }, (data) => {
				console.log(data)
				let c = data.color
				$('#colorclick').html(`x: ${data.x}, y: ${data.y}`)
				$('#colorclick').css('background-color', `rgba(${c.R}, ${c.G}, ${c.B}, ${c.A})`)
			})
		}


	})
}

function setCakeDescription(cake) {
	$('#cake').html('')

	$('#cake').append(`<span>Topping: ${cake.topping}</span><br>`)
	$('#cake').append(`<span>Shape: ${cake.shape}</span><br>`)
	$('#cake').append(`<span>Frosting: ${cake.frosting}</span><br>`)
	$('#cake').append(`<span>Sprinkled: ${cake.sprinkled}</span><br>`)
	$('#cake').append(`<span>Fired: ${cake.fired ? true : false}</span><br>`)

	if(settings.difficulty == 'beginner') $('#cake').append(`<span>Cake Mix: ${cake.layers[0].cakeMix}</span><br>`)
	else if (settings.difficulty == 'advanced') {
		for(let i=0;i<cake.layers.length;i++) {
			$('#cake').append(`<span>Layer ${i+1}:</span><br>`)
			$('#cake').append(`<span>
				- Cake Mix: ${cake.layers[i].cakeMix}<br>
				${cake.layers[i].filling ? `- Filling: ${cake.layers[i].filling}<br>` : ''}
			</span>`)
		}
	}

	
}

function frame() {

	let height = canvas.height
	let width = canvas.width

	// request next frame
	requestAnimationFrame(frame)

	ctx.imageSmoothingEnabled = false
	ctx.clearRect(0, 0, canvas.width, canvas.height)



	// draw window status text on canvas
	if(allText['windowError']) {

		// red background
		ctx.fillStyle = 'red'
		ctx.fillRect(0, height/2 - 30, width, 60)

		ctx.fillStyle = 'white'
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		ctx.fillStyle = 'black'
		ctx.font = '15px Arial'
		ctx.fillText(allText['windowError'], width/2, height/2)
	}

	if(allText['shape']) {
		ctx.textAlign = 'left'
		ctx.fillStyle = 'rgb(0, 255, 0)'
		ctx.font = '25px Arial'
		ctx.fillText(allText['shape'], 20, 65)
	}
	
	allPixelReads.forEach((pixel) => {
		drawColorDetector(pixel.x, pixel.y)
	})

	ctx.globalAlpha = 1
	ctx.lineWidth = 1


	if(lastMouseClick) { // draw circle at last mouse click
		ctx.strokeStyle = 'black'
		ctx.beginPath()
		ctx.arc(lastMouseClick.x-2, lastMouseClick.y-2, 4, 0, 2 * Math.PI)
		ctx.fill()
	}

	if(hoverPixelRead) {
		ctx.fillStyle = hoverPixelRead.color
		ctx.strokeStyle = 'black'
		ctx.beginPath()
		ctx.rect(hoverPixelRead.x-5, hoverPixelRead.y-5, 10, 10)
		ctx.fill()
		ctx.stroke()

	}

	if(mousePos) {

		let vidX = (mousePos.x-8) - 2
		let vidY = (mousePos.y) - 3
		ctx.drawImage(video, vidX, vidY, 5, 5, mousePos.x+20, mousePos.y+20, 50, 50)
		
		// draw pixel grid
		ctx.beginPath()
		ctx.lineWidth = 1
		ctx.globalAlpha = 1
		ctx.strokeStyle = 'black'

		//ctx.rect(mousePos.x+20, mousePos.y+20, 50, 50)

		// horizontal lines
		let px = mousePos.x+20
		let py = mousePos.y+20
		ctx.moveTo(px, py+20)
		ctx.lineTo(px+50, py+20)
		ctx.moveTo(px, py+30)
		ctx.lineTo(px+50, py+30)

		// vertical lines
		ctx.moveTo(px+20, py)
		ctx.lineTo(px+20, py+50)
		ctx.moveTo(px+30, py)
		ctx.lineTo(px+30, py+50)

		ctx.stroke()


		// draw pos text
		ctx.fillStyle = 'black'
		ctx.font = '15px Arial'
		ctx.textAlign = 'right'
		ctx.textBaseline = 'bottom'
		ctx.fillText(`${mousePos.x}, ${mousePos.y}`, width, height-10)
	}


	// draw belt status
	if(belt && belt.length == 8) {

		ctx.fillStyle = 'black'
		ctx.font = '15px Arial'
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		ctx.strokeStyle = 'white'
		
		for(let i = 0; i < 8; i++) {

			ctx.beginPath()

			let posX = 50 + (i * 100) - 100
			let posY = 250

			let item = belt[i]

			if(i == 0) {
				posX = 50
				posY = 210
			}

			ctx.fillStyle = 'black'
			ctx.fillRect(posX-10, posY-10, 20, 20)


			// draw layer 1
			if(item && item.layers[0].filling) {
				ctx.fillStyle = 'blue'
				ctx.fillRect(posX-10, posY-15, 20, 5)
			}

			// draw layer 2
			if(item && item.layers[1].filling) {
				ctx.fillStyle = 'green'
				ctx.fillRect(posX-10, posY-20, 20, 5)
			}

			// draw layer 3
			if(item && item.layers[2].cakeMix) {
				ctx.fillStyle = 'red'
				ctx.fillRect(posX-10, posY-25, 20, 5)
			}

			ctx.fillStyle = 'white'
			let text = ''
			if(item == null) text = '-'
			else text = `${item.id}`
			//console.log(i, item)
			ctx.fillText(text, posX, posY)

		}
	}
	
}

function drawColorDetector(x, y) {
	ctx.globalAlpha = 1
	ctx.strokeStyle = 'black'
	ctx.lineWidth = 1
	ctx.rect(x-1.5, y-1.5, 2, 2)
	ctx.stroke()
}

function requestScreenshot() {
	$.ajax({
		type: 'GET',
		url: '/screenshot', 
		xhrFields: {
      responseType: 'blob'
		},
		success: (data) => {

			if(data.size == 0) {
				setTimeout(() => { requestScreenshot() }, 1000)
				return
			}
		
			const url = window.URL || window.webkitURL
      const src = url.createObjectURL(data)

			//$('canvas').css('background-image', 'url(' + src + ')')
			$('#bg').attr('src', src)
	
			requestScreenshot()
		},
		error: (err) => {
			console.log(err)
			setTimeout(() => { requestScreenshot() }, 1000)
		}
	})
}