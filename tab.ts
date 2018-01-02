import { Action } from "./actions"
import Item from "./item"
import ed from "./editor"

export default class Tab {
    root: Item
    items: Item[] = []
    undos: Action[] = []
    redos: Action[] = []

    redo() {
        if (this.redos.length > 0) {
            let act = this.redos.pop()
            act.redo()
            this.undos.push(act)
            ed.updateCounters()
            ed.setToolEnabled('undo', this.undos.length > 0)
            ed.setToolEnabled('redo', this.redos.length > 0)
            ed.project.setDirty()
        }
    }

    undo() {
        if (this.undos.length > 0) {
            let act = this.undos.pop()
            act.undo()
            this.redos.push(act)
            ed.updateCounters()
            ed.setToolEnabled('undo', this.undos.length > 0)
            ed.setToolEnabled('redo', this.redos.length > 0)
            ed.project.setDirty()
        }
    }

    do(act: Action): void {
        act.do()
        this.redos.length = 0
        this.undos.push(act)
        ed.updateCounters()
        ed.setToolEnabled('undo', this.undos.length > 0)
        ed.setToolEnabled('redo', this.redos.length > 0)
        ed.project.setDirty()
    }

    static deserialize(conf: any): Tab {
        let t = new Tab()
        t.root = Item.deserialize(t, conf)
        return t
    }

    serialize() {
        return this.root.serialize()
    }
}