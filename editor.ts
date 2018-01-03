import * as Actions from "./actions"
import { Item } from "./item"
import { IProjectConfig, Project } from "./project"
import { Tab } from "./tab"

const DEC_RADIX: number = 10
const AUTOSAVE_INTERVAL: number = 2000

export class Editor {
    public project: Project

    private autosaveTimeout: number
    private cbItem: Item = null
    private container: HTMLElement
    private curTab: number = 0
    private dirty: boolean

    public activeTab(): Tab {
        return this.project.tabs[this.curTab]
    }

    public addTab(): void {
        const tab: Tab = new Tab(this.project)
        this.curTab = this.project.tabs.length - 1
        this.redraw()
        this.select(tab.root)
    }

    public autosave(): void {
        localStorage.setItem('memmap-autosave', JSON.stringify(this.project.serialize()))
        this.setDirty(false)
    }

    public bindExpander(id: string): void {
        const panel: HTMLElement = document.getElementById(id)
        const expander: HTMLElement = document.getElementById(`expander-${id}`)
        const icon: HTMLElement = expander.querySelector('i') as HTMLElement
        expander.addEventListener('click', () => {
            panel.classList.toggle('hidden')
            icon.classList.toggle('fa-chevron-left')
            icon.classList.toggle('fa-chevron-right')
        })
    }

    public bindItemField(field: string): void {
        const input: HTMLInputElement = document.body.querySelector(`#details input[name="${field}"], #details textarea[name="${field}"]`) as HTMLInputElement
        input.disabled = true
        input.addEventListener('change', () => {
            const item: Item = this.selected()
            if (item) {
                this.activeTab().do(new Actions.ChangeFieldAction(item, field, (input.type === 'number') ? parseInt(input.value, DEC_RADIX) : input.value))
            }
        })
    }

    public bindProjectField(field: string): void {
        const input: HTMLInputElement | HTMLSelectElement =
                      document.body.querySelector(`#project input[name="${field}"], #project textarea[name="${field}"], #project select[name="${field}"]`) as HTMLInputElement | HTMLSelectElement
        // tslint:disable-next-line:no-any
        input.value = (this.project as any)[field]
        input.addEventListener('change', () => {
            // tslint:disable-next-line:no-any
            (this.project as any)[field] = (input.tagName === 'SELECT' || input.type === 'number') ? parseInt(input.value, DEC_RADIX) : input.value
            this.redraw(true)
            this.setDirty()
        })
    }

