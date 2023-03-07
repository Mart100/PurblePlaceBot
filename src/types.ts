export type Action = 'shape' | 'cakeMix' | 'filling' | 'frosting' | 'topping' | 'effect' | 'finish'
export type Shape = 'heart' | 'square' | 'circle'
export type CakeMix = 'chocolate' | 'vanilla' | 'strawberry'
export type Filling = 'red' | 'green' | 'white'
export type Frosting = 'chocolate' | 'vanilla' | 'strawberry'
export type Topping = 'gummies' | 'heart' | 'smiley' | 'clover'
export type Effect = 'fire' | 'sprinkles'


export interface Layer {
	cakeMix: CakeMix
	filling?: Filling
}
export interface Cake {
	shape: Shape
	layers: Layer[]
	topping: Topping
	frosting?: Frosting
	fired?: boolean
	sprinkled?: boolean
}
export interface LayerStatus {
	shape: false|number
	cakeMix: false|number
	filling?: false|number
}
export interface CakeStatus {
	layers: LayerStatus[]
	topping: false|number
	frosting?: false|number
	finished: false|number
}

export interface SpeedrunStatus {
	cakes: CakeStatus[]
	start: number
	finished: false|number
}

export type Mode = 'beginner' | 'advanced'

export type ButtonLocations = {
	beginner: {
		shape: { [K in Shape]: { x: number; y: number} },
		cakeMix: { [K in CakeMix]: { x: number; y: number} },
		frosting: { [K in Frosting]: { x: number; y: number} },
		topping: { [K in Topping]: { x: number; y: number} },
	},
	advanced: {
		shape: { [K in Shape]: { x: number; y: number} },
		cakeMix: { [K in CakeMix]: { x: number; y: number} },
		filling: { [K in Filling]: { x: number; y: number} },
		frosting: { [K in Frosting]: { x: number; y: number} },
		topping: { [K in Topping]: { x: number; y: number} },
		effect: { [K in Effect]: { x: number; y: number} },
	}
}

export type CakeAnalyzePos = {
	[M in Mode]: {
		[K in Shape]: {
			sprinkles?: { x: number; y: number},
			fire?: { x: number; y: number},
			topping: { x: number; y: number},
			frosting: { x: number; y: number},
			hasFrosting?: { x: number; y: number},
			layers: CakeAnalyzePosLayer[]
		}
	}
}

export type CakeAnalyzePosLayer = {
	cakeMix: { x: number; y: number},
	filling?: { x: number; y: number},
}

export type BeltItemCakeLayer = {
	shape: boolean
	cakeMix: boolean
	filling?: boolean
}
export type BeltItemCake = {
	layers: BeltItemCakeLayer[]
	frosting?: boolean
	topping: boolean
	sprinkled?: boolean
	fired?: boolean
	id: number
}
export type BeltItem = null|BeltItemCake
