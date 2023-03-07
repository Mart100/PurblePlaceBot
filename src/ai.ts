import { mouse, getActiveWindow, Point, keyboard, Key, Window, Region, screen, saveImage, Button, Image, RGBA, imageResource } from '@nut-tree/nut-js'
import { actionBeltPos, buttonLocations, cakeAnalyzePos, cakeColors, cakePosOffset } from './config'
import { sendBeltStatus, sendMouseClick, sendSpeedrunStatus, sendText, userSocket } from './server'
import { Cake, Shape, CakeMix, Frosting, Topping, CakeStatus, SpeedrunStatus, LayerStatus, Mode, ButtonLocations, Filling, BeltItem, CakeAnalyzePos, Effect, BeltItemCake, Action } from './types'

let belt : BeltItem[] = []
let difficulty : Mode = 'beginner'
let paused = true
let cake: Cake|null = null
let speedrunStatus : SpeedrunStatus = {
	cakes: [],
	start: 0,
	finished: false
}

let window: Window
let region: Region


// wait till the burple window is active
let waiting = setInterval(async () => {
	const windowRef = await getActiveWindow()
	const [title, reg] = await Promise.all([windowRef.title, windowRef.region])
	if(title == 'Purble Place') {
		if(!window) {
			window = windowRef
			region = reg
			if(region.width == 816 && region.height == 578) {
				init()
			} else {
				//console.log('Purble Place window is not the right size. Please resize it to 816x578')
				sendText('windowError', 'Purble Place window is not the right size. Please resize it to 816x578')
			}
		} else {
			window = windowRef
			region = reg
			paused = false
		}
		sendText('windowError', '')
	}
	else if(title == 'Purble Place New Game') {}
	else if(title == 'Game Won') {
		if(speedrunStatus.finished == 0 && speedrunStatus.start != 0) gameWon()
	}
	else {
		sendText('windowError', `Waiting for Purble Place to be active. Current window is: ${title}`)
		paused = true
	}
}, 100)

export async function init() {
	//logMouseInfo()
	//startNewGame()
}


export async function startNewGame() {
	console.log('Starting new game')

	difficulty = await getDifficulty()

	if(userSocket) userSocket.emit('start', { difficulty })
	
	await keyboard.type(Key.F2)
	await sleep(100)
	let title = await getWindowTitle()
	console.log('YOOOO: ', title)
	if(title == 'Game Won') {
		await keyboard.type(Key.Enter)
	}
	if(title == 'Purble Place New Game') {
		await keyboard.type(Key.Enter)
	}

	await sleep(1000)
	makeNextCake(0)
}

