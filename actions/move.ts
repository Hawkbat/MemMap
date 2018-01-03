import { ed } from "../editor"
import { Item } from "../item"
import { Action } from "./action"

export class MoveAction extends Action {
    public item: Item
    public newParent: Item
    public oldIndex: number
    public oldParent: Item

    public constructor(item: Item, parent: Item) {
        super()
        this.item = item
        this.oldIndex = item.parent.subs.indexOf(item)
        this.oldParent = item.parent
        this.newParent = parent
    }

    public do(): void {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1)
        this.item.parent = this.newParent
        this.newParent.subs.push(this.item)
        ed.redraw()
        ed.select(this.item)
    }

    public redo(): void {
        this.do()
    }

    public undo(): void {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1)
        this.item.parent = this.oldParent
        this.oldParent.subs.splice(this.oldIndex, 0, this.item)
        ed.redraw()
        ed.select(this.item)
    }
}
