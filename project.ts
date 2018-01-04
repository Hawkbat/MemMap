import { ed } from './editor.js'
import { ITabConfig, Tab } from './tab.js'

export interface IProjectConfig {
	name: string
	tabs: ITabConfig[]
}

export class Project {
	public static deserialize(conf: IProjectConfig): Project {
		const p: Project = new Project(false)
		p.name = conf.name
		p.tabs = conf.tabs.map((t: ITabConfig) => Tab.deserialize(p, t))
		return p
	}

	public static open(): void {
		const n: HTMLInputElement = document.createElement('input')
		n.setAttribute('type', 'file')
		n.setAttribute('accept', '.memmap.json')
		n.addEventListener('change', () => {
			if (n.files.length > 0) {
				const r: FileReader = new FileReader()
				r.addEventListener('load', () => {
					ed.project = Project.deserialize(JSON.parse(r.result))
					ed.redraw()
					ed.updateProjectFields()
					ed.setDirty(false)
				})
				r.readAsText(n.files[0], 'utf-8')
			}
		})
		n.click()
	}

	public name: string = 'New Project'
	public tabs: Tab[] = []

	public constructor(useDefaults: boolean = true) {
		if (useDefaults) {
			// tslint:disable-next-line:no-unused-expression
			new Tab(this)
		}
	}

	public save(): void {
		const out: string = JSON.stringify(this.serialize())
		const a: HTMLAnchorElement = document.createElement('a')
		a.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(out)}`)
		a.setAttribute('download', `${this.name}.memmap.json`)
		a.click()
		ed.setDirty(false)
	}

	public serialize(): IProjectConfig {
		return { name: this.name, tabs: this.tabs.map((tab: Tab) => tab.serialize()) }
	}
}
