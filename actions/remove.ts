import { ed } from '../editor.js'
import { Item } from '../item.js'
import { Action } from './action.js'

export class RemoveAction extends Action {
	public index: number
	public item: Item
	public parent: Item

	public constructor(item: Item) {
		super()
		this.item = item
	}

	public do(): void {
		this.parent = this.item.parent
		this.index = this.item.parent.getChildren().indexOf(this.item)
		this.item.unparent()
		ed.select(null)
	}

	public redo(): void {
		this.do()
	}

	public undo(): void {
		this.parent.insertChild(this.item, this.index)
		ed.select(this.item)
	}
}
