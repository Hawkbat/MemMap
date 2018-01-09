import { ed } from '../editor.js'
import { Item } from '../item.js'
import { Action } from './action.js'

export class MoveDownAction extends Action {
	public index: number
	public item: Item

	public constructor(item: Item) {
		super()
		this.item = item
	}

	public do(): void {
		this.index = this.item.parent.getChildren().indexOf(this.item)
		this.item.parent.insertChild(this.item, this.index + 1)
		ed.select(this.item)
	}

	public redo(): void {
		this.do()
	}

	public undo(): void {
		this.item.parent.insertChild(this.item, this.index)
		ed.select(this.item)
	}
}
