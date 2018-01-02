import ed from "../editor"
import Item from "../item"
import Action from "./action"

export default class MoveUpAction extends Action {
    public index: number
    public item: Item

    public constructor(item: Item) {
        super()
        this.item = item
    }

    public do(): void {
        this.index = this.item.parent.subs.indexOf(this.item)
        this.item.parent.subs.splice(this.index, 1)
        this.item.parent.subs.splice(this.index + 1, 0, this.item)
        ed.redraw()
        ed.select(this.item)
    }

    public redo(): void {
        this.do()
    }

    public undo(): void {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1)
        this.item.parent.subs.splice(this.index, 0, this.item)
        ed.redraw()
        ed.select(this.item)
    }
}
