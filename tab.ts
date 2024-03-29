import { Action } from './actions/index.js'
import { ed } from './editor.js'
import { DigitType } from './enums.js'
import { IItemConfig, Item } from './item.js'
import { Project } from './project.js'

const DEFAULT_MAP_SIZE: number = 0x10000

// tslint:disable-next-line:no-empty-interface
export interface ITabConfig {
	digitType: DigitType
	pad: number
	root: IItemConfig
}

export class Tab {

	public static deserialize(project: Project, conf: ITabConfig): Tab {
		const t: Tab = new Tab(project, conf.root)
		t.digitType = conf.digitType
		t.pad = conf.pad
		for (const key of Object.keys(t.tempProtoMap)) {
			Item.byUUID[key].proto = Item.byUUID[t.tempProtoMap[parseFloat(key)]]
		}
		return t
	}

	public digitType: DigitType = DigitType.Hexadecimal
	public items: Item[] = []
	public pad: number = 4
	public redos: Action[] = []
	public root: Item
	public tempProtoMap: { [key: number]: number } = {}
	public undos: Action[] = []

	private project: Project

	public constructor(project: Project, itemConf?: IItemConfig) {
		this.project = project
		this.project.tabs.push(this)
		this.root = itemConf ? Item.deserialize(this, itemConf) : new Item(this, DEFAULT_MAP_SIZE, `Map ${this.project.tabs.length}`)
	}

	public do(act: Action): void {
		act.do()
		this.redos.length = 0
		this.undos.push(act)
		ed.redraw(true)
		ed.setToolEnabled('undo', this.undos.length > 0)
		ed.setToolEnabled('redo', this.redos.length > 0)
		ed.setDirty()
	}

	public redo(): void {
		if (this.redos.length > 0) {
			const act: Action = this.redos.pop()
			act.redo()
			this.undos.push(act)
			ed.redraw(true)
			ed.setToolEnabled('undo', this.undos.length > 0)
			ed.setToolEnabled('redo', this.redos.length > 0)
			ed.setDirty()
		}
	}

	public serialize(): ITabConfig {
		return { digitType: this.digitType, pad: this.pad, root: this.root.serialize() }
	}

	public undo(): void {
		if (this.undos.length > 0) {
			const act: Action = this.undos.pop()
			act.undo()
			this.redos.push(act)
			ed.redraw(true)
			ed.setToolEnabled('undo', this.undos.length > 0)
			ed.setToolEnabled('redo', this.redos.length > 0)
			ed.setDirty()
		}
	}
}