export async function makeNextCake(cakeNum: number) {

	// wait for shape to appear
	await waitForColor(71, 163, '#d3bfdbff', false)
	console.log(`CAKE: ${cakeNum}`)
	paused = false

	if(speedrunStatus.start == 0) speedrunStatus.start = Date.now()

	cake = await analyzeCake()
	if(!cake) return
	console.log(cake)
	userSocket?.emit('cake', cake)

	//if(1 + 1 == 2) return
	

	if(difficulty == 'beginner') {

		speedrunStatus.cakes[cakeNum] = { layers: [{ shape: false, cakeMix: false }], topping: false, frosting: false, finished: false }

		await clickShapeMaker(cake.shape)
		updateSpeedrunStatus(speedrunStatus.cakes[cakeNum].layers[0], 'shape')
		await nextButton()
		await clickCakeMixMaker(cake.layers[0].cakeMix)
		updateSpeedrunStatus(speedrunStatus.cakes[cakeNum].layers[0], 'cakeMix')
		await nextButton()
		await clickFrostingMaker(cake.frosting!)
		updateSpeedrunStatus(speedrunStatus.cakes[cakeNum], 'frosting')
		await nextButton()
		await clickToppingMaker(cake.topping)
		updateSpeedrunStatus(speedrunStatus.cakes[cakeNum], 'topping')
		await nextButton()
		await sleep(140)
		await nextButton()
		updateSpeedrunStatus(speedrunStatus.cakes[cakeNum], 'finished')
	}

	else if(difficulty == 'advanced') {

		createBelt()

		let working = true
		while (working) {

			await checkActions()

			let focusCake = belt.slice().reverse().find(item => item != null && item.layers[2].cakeMix == false)
			if(!focusCake) focusCake = belt.slice().reverse().find(item => item != null)
			if(!focusCake) return

			let focusCakeIdx = belt.indexOf(focusCake)
			
			let nextAction = getNextAction(focusCake)
			console.log(`NEXT ACTION: ${nextAction}`)

			if(Date.now() - lastButton < 550) await sleep(550 - (Date.now() - lastButton))

			let button: 'next'|'previous' = 'next'

			if(focusCakeIdx > actionBeltPos[nextAction]) button = 'previous'
			else if(focusCakeIdx < actionBeltPos[nextAction]) button = 'next'

			if(focusCakeIdx == 4 && belt[3] != null && getNextAction(belt[3]) == 'filling') button = 'next'

			if(button == 'next') await nextButton()
			else await previousButton()
			
			console.log('YOOOO')

			// let preferredDirections = { previous: 0, next: 0, total: 0 }
			// for(let i = 0; i < belt.length; i++) {
			// 	let item = belt[i]
			// 	if(item == null) continue
			// 	if(preferredDirections.total >= 3) break
			// 	let nextAction = getNextAction(item)
			// 	if(i > actionBeltPos[nextAction]) preferredDirections.previous++
			// 	else if(i < actionBeltPos[nextAction]) preferredDirections.next++
			// 	preferredDirections.total++
			// }

			// if(Date.now() - lastButton < 600) await sleep(600 - (Date.now() - lastButton))

			// if(preferredDirections.previous >= preferredDirections.next) await previousButton()
			// else await nextButton()



			// speedrunStatus.cakes[cakeNum] = { layers: [], topping: false, frosting: false, finished: false }
			// for(let i = 0; i < cake.layers.length; i++) speedrunStatus.cakes[cakeNum].layers.push({ shape: false, cakeMix: false, filling: false })

			// for(let i = 0; i < cake.layers.length; i++) {
			// 	let layer = cake.layers[i]
			// 	console.log(`LAYER: ${i}`)
			// 	//await clickShapeMaker(cake.shape)
			// 	await checkActions()
			// 	updateSpeedrunStatus(speedrunStatus.cakes[cakeNum].layers[i], 'shape')
			// 	startBeltSpawning()
			// 	await nextButton()
			// 	//await clickCakeMixMaker(layer.cakeMix)
			// 	await checkActions()
			// 	updateSpeedrunStatus(speedrunStatus.cakes[cakeNum].layers[i], 'cakeMix')
			// 	await nextButton()
			// 	if(layer.filling) {
			// 		//await clickFillingMaker(layer.filling)
			// 		await checkActions()
			// 		updateSpeedrunStatus(speedrunStatus.cakes[cakeNum].layers[i], 'filling')
			// 		await previousButton()
			// 		await sleep(140)
			// 		await previousButton()
			// 	}
			// }

			// await sleep(140)
			// await nextButton()

			// if(cake.frosting) {
			// 	//await clickFrostingMaker(cake.frosting)
			// 	await checkActions()
			// 	updateSpeedrunStatus(speedrunStatus.cakes[cakeNum], 'frosting')
			// 	await nextButton()
			// } else {
			// 	await sleep(140)
			// 	await nextButton()
			// }

			// await checkActions()
			// //await clickToppingMaker(cake.topping)
			// updateSpeedrunStatus(speedrunStatus.cakes[cakeNum], 'topping')

			// await nextButton()

			// await checkActions()
			// // if (cake.sprinkled) await clickEffectMaker('sprinkles')
			// // if (cake.fired) await clickEffectMaker('fire')
			// // if (!cake.sprinkled && !cake.fired) await sleep(140)
			
			// await nextButton()

			// updateSpeedrunStatus(speedrunStatus.cakes[cakeNum], 'finished')

			// await sleep(500)

			if(paused) return

		}
	}

	if(!paused) {
		await sleep(500)

		if(cakeNum != 4) makeNextCake(cakeNum + 1)
	}
}

function getNextAction(beltCake: BeltItemCake) : Action {

	let cakeLayer = 0
	if(beltCake.layers[0].shape) cakeLayer = 1
	if(beltCake.layers[1].shape) cakeLayer = 2
	if(beltCake.layers[2].shape) cakeLayer = 3
	if(beltCake.layers[2].cakeMix) cakeLayer = 4

	if(cakeLayer == 0) return 'shape'
	else if(cakeLayer < 4) {
		if(!beltCake.layers[cakeLayer-1].cakeMix) return 'cakeMix'
		else if(!beltCake.layers[cakeLayer-1].filling) return 'filling'
		else return 'shape'
	}
	else {
		if(beltCake.frosting == false) return 'frosting'
		else if(!beltCake.topping) return 'topping'
		else if(beltCake.sprinkled == false || beltCake.fired == false) 'effect'
		return 'finish'
	}
	
}

