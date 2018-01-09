import * as Actions from './actions/index.js'
import { DigitType } from './enums.js'
import { Item } from './item.js'
import { IProjectConfig, Project } from './project.js'
import { Tab } from './tab.js'

const DEC_RADIX: number = 10
const AUTOSAVE_INTERVAL: number = 2000

export class Editor {
	public project: Project

	private autosaveTimeout: number
	private cbItem: Item = null
	private curTab: number = 0
	private dirty: boolean
	private linkItem: Item = null
	private selectedItem: Item = null

	public activeTab(): Tab {
		return this.project.tabs[this.curTab]
	}

	public addExpander(id: string, right: boolean = false): void {
		const expander: HTMLElement = document.createElement('div')
		const icon: HTMLElement = document.createElement('i')
		expander.id = `expander-${id}`
		expander.classList.add('expander', 'col')
		icon.classList.add('fa', `fa-chevron-${right ? 'right' : 'left'}`)
		expander.appendChild(icon)
		document.getElementById('body').appendChild(expander)

		expander.addEventListener('click', () => {
			const panel: HTMLElement = document.getElementById(`fields-${id}`)
			panel.classList.toggle('hidden')
			icon.classList.toggle('fa-chevron-left')
			icon.classList.toggle('fa-chevron-right')
		})
	}

	public addFieldGroup(id: string): void {
		const group: HTMLElement = document.createElement('div')
		group.id = `fields-${id}`
		group.classList.add('fields', 'col')
		document.getElementById('body').appendChild(group)
	}

	public addHeadingField(group: string, label: string): void {
		const fields: HTMLElement = document.getElementById(`fields-${group}`)
		const heading: HTMLElement = document.createElement('div')
		heading.classList.add('field', 'heading')
		heading.innerText = label
		fields.appendChild(heading)
	}

	// tslint:disable-next-line:no-any
	public addInputField(group: string, field: string, label: string, type: string, obj: () => any): void {
		const fields: HTMLElement = document.getElementById(`fields-${group}`)
		const input: HTMLInputElement = document.createElement('input')
		input.classList.add('field')
		input.type = type
		input.name = field
		if (!!obj()) {
			// tslint:disable-next-line:no-any
			input.value = (obj() as any)[field] as string
		}
		const labelEle: HTMLElement = document.createElement('label')
		labelEle.classList.add('field')
		labelEle.innerText = label
		fields.appendChild(labelEle)
		fields.appendChild(input)
		input.disabled = !obj()
		input.addEventListener('change', () => {
			if (!!obj()) {
				this.activeTab().do(new Actions.ChangeFieldAction(obj(), group, field, (type === 'number') ? parseInt(input.value, DEC_RADIX) : input.value))
			}
		})
	}

	// tslint:disable-next-line:no-any
	public addSelectField(group: string, field: string, label: string, options: string[], obj: () => any): void {
		const fields: HTMLElement = document.getElementById(`fields-${group}`)
		const select: HTMLSelectElement = document.createElement('select')
		select.classList.add('field')
		select.name = field
		for (let i: number = 0; i < options.length; i ++) {
			select.add(new Option(options[i], i.toString()))
		}
		if (!!obj()) {
			// tslint:disable-next-line:no-any
			select.value = (obj() as any)[field] as string
		}
		const labelEle: HTMLElement = document.createElement('label')
		labelEle.classList.add('field')
		labelEle.innerText = label
		fields.appendChild(labelEle)
		fields.appendChild(select)
		select.disabled = !obj()
		select.addEventListener('change', () => {
			if (!!obj()) {
				this.activeTab().do(new Actions.ChangeFieldAction(obj(), group, field, parseInt(select.value, DEC_RADIX)))
			}
		})
	}

	public addTab(): void {
		const tab: Tab = new Tab(this.project)
		this.curTab = this.project.tabs.length - 1
		this.updateProjectFields()
		this.select(tab.root)
	}

