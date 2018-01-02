import Actions from "./actions"
import Item from "./item"
import Project from "./project"
import Tab from "./tab"

export class Editor {
    public project: Project = new Project()

    private cbItem: Item = undefined
    private container: HTMLElement
    private curTab: number = 0

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

        this.setToolEnabled('rem', item !== undefined && item.parent !== undefined)
        this.setToolEnabled('up', item !== undefined && item.parent !== undefined && item.parent.subs.indexOf(item) > 0)
        this.setToolEnabled('down', item !== undefined && item.parent !== undefined && item.parent.subs.indexOf(item) < item.parent.subs.length - 1)
    }
    
    selected() {
        let selEle = this.container.querySelector('.item.selected') as HTMLElement
        if (selEle) {
            return this.activeTab().items[parseInt(selEle.dataset.id)]
        }
        return null
    }
    
    toggleOpen(id: number) {
        this.activeTab().items[id].open = !this.activeTab().items[id].open
        this.redraw(true)
    }
    
    bindItemField(field: string) {
        let input = document.body.querySelector('#details input[name="'+field+'"], #details textarea[name="'+field+'"]') as HTMLInputElement
        input.disabled = true
        input.addEventListener('change', e => {
            let item = this.selected()
            if (item) this.activeTab().do(new Actions.ChangeFieldAction(item, field, (input.type == 'number') ? parseInt(input.value) : input.value))
        })
    }
    
    setItemField(field: string, item: Item) {
        let input = document.body.querySelector('#details input[name="'+field+'"], #details textarea[name="'+field+'"]') as HTMLInputElement
        input.disabled = !item
        if (item) input.value = (item as any)[field]
        else input.value = ""
    }
    
    bindProjectField(field: string) {
        let input = document.body.querySelector('#project input[name="'+field+'"], #project textarea[name="'+field+'"], #project select[name="'+field+'"]') as HTMLInputElement | HTMLSelectElement
        input.value = (this.project as any)[field]
        input.addEventListener('change', e => {
            if (input.tagName == 'SELECT' || input.type == 'number')
                (this.project as any)[field] = parseInt(input.value)
            else
                (this.project as any)[field] = input.value
                this.redraw(true)
            this.project.setDirty()
        })
    }
    
    getItemEle(ele: HTMLElement) {
        while (ele && !ele.classList.contains('item')) ele = ele.parentElement
        return ele
    }
    
    bindTool(name: string, key: string, action: (item: Item) => void) {
        let tool = document.body.querySelector('#tool-' + name) as HTMLElement
        tool.addEventListener('click', e => {
            action(this.selected())
        })
    
        if (key) {
            document.addEventListener('keydown', e => {
                if (!document.activeElement || document.activeElement == document.body) {
                    if (e.key == key) {
                        e.preventDefault()
                        action(this.selected())
                    }
                }
            })
        }
    }
    
    setToolEnabled(name: string, enabled: boolean) {
        let tool = document.body.querySelector('#tool-' + name) as HTMLElement
        if (enabled) tool.classList.remove('disabled')
        else tool.classList.add('disabled')
    }
    
    updateCounters() {
        document.getElementById('tool-undo').dataset.count = '' + (this.activeTab().undos.length ? this.activeTab().undos.length : '')
        document.getElementById('tool-redo').dataset.count = '' + (this.activeTab().redos.length ? this.activeTab().redos.length : '')
    }
    
    updateProjectFields() {
        (document.body.querySelector('#project input[name="name"]') as HTMLInputElement).value = this.project.name;
        (document.body.querySelector('#project select[name="digitType"]') as HTMLSelectElement).value = '' + this.project.digitType;
        (document.body.querySelector('#project input[name="pad"]') as HTMLInputElement).value = '' + this.project.pad;
    }
    
    updateTabs() {
        let out = ''
        for (let i = 0; i < this.project.tabs.length; i++) {
            if (i == this.curTab) out += '<div class="tab selected">' + this.activeTab().root.name + '</div>'
            else out += '<div class="tab" onclick="ed.changeTab('+i+')">' + this.project.tabs[i].root.name + '</div>'
        }
        out += '<div id="new-tab" class="tab" onclick="ed.addTab()"><i class="fa fa-plus"></i></div>'
        document.getElementById('tabs').innerHTML = out
    }
    
    activeTab() {
        return this.project.tabs[this.curTab]
    }
    
    changeTab(i: number) {
        this.curTab = i
        this.redraw()
        this.select(this.activeTab().root)
    }
    
    addTab() {
        let tab = new Tab()
        this.curTab = this.project.tabs.length
        this.project.tabs.push(tab)
        tab.root = new Item(0x10000, "Map " + this.project.tabs.length, "")
        tab.items.push(tab.root)
        this.redraw()
        this.select(tab.root)
    }
    
    redraw(keepSelected: boolean = false) {
        let sel = this.selected()
        this.container.innerHTML = this.activeTab().root.render()
        this.updateTabs()
        this.updateCounters()
        if (keepSelected) this.select(sel)
    }

    init() {
        this.container = document.getElementById('container')
        this.container.addEventListener('click', e => {
            let ele = this.getItemEle(e.target as HTMLElement)
            let item: Item = null
            if (ele) item = this.activeTab().items[parseInt(ele.dataset.id)]
            this.select(item)
        })
        
        this.container.addEventListener('dragstart', e => {
            let ele = this.getItemEle(e.target as HTMLElement)
            if (ele) {
                let item = this.activeTab().items[parseInt(ele.dataset.id)]
                if (item.parent) {
                    e.dataTransfer.setData('text/plain', '' + item.id)
                }else{
                    e.preventDefault()
                }
            }else{
                e.preventDefault()
            }
        })
        
        this.container.addEventListener('dragover', e => {
            e.preventDefault()
            let ele = this.getItemEle(e.target as HTMLElement)
            if (ele) {
                e.dataTransfer.dropEffect = 'move'
            }
        })
        
        this.container.addEventListener('drop', e => {
            e.preventDefault()
            let ele = this.getItemEle(e.target as HTMLElement)
            if (ele) {
                let item = this.activeTab().items[parseInt(e.dataTransfer.getData('text/plain'))]
                let parent = this.activeTab().items[parseInt(ele.dataset.id)]
        
                if (item != parent) this.activeTab().do(new Actions.MoveAction(item, parent))
            }
        })
        
        this.addTab()

        this.bindItemField('name')
        this.bindItemField('desc')
        this.bindItemField('size')

        this.bindProjectField('name')
        this.bindProjectField('digitType')
        this.bindProjectField('pad')

        this.bindTool('new', 'n', item => {})
        this.bindTool('open', 'o', item => Project.open())
        this.bindTool('save', 's', item => this.project.save())

        this.bindTool('cut', 'x', item => {
            if (item && item.parent) {
                if (this.cbItem) this.cbItem.copy(item)
                else this.cbItem = item
                this.activeTab().do(new Actions.RemoveAction(item))
                this.setToolEnabled('paste', true)
            }
        })
        this.bindTool('copy', 'c', item => {
            if (item) {
                if (!this.cbItem) this.cbItem = new Item()
                this.cbItem.copy(item)
                this.setToolEnabled('paste', true)
            }
        })
        this.bindTool('paste', 'v', item => {
            if (this.cbItem) this.activeTab().do(new Actions.AddAction(item, this.cbItem))
        })

        this.bindTool('undo', 'z', item => this.activeTab().undo())
        this.bindTool('redo', 'y', item => this.activeTab().redo())

        this.bindTool('add', 'Insert', item => this.activeTab().do(new Actions.AddAction(item)))

        this.bindTool('rem', 'Delete', item => {
            if (item && item.parent) this.activeTab().do(new Actions.RemoveAction(item))
        })

        this.bindTool('up', 'ArrowUp', item => {
            if (item && item.parent) {
                let index = item.parent.subs.indexOf(item)
                if (index > 0) this.activeTab().do(new Actions.MoveUpAction(item))
            }
        })

        this.bindTool('down', 'ArrowDown', item => {
            if (item && item.parent) {
                let index = item.parent.subs.indexOf(item)
                if (index < item.parent.subs.length - 1) this.activeTab().do(new Actions.MoveDownAction(item))
            }
        })

        this.redraw()
        this.select(this.activeTab().root)
    }
}

export default new Editor()