async function checkActions() {

	if(paused) return
	if(!cake) return

	for(let i = 0; i < belt.length; i++) {
		let item = belt[i]
		if(item == null) continue


		if(i == 2) {
			let needsAction = false
			if(!item.layers[0].shape) needsAction = true
			if(!item.layers[1].shape && item.layers[0].cakeMix && item.layers[0].filling != false) needsAction = true
			if(!item.layers[2].shape && item.layers[1].cakeMix && item.layers[1].filling != false) needsAction = true
			if(needsAction) {
				await clickShapeMaker(cake.shape)
				let layer = item.layers.findIndex(l => l.shape == false)!
				item.layers[layer].shape = true
				updateSpeedrunStatus(speedrunStatus.cakes[item.id-1].layers[layer], 'shape')
			}
		}

		if(i == 3) {
			let needsActionLayer = null
			if(!item.layers[0].cakeMix && item.layers[0].shape) needsActionLayer = 0
			if(!item.layers[1].cakeMix && item.layers[1].shape) needsActionLayer = 1
			if(!item.layers[2].cakeMix && item.layers[2].shape) needsActionLayer = 2
			if(needsActionLayer != null) {
				await clickCakeMixMaker(cake.layers[needsActionLayer].cakeMix)
				item.layers[needsActionLayer].cakeMix = true
				updateSpeedrunStatus(speedrunStatus.cakes[item.id-1].layers[needsActionLayer], 'cakeMix')
			}
		}

		if(i == 4) {
			let needsActionLayer = null
			if(item.layers[0].filling == false && item.layers[0].cakeMix) needsActionLayer = 0
			if(item.layers[1].filling == false && item.layers[1].cakeMix) needsActionLayer = 1
			if(item.layers[2].filling == false && item.layers[2].cakeMix) needsActionLayer = 2
			if(needsActionLayer != null) {
				await clickFillingMaker(cake.layers[needsActionLayer].filling!)
				item.layers[needsActionLayer].filling = true
				updateSpeedrunStatus(speedrunStatus.cakes[item.id-1].layers[needsActionLayer], 'filling')
			}
		}

		if(i == 5) {
			let needsAction = false
			if(item.frosting == false && item.layers[2].cakeMix) needsAction = true
			if(needsAction) {
				await clickFrostingMaker(cake.frosting!)
				item.frosting = true
				updateSpeedrunStatus(speedrunStatus.cakes[item.id-1], 'frosting')
			}
		}

		if(i == 6) {
			if(!item.topping && item.layers[2].cakeMix) {
				await clickToppingMaker(cake.topping)
				item.topping = true
				updateSpeedrunStatus(speedrunStatus.cakes[item.id-1], 'topping')
			}
		}

		if(i == 7) {
			console.log(item)
			if(item.sprinkled == false) {
				await clickEffectMaker('sprinkles')
				item.sprinkled = true
			}
			if(item.fired == false) {
				await clickEffectMaker('fire')
				item.fired = true
			}
		}

	}
}

let cakeId = 1
function createBelt() {
	cakeId = 1
	belt = []
	for(let i = 0; i < 8; i++) belt.push(null)
	addNewBeltItemCake(2)
}


