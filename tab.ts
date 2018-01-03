import { Action } from "./actions"
import { ed } from "./editor"
import { IItemConfig, Item } from "./item"
import { Project } from "./project"

const DEFAULT_MAP_SIZE: number = 0x10000

// tslint:disable-next-line:no-empty-interface
export interface ITabConfig extends IItemConfig {

}

export class Tab {

    public static deserialize(project: Project, conf: ITabConfig): Tab {
        const t: Tab = new Tab(project, conf)
        return t
    }

    public items: Item[] = []
    public redos: Action[] = []
    public root: Item
    public undos: Action[] = []

    private project: Project

    public constructor(project: Project, itemConf?: IItemConfig) {
        this.project = project
        this.project.tabs.push(this)
        this.root = itemConf ? Item.deserialize(this, itemConf) : new Item(this, DEFAULT_MAP_SIZE, `Map ${this.project.tabs.length}`, '')
    }

    public do(act: Action): void {
        act.do()
        this.redos.length = 0
        this.undos.push(act)
        ed.updateCounters()
        ed.setToolEnabled('undo', this.undos.length > 0)
        ed.setToolEnabled('redo', this.redos.length > 0)
        ed.setDirty()
    }

    public redo(): void {
        if (this.redos.length > 0) {
            const act: Action = this.redos.pop()
            act.redo()
            this.undos.push(act)
            ed.updateCounters()
            ed.setToolEnabled('undo', this.undos.length > 0)
            ed.setToolEnabled('redo', this.redos.length > 0)
            ed.setDirty()
        }
    }

    public serialize(): ITabConfig {
        return this.root.serialize()
    }

    public undo(): void {
        if (this.undos.length > 0) {
            const act: Action = this.undos.pop()
            act.undo()
            this.redos.push(act)
            ed.updateCounters()
            ed.setToolEnabled('undo', this.undos.length > 0)
            ed.setToolEnabled('redo', this.redos.length > 0)
            ed.setDirty()
        }
    }
}