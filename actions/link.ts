import { ed } from '../editor.js'
import { Item } from '../item.js'
import { Action } from './action.js'

export class LinkAction extends Action {
	public item: Item
	public newProto: Item
	public oldProto: Item

	public constructor(item: Item, proto?: Item) {
		super()
		this.item = item
		this.oldProto = item.proto
		this.newProto = proto
	}

	public do(): void {
		this.item.proto = this.newProto
		ed.select(this.item)
	}

	public redo(): void {
		this.do()
	}

	public undo(): void {
		this.item.proto = this.oldProto
		ed.select(this.item)
	}
}