async function analyzeCake() {

	let cake: Cake = {
		layers: [],
		topping: 'gummies',
		shape: 'square',
	}

	if(difficulty == 'beginner') {
		let shape = await calculateShape()
		cake.shape = shape
		let props = await Promise.all([getCakeMix(shape, 0), getFrostingEasy(shape), getTopping(shape, true)])
		cake.layers.push({ cakeMix: props[0] })
		cake.frosting = props[1]
		cake.topping = props[2]
	}

	else if(difficulty == 'advanced') {

		let shape = await calculateShape()
		cake.shape = shape

		//let slices = await analyzeCakeSlice()
		// slices.reverse()
		// if(slices.length != 6) return console.error('Not enough slices detected') 
		// for(let i = 0; i < 6; i += 2) {
		// 	let mix = colorMostLike2(slices[i], 'cakeMix')
		// 	let filling = colorMostLike2(slices[i + 1], 'filling') as Filling|undefined
		// 	if(i == 4) filling = undefined

		// 	cake.layers.push({ cakeMix: mix as CakeMix, filling: filling })
		// }
		// cake.frosting = colorMostLike2(slices[5], 'cakeMix') as Frosting
		
		for(let i = 0; i < 2; i++) {
			let props = await Promise.all([getCakeMix(shape, i), getFilling(shape, i)])
			cake.layers.push({ cakeMix: props[0], filling: props[1] })
		}

		cake.layers.push({ cakeMix: await getCakeMix(shape, 2) })

		let frosting = await getFrostingAdvanced(shape)
		if(frosting) {
			cake.frosting = frosting
			let fired = await getIsFired(shape, frosting)
			cake.fired = fired
		}

		cake.topping = await getTopping(shape, frosting != undefined)
		cake.sprinkled = await getIsSprinkled(shape, frosting != undefined)
	}


	return cake
}

async function analyzeCakeSlice() : Promise<RGBA[]> {

	let relativeSliceRegion = new Region(71, 80, 1, 110)
	let sliceRegion = new Region(
		relativeSliceRegion.left + region.left,
		relativeSliceRegion.top + region.top, 
		relativeSliceRegion.width, 
		relativeSliceRegion.height)
	let cakeSlice = await screen.grabRegion(sliceRegion)
	let pixels = (await cakeSlice.toRGB()).data

	let getPixelRGBA = (i: number) => { 
		return new RGBA(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3])
	}

	let colorStreaks: [RGBA, RGBA[], number][] = [[getPixelRGBA(0), [getPixelRGBA(0)], 0]]

	let colorPallette: RGBA[] = Object.values(cakeColors.cakeMix).concat(Object.values(cakeColors.filling))
	colorPallette.push(new RGBA(201, 181, 212, 1)) // background
	colorPallette.push(new RGBA(157, 114, 95, 1)) // lighter brown

	for(let i = 4; i < pixels.length-4; i += 4) {
		let pixel0 = getPixelRGBA(i - 4)
		let pixel1 = getPixelRGBA(i)
		let pixel2 = getPixelRGBA(i + 4)
		let avg = colorAverage([pixel0, pixel1, pixel2])

		let diffUp = colorDistance(pixel1, pixel0)
		let diffDown = colorDistance(pixel1, pixel2)
		if(diffUp+diffDown > 4000) continue

		let c = colorMostLike(avg, colorPallette)
		colorStreaks.push([c.color, [c.color], 1])
	}


	// // remove lone colors
	// for(let i = 2; i < colorStreaks.length-2; i++) {
	// 	let color0 = colorStreaks[i - 1]
	// 	let color1 = colorStreaks[i]
	// 	let color2 = colorStreaks[i + 1]

	// 	let avg = colorAverage([color0[0], color1[0], color2[0]])
	// 	let diff = colorDistance(color1[0], avg)

	// 	if(diff > 4000) {
	// 		colorStreaks.splice(i, 1)
	// 		i--
	// 		continue
	// 	}
	// }

	// // combine same colors
	for(let i = 0; i < colorStreaks.length-1; i++) {
		let color0 = colorStreaks[i]
		let color1 = colorStreaks[i + 1]

		let diff = colorDistance(color0[0], color1[0])
		if(diff == 0) {
			color0[1].concat(color1[1])
			color0[2] += color1[2]
			colorStreaks.splice(i + 1, 1)
			i--
			continue
		}
	}

	colorStreaks = colorStreaks.filter(c => c[2] > 2)

	// // combine colors
	// for(let i = 1; i < colorStreaks.length-1; i++) {
	// 	let color0 = colorStreaks[i - 1]
	// 	let color1 = colorStreaks[i]
	// 	let color2 = colorStreaks[i + 1]

	// 	let diffUp = colorDistance(color1[0], color2[0])
	// 	let diffDown = colorDistance(color1[0], color0[0])
		
	// 	let dir = diffUp < diffDown ? 'up' : 'down' as 'up' | 'down'

	// 	let colorJoin = dir == 'up' ? color2 : color0
	// 	let colorDiff = dir == 'up' ? diffUp : diffDown

	// 	console.log(colorDiff)
	// 	if(color1[2] > 5 && colorDiff > 2000) continue

	// 	let joint = color1[1].concat(colorJoin[1])
	// 	colorStreaks.splice(dir == 'up' ? i : i - 1, 2, [colorAverage(joint), joint, color1[2] + colorJoin[2]])
	// 	i--
	// 	console.log('JOINED')
	// }

	// map to [color, count]
	let differingColors = colorStreaks.map(c => [c[0], c[2]]) as [RGBA, number][]

	let filteredColors = differingColors.slice(differingColors.length - 7, differingColors.length - 1)
	
	if(userSocket) userSocket.emit('cakeSlice', filteredColors)

	return filteredColors.map(c => c[0])
}