	// tslint:disable-next-line:no-any
	public addTextAreaField(group: string, field: string, label: string, obj: () => any): void {
		const fields: HTMLElement = document.getElementById(`fields-${group}`)
		const textarea: HTMLTextAreaElement = document.createElement('textarea')
		textarea.classList.add('field')
		textarea.name = field
		if (!!obj()) {
			// tslint:disable-next-line:no-any
			textarea.value = (obj() as any)[field] as string
		}
		const labelEle: HTMLElement = document.createElement('label')
		labelEle.classList.add('field')
		labelEle.innerText = label
		fields.appendChild(labelEle)
		fields.appendChild(textarea)
		textarea.disabled = !obj()
		textarea.addEventListener('change', () => {
			if (!!obj()) {
				this.activeTab().do(new Actions.ChangeFieldAction(obj(), group, field, textarea.value))
			}
		})
	}

	public addTool(name: string, title: string, icon: string, key: string, action: (item: Item) => void, count?: () => number): void {
		const tool: HTMLElement = document.querySelector('#header').appendChild(document.createElement('div'))
		tool.classList.add('tool')
		tool.id = `tool-${name}`
		tool.title = `${title}${key ? ` (${key.substr(0, 1).toUpperCase() + key.substr(1)})` : ''}`
		tool.innerHTML = `<i class="fa fa-${icon}"></i>`

		if (count) {
			tool.dataset.count = count().toString()
			document.addEventListener('redraw', () => {
				tool.dataset.count = count().toString()
			})
		}

		tool.addEventListener('click', () => {
			action(this.selected())
		})

		if (key) {
			document.addEventListener('keydown', (e: KeyboardEvent) => {
				if (!document.activeElement || document.activeElement === document.body) {
					if (e.key === key) {
						e.preventDefault()
						action(this.selected())
					}
				}
			})
		}
	}

	public addToolSpacer(): void {
		const spacer: HTMLDivElement = document.createElement('div')
		spacer.classList.add('spacer')
		document.getElementById('header').appendChild(spacer)
	}

	public addWorkspace(): void {
		const workspace: HTMLElement = document.createElement('div')
		workspace.classList.add('col', 'expand')
		document.getElementById('body').appendChild(workspace)

		const tabs: HTMLElement = document.createElement('div')
		tabs.classList.add('tabs', 'row')
		workspace.appendChild(tabs)

		const items: HTMLElement = document.createElement('div')
		items.classList.add('items', 'col')
		workspace.appendChild(items)

		items.addEventListener('click', (e: MouseEvent) => {
			const ele: HTMLElement = this.findItemElement(e.target as HTMLElement)
			let item: Item
			if (ele) {
				item = this.activeTab().items[parseInt(ele.dataset.id, DEC_RADIX)]
			}
			if (item && this.linkItem) {
				const linkItem: Item = this.linkItem
				this.linkItem = null
				if (linkItem.tab === this.activeTab() && item !== linkItem) {
					this.activeTab().do(new Actions.LinkAction(linkItem, item))
				} else {
					this.select()
				}
			} else {
				this.select(item)
			}
		})
		items.addEventListener('dragstart', (e: DragEvent) => {
			const ele: HTMLElement = this.findItemElement(e.target as HTMLElement)
			if (ele) {
				const item: Item = this.activeTab().items[parseInt(ele.dataset.id, DEC_RADIX)]
				if (item.parent) {
					e.dataTransfer.setData('text/plain', item.id.toString())
				} else {
					e.preventDefault()
				}
			} else {
				e.preventDefault()
			}
		})
		items.addEventListener('dragover', (e: DragEvent) => {
			e.preventDefault()
			const ele: HTMLElement = this.findItemElement(e.target as HTMLElement)
			if (ele) {
				e.dataTransfer.dropEffect = 'move'
			}
		})
		items.addEventListener('drop', (e: DragEvent) => {
			e.preventDefault()
			const ele: HTMLElement = this.findItemElement(e.target as HTMLElement)
			if (ele) {
				const item: Item = this.activeTab().items[parseInt(e.dataTransfer.getData('text/plain'), DEC_RADIX)]
				const parent: Item = this.activeTab().items[parseInt(ele.dataset.id, DEC_RADIX)]
				if (item !== parent) {
					this.activeTab().do(new Actions.MoveAction(item, parent))
				}
			}
		})
		document.addEventListener('redraw', () => {
			items.innerHTML = this.activeTab().root.render()

			let out: string = ''
			for (let i: number = 0; i < this.project.tabs.length; i++) {
				if (i === this.curTab) {
					out += `<div class="tab selected">${this.activeTab().root.getName()}`
				} else {
					out += `<div class="tab" onclick="ed.changeTab(${i})">${this.project.tabs[i].root.getName()}`
				}
				if (this.project.tabs.length > 1) {
					out += `<i class="fa fa-close" onclick="ed.closeTab(${i})"></i>`
				}
				out += '</div>'
			}
			out += '<div id="new-tab" class="tab" onclick="ed.addTab()"><i class="fa fa-plus"></i></div>'
			tabs.innerHTML = out
		})
	}

