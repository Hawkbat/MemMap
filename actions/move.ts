import { ed } from '../editor.js'
import { Item } from '../item.js'
import { Action } from './action.js'

export class MoveAction extends Action {
	public item: Item
	public newParent: Item
	public oldIndex: number
	public oldParent: Item

	public constructor(item: Item, parent: Item) {
		super()
		this.item = item
		this.oldIndex = item.parent.getChildren().indexOf(item)
		this.oldParent = item.parent
		this.newParent = parent
	}

	public do(): void {
		this.item.reparent(this.newParent)
		ed.select(this.item)
	}

	public redo(): void {
		this.do()
	}

	public undo(): void {
		this.oldParent.insertChild(this.item, this.oldIndex)
		ed.select(this.item)
	}
}