async function updateSpeedrunStatus(val: CakeStatus|LayerStatus, key: 'shape'|'cakeMix'|'frosting'|'filling'|'topping'|'finished') {
	let time = Date.now() - speedrunStatus.start
	if(key == 'topping') (val as CakeStatus).topping = time
	else if(key == 'finished') (val as CakeStatus).finished = time
	else if(key == 'frosting') (val as CakeStatus).frosting = time
	else (val as LayerStatus)[key] = time
	sendSpeedrunStatus(speedrunStatus)
}

async function gameWon() {
	speedrunStatus.finished = Date.now() - speedrunStatus.start
	sendSpeedrunStatus(speedrunStatus)
}

async function getWindowTitle() {
	const windowRef = await getActiveWindow()
	return await windowRef.title
}

let lastButton = Date.now()

async function nextButton() {
	return new Promise(async resolve => {
		//await clickPos(280, 480)
		if(paused) return resolve(false)
		await keyboard.type(Key.E)

		console.log('NEXT BUTTON')

		if(difficulty == 'advanced') {

			belt.unshift(null)
			let last = belt.pop()
			sendBeltStatus(belt)

			lastButton = Date.now()
			if(last != null) {
				if(belt[7] != null) lastButton = Date.now() + 1300
				updateSpeedrunStatus(speedrunStatus.cakes[last.id-1], 'finished')
			}

			await sleep(410)
			resolve(true)
	
			// belt pos 0
			let c1 = await getColor(60, 230)
			if(colorDistance(c1, new RGBA(230, 230, 230, 1)) < 1000 && belt[0] == null) addNewBeltItemCake(0)
	
			// belt pos 1
			let c2 = await getColor(60, 300)
			if(colorDistance(c2, new RGBA(230, 230, 230, 1)) < 1000 && belt[1] == null) addNewBeltItemCake(1)

		} else {
			await sleep(410)
			resolve(true)
		}

	})
}

function addNewBeltItemCake(idx: number) {
	if(cakeId > 6) return
	let item: BeltItem = {
		id: cakeId,
		layers: [ 
			{ shape: false, cakeMix: false, filling: false }, 
			{ shape: false, cakeMix: false, filling: false }, 
			{ shape: false, cakeMix: false } 
		],
		topping: false,
	}
	if(cake?.sprinkled) item.sprinkled = false
	if(cake?.fired) item.fired = false
	if(cake?.frosting) item.frosting = false

	speedrunStatus.cakes[cakeId-1] = { 
		layers: [ 
			{ shape: false, cakeMix: false, filling: false }, 
			{ shape: false, cakeMix: false, filling: false }, 
			{ shape: false, cakeMix: false } 
		],
		topping: false,
		finished: false,
	}
	if(cake?.frosting) speedrunStatus.cakes[cakeId-1].frosting = false

	cakeId++

	belt[idx] = item

	sendBeltStatus(belt)
}


async function previousButton() {
	//await clickPos(210, 480)
	if(paused) return
	await keyboard.type(Key.W)

	console.log('PREVIOUS BUTTON')

	if(difficulty == 'advanced') {

		for (let i = 0; i < belt.length-1; i++) {
			if(belt[i] == null && belt[i+1] != null) {
				belt[i] = belt[i+1]
				belt[i+1] = null
			}
		}

		sendBeltStatus(belt)

		lastButton = Date.now()
		await sleep(410)

	} else {
		await sleep(410)
	}
}

async function clickShapeMaker(shape: Shape) {
	let pos = buttonLocations[difficulty].shape[shape]
	await clickPos(pos.x, pos.y)
}

async function clickCakeMixMaker(mix: CakeMix) {
	let pos = buttonLocations[difficulty].cakeMix[mix]
	await clickPos(pos.x, pos.y)
}

