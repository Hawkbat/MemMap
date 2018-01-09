import { ed } from './editor.js'
import { DigitType } from './enums.js'
import { Tab } from './tab.js'

const HEX_RADIX: number = 16

export interface IItemConfig {
	desc?: string
	name?: string
	proto?: number
	size?: number
	subs?: IItemConfig[]
	uuid?: number
}

export class Item {

	public static byUUID: { [key: string]: Item } = {}

	public static deserialize(tab: Tab, conf: IItemConfig): Item {
		const t: Item = new Item(tab, conf.size, conf.name, conf.desc, undefined, conf.uuid)
		if (conf.subs) {
			t.subs = conf.subs.map((s: IItemConfig) => Item.deserialize(tab, s))
			for (const sub of t.subs) {
				sub.parent = t
			}
		}
		if (conf.proto) {
			tab.tempProtoMap[t.uuid] = conf.proto
		}
		t.id = tab.items.length
		tab.items.push(t)
		return t
	}

	public id: number
	public open: boolean = true
	public parent: Item
	public proto: Item
	public readonly tab: Tab
	public readonly uuid: number

	private desc?: string
	private name?: string
	private size?: number
	private subs?: Item[]

	public constructor(tab: Tab, size?: number, name?: string, desc?: string, subs?: Item[], uuid?: number) {
		this.size = size
		this.name = name
		this.desc = desc
		this.subs = subs
		if (this.subs) {
			for (const sub of this.subs) {
				sub.parent = this
			}
		}
		this.tab = tab
		this.id = tab.items.length
		this.uuid = uuid ? uuid : Date.now() + Math.random()
		Item.byUUID[this.uuid] = this
		tab.items.push(this)
	}

	public addChild(child: Item): number {
		child.unparent()
		if (!this.subs) {
			this.subs = []
		}
		this.subs.push(child)
		child.parent = this
		return this.subs.length - 1
	}

	public deepCopy(src: Item): void {
		this.size = src.size
		this.name = src.name
		this.desc = src.desc
		if (this.subs) {
			for (const sub of this.subs) {
				sub.parent = null
			}
			this.subs = []
			for (const sub of this.subs) {
				const child: Item = new Item(this.tab)
				child.deepCopy(sub)
				child.parent = this
				this.subs.push(child)
			}
		}
	}

	public getChildren(depth: number = 0): ReadonlyArray<Item> {
		return this.subs ? this.subs : this.proto && depth < ed.project.depthLimit ? this.proto.getChildren(depth + 1) : []
	}

	public getDesc(depth: number = 0): string {
		return this.desc ? this.desc : this.proto && depth < ed.project.depthLimit ? this.proto.getDesc(depth + 1) : ''
	}

	public getName(depth: number = 0): string {
		return this.name ? this.name : this.proto && depth < ed.project.depthLimit ? this.proto.getName(depth + 1) : ''
	}

	public getSize(depth: number = 0): number {
		return this.size ? this.size : this.proto && depth < ed.project.depthLimit ? this.proto.getSize(depth + 1) : 0
	}

	public insertChild(child: Item, index: number): number {
		child.unparent()
		if (!this.subs) {
			this.subs = []
		}
		this.subs.splice(index, 0, child)
		child.parent = this
		return this.subs.indexOf(child)
	}

	public isChildOf(item: Item): boolean {
		let parent: Item = this.parent
		while (parent) {
			if (parent === item) {
				return true
			}
			parent = parent.parent
		}
		return false
	}

	public isRecursive(): boolean {
		return this.proto && this.isChildOf(this.proto)
	}

	public removeChild(child: Item): number {
		const index: number = this.subs.indexOf(child)
		this.subs.splice(index, 1)
		child.parent = null
		if (this.subs.length === 0) {
			this.subs = undefined
		}
		return index
	}

	public render(start: number = 0, depth: number = 0, proto: boolean = false): string {
		let out: string = ''
		out += '<div class="col">'
		out += `<div class="row item${ (proto ? ' proto' : '') + (ed.shouldHighlight(this) ? ' highlighted' : '') }" draggable="true" data-id="${this.id}">`
		if (this.getChildren() && this.getChildren().length > 0) {
			out += `<i class="fa fa-fw fa-lg fa-caret-${this.open ? 'down' : 'right'}" onclick="ed.toggleOpen(${this.id})"></i>`
		} else {
			out += '<i></i>'
		}
		if (this.getSize() > 0) {
			out += `<div class="cell">${this.formatNum(start)}-${this.formatNum(start + this.getSize() - 1)}:</div>`
		}
		if (this.getDesc()) {
			out += `<div class="cell">${this.getName()} (${this.getDesc()})</div>`
		} else {
			out += `<div class="cell">${this.getName()}</div>`
		}
		if (this.proto) {
			out += '<i class="fa fa-link"></i>'
		}
		out += '</div>'
		if (this.open && this.getChildren().length > 0) {
			if (depth >= ed.project.depthLimit) {
				out += '<div class="col">...</div>'
			} else {
				let subStart: number = start
				for (const sub of this.getChildren()) {
					out += sub.render(subStart, depth + 1, proto || (!!this.proto && !this.subs))
					subStart += sub.getSize()
				}
			}
		}
		out += '</div>'
		return out
	}

	public reparent(parent: Item): void {
		this.unparent()
		if (parent) {
			parent.addChild(this)
		}
	}

	public serialize(): IItemConfig {
		const conf: IItemConfig = { size: this.size, name: this.name, desc: this.desc, uuid: this.uuid }
		if (this.proto) {
			conf.proto = this.proto.uuid
		}
		if (this.subs) {
			conf.subs = this.subs.map((v: Item) => v.serialize())
		}
		return conf
	}

	public unparent(): void {
		if (this.parent) {
			this.parent.removeChild(this)
		}
	}

	private formatNum(num: number): string {
		if (ed.activeTab().digitType === DigitType.Hexadecimal) {
			let str: string = num.toString(HEX_RADIX).toUpperCase()
			while (str.length < ed.activeTab().pad) {
				str = `0${str}`
			}
			return `0x${str}`
		} else if (ed.activeTab().digitType === DigitType.Decimal) {
			let str: string = num.toString()
			while (str.length < ed.activeTab().pad) {
				str = `0${str}`
			}
			return str
		}
	}
}
