import ed from "../editor"
import Item from "../item"
import Action from "./action"

export default class ChangeFieldAction extends Action {
    public field: string
    public item: Item
    public newValue: string | number
    public oldValue: string | number

    public constructor(item: Item, field: string, value: string | number) {
        super()
        this.item = item
        this.field = field
        // tslint:disable-next-line:no-any
        this.oldValue = (this.item as any)[field]
        this.newValue = value
    }

    public do(): void {
        // tslint:disable-next-line:no-any
        (this.item as any)[this.field] = this.newValue
        ed.redraw()
        ed.select(this.item)
    }

    public redo(): void {
        this.do()
    }

    public undo(): void {
        // tslint:disable-next-line:no-any
        (this.item as any)[this.field] = this.oldValue
        ed.redraw()
        ed.select(this.item)
    }
}