	public autosave(): void {
		localStorage.setItem('memmap-autosave', JSON.stringify(this.project.serialize()))
		this.setDirty(false)
	}

	public changeTab(i: number): void {
		this.curTab = i
		this.updateProjectFields()
		this.select(this.activeTab().root)
	}

	public closeTab(i: number): void {
		if ((i === this.curTab && i > 0) || this.curTab === this.project.tabs.length - 1) {
			this.curTab--
		}
		this.project.tabs.splice(i, 1)
		this.updateProjectFields()
		this.select(this.activeTab().root)
	}

	public findItemElement(ele: HTMLElement): HTMLElement {
		let el: HTMLElement = ele
		while (el && !el.classList.contains('item')) {
			el = el.parentElement
		}
		return el
	}

	public init(): void {
		const autosave: string = localStorage.getItem('memmap-autosave')
		this.project = autosave ? Project.deserialize(JSON.parse(autosave) as IProjectConfig) : new Project()
		this.autosave()

		window.addEventListener('beforeunload', () => {
			this.autosave()
		})

		this.addFieldGroup('item')
		this.addHeadingField('item', 'Details')
		this.addInputField('item', 'size', 'Size', 'number', () => this.selected())
		this.addInputField('item', 'name', 'Name', 'text', () => this.selected())
		this.addTextAreaField('item', 'desc', 'Description', () => this.selected())
		this.addExpander('item')

		this.addWorkspace()

		this.addExpander('project', true)
		this.addFieldGroup('project')
		this.addHeadingField('project', 'Map')
		this.addSelectField('project', 'digitType', 'Digit Type', Object.keys(DigitType).filter((v: string) => isNaN(parseInt(v, DEC_RADIX))), () => this.activeTab())
		this.addInputField('project', 'pad', 'Padding Digits', 'number', () => this.activeTab())
		this.addHeadingField('project', 'Project')
		this.addInputField('project', 'name', 'Name', 'text', () => this.project)
		this.addInputField('project', 'depthLimit', 'Nesting Limit', 'number', () => this.project)

		this.addToolSpacer()

		this.addTool('new', 'New Project', 'file', 'n', () => {
			if (confirm('You will lose all autosaved data if you start a new project. Continue?')) {
				this.project = new Project()
				this.redraw()
			}
		})
		this.addTool('open', 'Open Project', 'folder-open', 'o', () => Project.open())
		this.addTool('save', 'Download Project', 'download', 's', () => this.project.save())

		this.addToolSpacer()

		this.addTool('cut', 'Cut', 'cut', 'x', (item: Item) => {
			if (item && item.parent) {
				this.cbItem = item
				this.activeTab().do(new Actions.RemoveAction(item))
				this.setToolEnabled('paste', true)
			}
		})
		this.addTool('copy', 'Copy', 'copy', 'c', (item: Item) => {
			if (item) {
				this.cbItem = item
				this.setToolEnabled('paste', true)
			}
		})
		this.addTool('paste', 'Paste', 'paste', 'v', (item: Item) => {
			if (this.cbItem) {
				this.activeTab().do(new Actions.AddAction(item, this.cbItem))
			}
		})
		this.setToolEnabled('paste', false)

		this.addToolSpacer()

		this.addTool('undo', 'Undo', 'undo', 'z', () => this.activeTab().undo(), () => this.activeTab().undos.length ? this.activeTab().undos.length : 0)
		this.setToolEnabled('undo', false)
		this.addTool('redo', 'Redo', 'repeat', 'y', () => this.activeTab().redo(), () => this.activeTab().redos.length ? this.activeTab().redos.length : 0)
		this.setToolEnabled('redo', false)

		this.addToolSpacer()

		this.addTool('add', 'Add Item', 'plus', 'Insert', (item: Item) => this.activeTab().do(new Actions.AddAction(item)))
		this.addTool('rem', 'Remove Item', 'minus', 'Delete', (item: Item) => {
			if (item && item.parent) {
				this.activeTab().do(new Actions.RemoveAction(item))
			}
		})
		this.addTool('up', 'Move Item Up', 'arrow-up', 'Home', (item: Item) => {
			if (item && item.parent) {
				const index: number = item.parent.getChildren().indexOf(item)
				if (index > 0) {
					this.activeTab().do(new Actions.MoveUpAction(item))
				}
			}
		})
		this.addTool('down', 'Move Item Down', 'arrow-down', 'End', (item: Item) => {
			if (item && item.parent) {
				const index: number = item.parent.getChildren().indexOf(item)
				if (index < item.parent.getChildren().length - 1) {
					this.activeTab().do(new Actions.MoveDownAction(item))
				}
			}
		})

		this.addToolSpacer()

		this.addTool('link', 'Link Item', 'link', 'l', (item: Item) => {
			if (item) {
				this.linkItem = item
				this.redraw()
			}
		})

		this.addTool('unlink', 'Unlink Item', 'unlink', 'u', (item: Item) => {
			if (item && item.proto) {
				this.activeTab().do(new Actions.LinkAction(item))
			}
		})

		this.addTool('break', 'Break Item Link', 'anchor', 'b', (item: Item) => {
			if (item && item.proto) {
				this.activeTab().do(new Actions.BreakLinkAction(item))
			}
		})

		this.addToolSpacer()

		// tslint:disable-next-line:cyclomatic-complexity
		window.addEventListener('keydown', (e: KeyboardEvent) => {
			const sel: Item = this.selected()
			if (sel && (!document.activeElement || document.activeElement === document.body)) {
				let index: number = sel.parent ? sel.parent.getChildren().indexOf(sel) : -1
				switch (e.key) {
					case 'ArrowUp':
						if (index === 0) {
							this.select(sel.parent)
						} else if (index > 0) {
							let item: Item = sel.parent.getChildren()[index - 1]
							while (item.open && item.getChildren().length > 0) {
								item = item.getChildren()[item.getChildren().length - 1]
							}
							this.select(item)
						}
						break
					case 'ArrowLeft':
						if (sel.getChildren().length > 0 && sel.open) {
							sel.open = false
							this.redraw(true)
						} else if (sel.parent) {
							this.select(sel.parent)
						}
						break
					case 'ArrowRight':
						if (sel.getChildren().length > 0 && !sel.open) {
							sel.open = true
							this.redraw(true)
						} else if (sel.getChildren().length > 0) {
							this.select(sel.getChildren()[0])
						}
						break
					case 'ArrowDown':
						if (sel.getChildren().length > 0 && sel.open) {
							this.select(sel.getChildren()[0])
						} else if (sel.parent && index < sel.parent.getChildren().length - 1) {
							this.select(sel.parent.getChildren()[index + 1])
						} else if (sel.parent) {
							let item: Item = sel
							while (item.parent && index === item.parent.getChildren().length - 1) {
								item = item.parent
								index = item.parent ? item.parent.getChildren().indexOf(item) : -1
							}
							if (item && index >= 0) {
								item = item.parent.getChildren()[index + 1]
								this.select(item)
							}
						}
						break
					default:
				}
			}
		})

		this.select(this.activeTab().root)
	}