    public bindTool(name: string, key: string, action: (item: Item) => void): void {
        const tool: HTMLElement = document.body.querySelector(`#tool-${name}`) as HTMLElement
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

    public changeTab(i: number): void {
        this.curTab = i
        this.redraw()
        this.select(this.activeTab().root)
    }

    public closeTab(i: number): void {
        if ((i === this.curTab && i > 0) || this.curTab === this.project.tabs.length - 1) {
            this.curTab--
        }
        this.project.tabs.splice(i, 1)
        this.redraw()
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
        this.container = document.getElementById('container')
        this.container.addEventListener('click', (e: MouseEvent) => {
            const ele: HTMLElement = this.findItemElement(e.target as HTMLElement)
            let item: Item
            if (ele) {
                item = this.activeTab().items[parseInt(ele.dataset.id, DEC_RADIX)]
            }
            this.select(item)
        })
        this.container.addEventListener('dragstart', (e: DragEvent) => {
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
        this.container.addEventListener('dragover', (e: DragEvent) => {
            e.preventDefault()
            const ele: HTMLElement = this.findItemElement(e.target as HTMLElement)
            if (ele) {
                e.dataTransfer.dropEffect = 'move'
            }
        })
        this.container.addEventListener('drop', (e: DragEvent) => {
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

        const autosave: string = localStorage.getItem('memmap-autosave')
        this.project = autosave ? Project.deserialize(JSON.parse(autosave) as IProjectConfig) : new Project()
        this.autosave()

        window.addEventListener('beforeunload', () => {
            this.autosave()
        })

        this.bindItemField('name')
        this.bindItemField('desc')
        this.bindItemField('size')

        this.bindProjectField('name')
        this.bindProjectField('digitType')
        this.bindProjectField('pad')

        this.bindTool('new', 'n', () => {
            if (confirm('You will lose all autosaved data if you start a new project. Continue?')) {
                this.project = new Project()
                this.redraw()
            }
        })
        this.bindTool('open', 'o', () => Project.open())
        this.bindTool('save', 's', () => this.project.save())

        this.bindTool('cut', 'x', (item: Item) => {
            if (item && item.parent) {
                if (this.cbItem) {
                    this.cbItem.copy(item)
                } else {
                    this.cbItem = item
                }
                this.activeTab().do(new Actions.RemoveAction(item))
                this.setToolEnabled('paste', true)
            }
        })
        this.bindTool('copy', 'c', (item: Item) => {
            if (item) {
                if (!this.cbItem) {
                    this.cbItem = new Item(ed.activeTab())
                }
                this.cbItem.copy(item)
                this.setToolEnabled('paste', true)
            }
        })
        this.bindTool('paste', 'v', (item: Item) => {
            if (this.cbItem) {
                this.activeTab().do(new Actions.AddAction(item, this.cbItem))
            }
        })

        this.bindTool('undo', 'z', () => this.activeTab().undo())
        this.bindTool('redo', 'y', () => this.activeTab().redo())

        this.bindTool('add', 'Insert', (item: Item) => this.activeTab().do(new Actions.AddAction(item)))
        this.bindTool('rem', 'Delete', (item: Item) => {
            if (item && item.parent) {
                this.activeTab().do(new Actions.RemoveAction(item))
            }
        })
        this.bindTool('up', 'ArrowUp', (item: Item) => {
            if (item && item.parent) {
                const index: number = item.parent.subs.indexOf(item)
                if (index > 0) {
                    this.activeTab().do(new Actions.MoveUpAction(item))
                }
            }
        })
        this.bindTool('down', 'ArrowDown', (item: Item) => {
            if (item && item.parent) {
                const index: number = item.parent.subs.indexOf(item)
                if (index < item.parent.subs.length - 1) {
                    this.activeTab().do(new Actions.MoveDownAction(item))
                }
            }
        })

        this.bindExpander('details')
        this.bindExpander('project')

        this.redraw()
        this.select(this.activeTab().root)
    }

    public redraw(keepSelected: boolean = false): void {
        const sel: Item = this.selected()
        this.container.innerHTML = this.activeTab().root.render()
        this.updateTabs()
        this.updateCounters()
        if (keepSelected) {
            this.select(sel)
        }
    }

    public select(item?: Item): void {
        this.setItemField('size', item)
        this.setItemField('name', item)
        this.setItemField('desc', item)

        const allEles: NodeListOf<Element> = document.body.querySelectorAll('.item')
        for (const ele of allEles) {
            ele.classList.remove('selected')
        }

        if (item) {
            const selEle: HTMLElement = this.container.querySelector(`.item[data-id="${item.id}"]`) as HTMLElement
            if (selEle) {
                selEle.classList.add('selected')
            }
        }

        this.setToolEnabled('rem', !!item && item.parent !== null)
        this.setToolEnabled('up', !!item && item.parent !== null && item.parent.subs.indexOf(item) > 0)
        this.setToolEnabled('down', !!item && item.parent !== null && item.parent.subs.indexOf(item) < item.parent.subs.length - 1)
    }

    public selected(): Item {
        const selEle: HTMLElement = this.container.querySelector('.item.selected') as HTMLElement
        if (selEle) {
            return this.activeTab().items[parseInt(selEle.dataset.id, DEC_RADIX)]
        }
        return null
    }

    public setDirty(val: boolean = true): void {
        this.dirty = val
        document.title = `${this.project.name}${this.dirty ? '*' : ''} | Memory Mapper`
        if (this.autosaveTimeout) {
            clearTimeout(this.autosaveTimeout)
        }
        if (this.dirty) {
            this.autosaveTimeout = setTimeout(() => this.autosave(), AUTOSAVE_INTERVAL)
        }
    }

    public setItemField(field: string, item: Item): void {
        const input: HTMLInputElement = document.body.querySelector(`#details input[name="${field}"], #details textarea[name="${field}"]`) as HTMLInputElement
        input.disabled = !item
        // tslint:disable-next-line:no-any
        input.value = item ? (item as any)[field] : ''
    }

    public setToolEnabled(name: string, enabled: boolean): void {
        const tool: HTMLElement = document.body.querySelector(`#tool-${name}`) as HTMLElement
        if (enabled) {
            tool.classList.remove('disabled')
        } else {
            tool.classList.add('disabled')
        }
    }

    public toggleOpen(id: number): void {
        this.activeTab().items[id].open = !this.activeTab().items[id].open
        this.redraw(true)
    }

    public updateCounters(): void {
        document.getElementById('tool-undo').dataset.count = (this.activeTab().undos.length ? this.activeTab().undos.length : '').toString()
        document.getElementById('tool-redo').dataset.count = (this.activeTab().redos.length ? this.activeTab().redos.length : '').toString()
    }

    public updateProjectFields(): void {
        (document.body.querySelector('#project input[name="name"]') as HTMLInputElement).value = this.project.name;
        (document.body.querySelector('#project select[name="digitType"]') as HTMLSelectElement).value = this.project.digitType.toString();
        (document.body.querySelector('#project input[name="pad"]') as HTMLInputElement).value = this.project.pad.toString();
    }

    public updateTabs(): void {
        let out: string = ''
        for (let i: number = 0; i < this.project.tabs.length; i++) {
            if (i === this.curTab) {
                out += `<div class="tab selected">${this.activeTab().root.name}`
            } else {
                out += `<div class="tab" onclick="ed.changeTab(${i})">${this.project.tabs[i].root.name}`
            }
            if (this.project.tabs.length > 1) {
                out += `<i class="fa fa-close" onclick="ed.closeTab(${i})"></i>`
            }
            out += '</div>'
        }
        out += '<div id="new-tab" class="tab" onclick="ed.addTab()"><i class="fa fa-plus"></i></div>'
        document.getElementById('tabs').innerHTML = out
    }
}

export const ed: Editor = new Editor()
