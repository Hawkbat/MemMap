import { ed } from '../editor.js'
import { Item } from '../item.js'
import { Action } from './action.js'

export class AddAction extends Action {
	public item: Item
	public parent: Item
	public src: Item

	public constructor(parent?: Item, src?: Item) {
		super()
		this.parent = (parent === null) ? ed.activeTab().root : parent
		this.src = src

		this.item = new Item(ed.activeTab())
		if (this.src) {
			this.item.proto = this.src
		} else {
			// tslint:disable-next-line:no-any
			(this.item as any).name = `Item ${this.item.id}`
		}
	}

	public do(): void {
		this.item.reparent(this.parent)
		ed.select(this.item)
	}

	public redo(): void {
		this.do()
	}

	public undo(): void {
		this.item.unparent()
		ed.select(null)
	}
}