	public redraw(keepSelected: boolean = false): void {
		const sel: Item = this.selected()
		document.dispatchEvent(new Event('redraw'))
		if (keepSelected) {
			this.select(sel, true)
		} else {
			this.select(undefined, true)
		}
	}

	public select(item?: Item, skipRedraw: boolean = false): void {
		this.selectedItem = item

		this.setFieldValue('item', 'size', item)
		this.setFieldValue('item', 'name', item)
		this.setFieldValue('item', 'desc', item)

		const allEles: NodeListOf<Element> = document.body.querySelectorAll('.item')
		for (const ele of allEles) {
			ele.classList.remove('selected')
		}

		if (item) {
			const selEle: HTMLElement = document.body.querySelector(`.item[data-id="${item.id}"]:not(.proto)`) as HTMLElement
			if (selEle) {
				selEle.classList.add('selected')
			}
		}

		this.setToolEnabled('rem', item && !!item.parent)
		this.setToolEnabled('up', item && item.parent && item.parent.getChildren().indexOf(item) > 0)
		this.setToolEnabled('down', item && item.parent && item.parent.getChildren().indexOf(item) < item.parent.getChildren().length - 1)
		this.setToolEnabled('link', !!item)
		this.setToolEnabled('unlink', item && !!item.proto)
		this.setToolEnabled('break', item && !!item.proto)

		if (!skipRedraw) {
			this.redraw(true)
		}
	}

