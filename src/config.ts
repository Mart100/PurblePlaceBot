import { RGBA } from "@nut-tree/nut-js"
import { ButtonLocations, CakeMix, Filling, Topping, CakeAnalyzePos } from "./types"

export const buttonLocations: ButtonLocations = {
	beginner: {
		shape: {
			circle: { x: 220, y: 365 },
			square: { x: 220, y: 400 },
			heart: { x: 220, y: 440 },
		},
		cakeMix: {
			chocolate: { x: 320, y: 365 },
			strawberry: { x: 320, y: 400 },
			vanilla: { x: 320, y: 440 },
		},
		frosting: {
			chocolate: { x: 420, y: 365 },
			strawberry: { x: 420, y: 400 },
			vanilla: { x: 420, y: 440 },
		},
		topping: {
			gummies: { x: 500, y: 380 },
			heart: { x: 540, y: 380 },
			smiley: { x: 500, y: 420 },
			clover: { x: 540, y: 420 },
		},
	},
	advanced: {
		shape: {
			circle: { x: 120, y: 365 },
			square: { x: 120, y: 400 },
			heart: { x: 120, y: 440 },
		},
		cakeMix: {
			chocolate: { x: 220, y: 365 },
			strawberry: { x: 220, y: 400 },
			vanilla: { x: 220, y: 440 },
		},
		filling: {
			red: { x: 320, y: 365 },
			green: { x: 320, y: 400 },
			white: { x: 320, y: 440 },
		},
		frosting: {
			chocolate: { x: 420, y: 365 },
			strawberry: { x: 420, y: 400 },
			vanilla: { x: 420, y: 440 },
		},
		topping: {
			gummies: { x: 500, y: 380 },
			heart: { x: 540, y: 380 },
			smiley: { x: 500, y: 420 },
			clover: { x: 540, y: 420 },
		},
		effect: {
			fire: { x: 620, y: 380 },
			sprinkles: { x: 620, y: 430 },
		}
	}
}

export const cakeColors: {
	cakeMix: { [key in CakeMix]: RGBA },
	filling: { [key in Filling]: RGBA },
	topping: { [key in Topping]: RGBA },
	effect: { [key in 'sprinkles']: RGBA }
} = {
	cakeMix: {
		strawberry: new RGBA(243, 111, 162, 1),
		chocolate: new RGBA(104, 52, 31, 1),
		vanilla: new RGBA(243, 211, 111, 1)
	},
	filling: {
		red: new RGBA(168, 39, 64, 1), 
		green: new RGBA(72, 233, 140, 1), 
		white: new RGBA(245, 247, 244, 1)
	},
	topping: {
		gummies: new RGBA(236, 19, 26, 1),
		heart: new RGBA(194, 1, 0, 1), 
		smiley: new RGBA(242, 225, 203, 1),
		clover: new RGBA(64, 194, 31, 1)
	},
	effect: {
		sprinkles: new RGBA(250, 250, 250, 1),
	}
}


export const cakePosOffset = { x: 17, y: 76 }
export const cakeAnalyzePos:CakeAnalyzePos = {
	beginner: {
		square: {
			topping: { x: 51, y: 59 },
			frosting: { x: 57, y: 75 },
			layers: [{ cakeMix: { x: 57, y: 93 } }]
		},
		circle: {
			topping: { x: 51, y: 59 },
			frosting: { x: 57, y: 75 },
			layers: [{ cakeMix: { x: 57, y: 93 } }]
		},
		heart: {
			topping: { x: 51, y: 59 },
			frosting: { x: 57, y: 75 },
			layers: [{ cakeMix: { x: 57, y: 93 } }]
		}
	},
	advanced: {
		square: {
			topping: { x: 52, y: 23 },
			sprinkles: { x: 57, y: 35 },
			fire: { x: 50, y: 44 },
			frosting: { x: 45, y: 40 },
			hasFrosting: { x: 49, y: 49 },
			layers: [{
				cakeMix: { x: 35, y: 95 },
				filling: { x: 50, y: 82 }
			},
			{
				cakeMix: { x: 50, y: 75 },
				filling: { x: 50, y: 60 }
			},
			{
				cakeMix: { x: 50, y: 55 },
			}]
		},
		circle: {
			topping: { x: 52, y: 23 },
			sprinkles: { x: 52, y: 37 },
			fire: { x: 50, y: 44 },
			frosting: { x: 50, y: 40 },
			hasFrosting: { x: 53, y: 50 },
			layers: [{
				cakeMix: { x: 50, y: 95 },
				filling: { x: 50, y: 87 }
			},
			{
				cakeMix: { x: 50, y: 75 },
				filling: { x: 50, y: 65 }
			},
			{
				cakeMix: { x: 50, y: 55 },
			}]
		},
		heart: {
			topping: { x: 52, y: 20 },
			sprinkles: { x: 49, y: 39 },
			fire: { x: 50, y: 44 },
			frosting: { x: 50, y: 40 },
			hasFrosting: { x: 53, y: 50 },
			layers: [{
				cakeMix: { x: 50, y: 90 },
				filling: { x: 50, y: 79 }
			},
			{
				cakeMix: { x: 50, y: 70 },
				filling: { x: 50, y: 60 }
			},
			{
				cakeMix: { x: 54, y: 56 },
			}]
		},
	}
}

export const actionBeltPos = {
	'shape': 2,
	'cakeMix': 3,
	'filling': 4,
	'frosting': 5,
	'topping': 6,
	'effect': 7,
	'finish': 8,
}