async function clickFrostingMaker(frosting: Frosting) {
	let pos = buttonLocations[difficulty].frosting[frosting]
	await clickPos(pos.x, pos.y)
}

async function clickFillingMaker(filling: Filling) {
	let pos = buttonLocations['advanced'].filling[filling]
	await clickPos(pos.x, pos.y)
}

async function clickToppingMaker(topping: Topping) {
	let pos = buttonLocations[difficulty].topping[topping]
	await clickPos(pos.x, pos.y)
}

async function clickEffectMaker(effect: Effect) {
	let pos = buttonLocations['advanced'].effect[effect]
	await clickPos(pos.x, pos.y)
}

export async function restart() {
	if(!region) return
	console.log('RESTART')
	await refocus()
	await sleep(1000)

	speedrunStatus = {
		start: 0,
		cakes: [],
		finished: 0
	}

	startNewGame()
}

export async function refocus() {
	if(!region) return
	await mouse.setPosition(new Point(region.left + region.width/2, region.top + 10))
	await mouse.click(Button.LEFT)
}

async function calculateShape() : Promise<Shape> {
	let pos1Color = await getColor(56, 164)
	//console.log('pos1Color: ' + pos1Color.toHex())
	if(pos1Color.toHex() == '#bfa5cbff') return 'heart'
	
	let pos2Color = await getColor(38, 158)
	//console.log('pos2Color: ' + pos2Color.toHex())
	if(pos2Color.toHex() == '#b79cc5ff') return 'circle'

	else return 'square'
}

async function getTopping(shape: Shape, isFrosted: boolean) : Promise<Topping> {
	let pos = cakeAnalyzePos[difficulty][shape].topping
	if(!isFrosted) pos.y += 3
	let c = await getColor(pos.x+cakePosOffset.x, pos.y+cakePosOffset.y)
	let result = colorMostLike3(c, cakeColors.topping)
	return result as Topping
}

async function getCakeMix(shape: Shape, layer: number) : Promise<CakeMix> {
	let pos = cakeAnalyzePos[difficulty][shape].layers[layer].cakeMix
	let c = await getColor(pos.x+cakePosOffset.x, pos.y+cakePosOffset.y)
	let result = colorMostLike3(c, cakeColors.cakeMix)
	return result as CakeMix
}

async function getFrostingEasy(shape: Shape) : Promise<Frosting> {
	let pos = cakeAnalyzePos[difficulty][shape].frosting
	let c = await getColor(pos.x+cakePosOffset.x, pos.y+cakePosOffset.y)
	let result = colorMostLike3(c, cakeColors.cakeMix)
	return result as Frosting
}

async function getFrostingAdvanced(shape: Shape) : Promise<Frosting|undefined> {

	// check if has frosting
	let pos1 = cakeAnalyzePos[difficulty][shape].hasFrosting!
	let c1 = await getColor(pos1.x+cakePosOffset.x, pos1.y+cakePosOffset.y)
	let c2 = await getColor(pos1.x+cakePosOffset.x, pos1.y+cakePosOffset.y+2)

	let hasFrosting = colorDistance(c1, c2) > 100
	if(!hasFrosting) return undefined

	let pos = cakeAnalyzePos[difficulty][shape].frosting
	let c = await getColor(pos.x+cakePosOffset.x, pos.y+cakePosOffset.y)
	let result = colorMostLike3(c, cakeColors.cakeMix)
	return result as Frosting
}

async function getFilling(shape: Shape, layer: number) : Promise<Filling> {
	let pos = cakeAnalyzePos[difficulty][shape].layers[layer].filling!
	let c = await getColor(pos.x+cakePosOffset.x, pos.y+cakePosOffset.y)
	let result = colorMostLike3(c, cakeColors.filling)
	return result as Filling
}

async function getIsSprinkled(shape: Shape, isFrosted: boolean) {
	let pos = cakeAnalyzePos[difficulty][shape].sprinkles!
	if(!isFrosted) pos.y += 3
	let c = await getColor(pos.x+cakePosOffset.x, pos.y+cakePosOffset.y)
	// console.log('SRPINKLES: ', c)
	// console.log(colorDistance(c, cakeColors.effect['sprinkles']))
	if(colorDistance(c, cakeColors.effect['sprinkles']) < 5000) return true
	return false
}