	public selected(): Item {
		return this.selectedItem
	}

	public setDirty(val: boolean = true): void {
		this.dirty = val
		document.title = `${this.project.name}${this.dirty ? '*' : ''} | Memory Mapper`
		if (this.autosaveTimeout) {
			clearTimeout(this.autosaveTimeout)
		}
		if (this.dirty) {
			this.autosaveTimeout = window.setTimeout(() => this.autosave(), AUTOSAVE_INTERVAL)
		}
	}

	// tslint:disable-next-line:no-any
	public setFieldValue(group: string, field: string, obj: any): void {
		const input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =
			document.body.querySelector(`#fields-${group} input[name="${field}"], #fields-${group} textarea[name="${field}"], #fields-${group} select[name="${field}"]`) as
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		input.disabled = !obj
		// tslint:disable-next-line:no-any
		const val: any = obj ? (obj as any)[field] : ''
		input.value = val !== undefined ? val : ''
	}

	public setToolEnabled(name: string, enabled: boolean): void {
		const tool: HTMLElement = document.body.querySelector(`#tool-${name}`) as HTMLElement
		if (enabled) {
			tool.classList.remove('disabled')
		} else {
			tool.classList.add('disabled')
		}
	}

	public shouldHighlight(item: Item): boolean {
		return item === this.linkItem || (this.selectedItem && item === this.selectedItem.proto)
	}

	public toggleOpen(id: number): void {
		this.activeTab().items[id].open = !this.activeTab().items[id].open
		this.redraw(true)
	}

	public updateProjectFields(): void {
		(document.body.querySelector('#fields-project input[name="name"]') as HTMLInputElement).value = this.project.name;
		(document.body.querySelector('#fields-project select[name="digitType"]') as HTMLSelectElement).value = this.activeTab().digitType.toString();
		(document.body.querySelector('#fields-project input[name="pad"]') as HTMLInputElement).value = this.activeTab().pad.toString();
	}
}

export const ed: Editor = new Editor()
