
import { ed } from '../editor.js'
import { Item } from '../item.js'
import { Action } from './action.js'

export class BreakLinkAction extends Action {
	public item: Item
	public oldData: Item
	public oldProto: Item

	public constructor(item: Item) {
		super()
		this.item = item
		this.oldProto = item.proto
		this.oldData = new Item(item.tab)
		this.oldData.deepCopy(item)
	}

	public do(): void {
		this.item.deepCopy(this.item.proto)
		this.item.proto = undefined
		ed.select(this.item)
	}

	public redo(): void {
		this.do()
	}

	public undo(): void {
		this.item.proto = this.oldProto
		this.item.deepCopy(this.oldData)
		ed.select(this.item)
	}
}
