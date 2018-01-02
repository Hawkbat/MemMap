import ed from "../editor"
import Item from "../item"
import Action from "./action"

export default class RemoveAction extends Action {
    public index: number
    public item: Item
    public parent: Item

    public constructor(item: Item) {
        super()
        this.item = item
    }

    public do(): void {
        this.parent = this.item.parent
        this.index = this.item.parent.subs.indexOf(this.item)
        this.item.parent.subs.splice(this.index, 1)
        this.item.parent = undefined
        ed.redraw()
        ed.select()
    }

    public redo(): void {
        this.do()
    }

    public undo(): void {
        this.item.parent = this.parent
        this.parent.subs.splice(this.index, 0, this.item)
        ed.redraw()
        ed.select(this.item)
    }
}