async function getIsFired(shape: Shape, frosting: Frosting) {
	let pos = cakeAnalyzePos[difficulty][shape].fire!
	let c = await getColor(pos.x+cakePosOffset.x, pos.y+cakePosOffset.y)
	let frostingColor = cakeColors.cakeMix[frosting]
	let estimatedFiredColor = new RGBA( frostingColor.R - 80, frostingColor.G - 80, frostingColor.B - 80, frostingColor.A)
	if(colorDistance(c, frostingColor) > colorDistance(c, estimatedFiredColor)) return true
	return false
}

function colorMostLike(c1: RGBA, colors: RGBA[]) {
	let minDiff = 100000
	let minColorIndex = 0
	for(let i = 0; i < colors.length; i++) {
		let diff = colorDistance(c1, colors[i])
		if(diff < minDiff) {
			minDiff = diff
			minColorIndex = i
		}
	}
	return { i: minColorIndex, diff: minDiff, color: colors[minColorIndex] }
}

function colorMostLike2(c: RGBA, type: 'cakeMix' | 'filling') {
	let minDiff = 100000
	let minColorKey
	for(let [key, color] of Object.entries(cakeColors[type])) {
		let diff = colorDistance(c, color)
		if(diff < minDiff) {
			minDiff = diff
			minColorKey = key
		}
	}
	return minColorKey as CakeMix | Filling
}

function colorMostLike3(c: RGBA, colors: Record<string, RGBA>) {
	let minDiff = 100000
	let minColorKey
	for(let [key, color] of Object.entries(colors)) {
		let diff = colorDistance(c, color)
		if(diff < minDiff) {
			minDiff = diff
			minColorKey = key
		}
	}
	return minColorKey
}

function colorDistance(c1: RGBA, c2: RGBA) {
	let diffR = Math.abs(c1.R - c2.R)
	let diffG = Math.abs(c1.G - c2.G)
	let diffB = Math.abs(c1.B - c2.B)
	let diff = diffR*diffR + diffG*diffG + diffB*diffB
	return diff
}

function colorAverage(colors: RGBA[]) {
	let r = 0, g = 0, b = 0
	for(let c of colors) {
		r += c.R
		g += c.G
		b += c.B
	}
	return new RGBA(r/colors.length, g/colors.length, b/colors.length, 1)
}

async function logMouseInfo() {
	setInterval(async () => {
		const mousePos = await getMousePos()
		if(!mousePos) return
		if(paused) return

		const color = await getColor(mousePos.x, mousePos.y)
		console.log(`Mouse is at ${mousePos.x}, ${mousePos.y} and color is ${color}`)
	}, 1000)
}

async function getMousePos() {
	const mousePos = await mouse.getPosition()
	let x = mousePos.x-region.left
	let y = mousePos.y-region.top

	if(x < 0 || x > region.width) return null
	if(y < 0 || y > region.height) return null

	return { x, y }
}

async function clickPos(x: number, y: number) {
	if(paused) return
	await setMousePos(x, y)
	await sleep(5)
	await mouse.click(Button.LEFT)
	sendMouseClick(x, y)
	await sleep(5)
}

async function setMousePos(x: number, y: number) {
	if(paused) return
	await mouse.setPosition(new Point(x+region.left, y+region.top))
}

export async function getColor(x: number, y: number) {
	//if(paused) return new RGBA(0, 0, 0, 0)
	let color = await screen.colorAt(new Point(x+region.left, y+region.top))
	if(userSocket) userSocket.emit('getPixel', { x, y, color: color.toHex() })
	return color
}

export async function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

async function getDifficulty(): Promise<Mode> {
	let color = await getColor(620, 384)
	console.log(color.toHex())
	if(color.toHex() == '#f17a00ff') return 'advanced'
	return 'beginner'
}

async function waitForColor(x: number, y: number, color: string, equal: boolean) {
	return new Promise(resolve => {
		let interval = setInterval(async () => {
			const col = await getColor(x, y)
			if (equal && col.toHex() == color) {
				clearInterval(interval)
				resolve(true)
			}
			if(!equal && col.toHex() != color) {
				clearInterval(interval)
				resolve(true)
			}
		}, 10)
	})
}

export async function takeScreenshot() {
	if(!region) return false
	if(paused) return false

	//console.log('Taking screenshot...')
	let screenshot:false|Image = false

	try {
		screenshot = await screen.grabRegion(region)
		await saveImage({ image: screenshot, path: './src/screenshot.jpg' })
	}	catch(e) {}

	return true
}