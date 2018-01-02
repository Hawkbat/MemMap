
abstract class Action {
    abstract do(): void
    abstract redo(): void
    abstract undo(): void
}

class AddAction extends Action {
    item: Item
    parent: Item
    src: Item

    constructor(parent: Item, src: Item = null) {
        super()
        this.parent = (parent == null) ? activeTab().root : parent
        this.src = src
    }

    do() {
        this.item = new Item()
        this.item.name = 'Item ' + this.item.id
        if (this.src) this.item.copy(this.src)
        this.item.parent = this.parent
        this.parent.subs.push(this.item)
        redraw()
        select(this.item)
    }

    undo() {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1)
        this.item.parent = null
        redraw()
        select(null)
    }

    redo() {
        this.item.parent = this.parent
        this.parent.subs.push(this.item)
        redraw()
        select(this.item)
    }
}

class RemoveAction extends Action {
    item: Item
    index: number
    parent: Item

    constructor(item: Item) {
        super()
        this.item = item
    }

    do() {
        this.parent = this.item.parent
        this.index = this.item.parent.subs.indexOf(this.item)
        this.item.parent.subs.splice(this.index, 1)
        this.item.parent = null
        redraw()
        select(null)
    }

    undo() {
        this.item.parent = this.parent
        this.parent.subs.splice(this.index, 0, this.item)
        redraw()
        select(this.item)
    }

    redo() {
        this.do()
    }
}

class MoveAction extends Action {
    item: Item
    oldIndex: number
    oldParent: Item
    newParent: Item

    constructor(item: Item, parent: Item) {
        super()
        this.item = item
        this.oldIndex = item.parent.subs.indexOf(item)
        this.oldParent = item.parent
        this.newParent = parent
    }

    do() {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1)
        this.item.parent = this.newParent
        this.newParent.subs.push(this.item)
        redraw()
        select(this.item)
    }

    undo() {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1)
        this.item.parent = this.oldParent
        this.oldParent.subs.splice(this.oldIndex, 0, this.item)
        redraw()
        select(this.item)
    }

    redo() {
        this.do()
    }
}

class MoveUpAction extends Action {
    item: Item
    index: number

    constructor(item: Item) {
        super()
        this.item = item
    }

    do() {
        this.index = this.item.parent.subs.indexOf(this.item)
        this.item.parent.subs.splice(this.index, 1)
        this.item.parent.subs.splice(this.index - 1, 0, this.item)
        redraw()
        select(this.item)
    }

    undo() {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1)
        this.item.parent.subs.splice(this.index, 0, this.item)
        redraw()
        select(this.item)
    }

    redo() {
        this.do()
    }
}

class MoveDownAction extends Action {
    item: Item
    index: number

    constructor(item: Item) {
        super()
        this.item = item
    }

    do() {
        this.index = this.item.parent.subs.indexOf(this.item)
        this.item.parent.subs.splice(this.index, 1)
        this.item.parent.subs.splice(this.index + 1, 0, this.item)
        redraw()
        select(this.item)
    }

    undo() {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1)
        this.item.parent.subs.splice(this.index, 0, this.item)
        redraw()
        select(this.item)
    }

    redo() {
        this.do()
    }
}

class ChangeFieldAction extends Action {
    item: Item
    field: string
    oldValue: any
    newValue: any

    constructor(item: Item, field: string, value: any) {
        super()
        this.item = item
        this.field = field
        this.oldValue = (this.item as any)[field]
        this.newValue = value
    }

    do() {
        (this.item as any)[this.field] = this.newValue
        redraw()
        select(this.item)
    }

    undo() {
        (this.item as any)[this.field] = this.oldValue
        redraw()
        select(this.item)
    }

    redo() {
        this.do()
    }
}

class Item {
    size: number
    name: string
    desc: string
    subs: Item[]

    open: boolean = true

    parent: Item
    id: number

    constructor(size: number = 0, name: string = '', desc: string = '', subs: Item[] = []) {
        this.size = size
        this.name = name
        this.desc = desc
        this.subs = subs
        for (let i = 0; i < this.subs.length; i ++) this.subs[i].parent = this
        this.id = activeTab().items.length
        activeTab().items.push(this)
    }

    copy(src: Item) {
        this.size = src.size
        this.name = src.name
        this.desc = src.desc
        for (let i = 0; i < this.subs.length; i ++) this.subs[i].parent = null
        this.subs = []
        for (let i = 0; i < src.subs.length; i ++) {
            let child = new Item()
            child.copy(src.subs[i])
            child.parent = this
            this.subs.push(child)
        }
    }

    render(start: number = 0, depth: number = 0): string {
        let out = ''
        out += '<div class="col">'
        out += '<div class="row item" draggable="true" data-id="' + this.id + '">'
        if (this.subs.length > 0) {
            if (this.open) out += '<i class="fa fa-fw fa-lg fa-caret-down" onclick="toggleOpen('+this.id+')"></i>'
            else out += '<i class="fa fa-fw fa-lg fa-caret-right" onclick="toggleOpen('+this.id+')"></i>'
        }else{
            out += '<i></i>'
        }
        if (this.size > 0) out += '<div class="cell">' + formatNum(start) + '-' + formatNum(start + this.size - 1) + ':</div>'
        if (this.desc)
            out += '<div class="cell">' + this.name + ' (' + this.desc + ')</div>'
        else
            out += '<div class="cell">' + this.name + '</div>'
        out += '</div>'
        if (this.open) {
            for (let i = 0; i < this.subs.length; i ++) {
                out += this.subs[i].render(start, depth + 1)
                start += this.subs[i].size
            }
        }
        out += '</div>'
        return out
    }

    static deserialize(tab: Tab, conf: any): Item {
        let t = new Item()
        t.size = conf.size
        t.name = conf.name
        t.desc = conf.desc
        t.subs = conf.subs.map((s: any) => Item.deserialize(tab, s))
        t.id = tab.items.length
        tab.items.push(t)
        return t
    }

    serialize(): any {
        return { size: this.size, name: this.name, desc: this.desc, subs: this.subs.map(v => v.serialize()) }
    }
}

class Tab {
    root: Item
    items: Item[] = []
    undos: Action[] = []
    redos: Action[] = []

    redo() {
        if (this.redos.length > 0) {
            let act = this.redos.pop()
            act.redo()
            this.undos.push(act)
            updateCounters()
            setToolEnabled('undo', this.undos.length > 0)
            setToolEnabled('redo', this.redos.length > 0)
            project.setDirty()
        }
    }

    undo() {
        if (this.undos.length > 0) {
            let act = this.undos.pop()
            act.undo()
            this.redos.push(act)
            updateCounters()
            setToolEnabled('undo', this.undos.length > 0)
            setToolEnabled('redo', this.redos.length > 0)
            project.setDirty()
        }
    }

    do(act: Action): void {
        act.do()
        this.redos.length = 0
        this.undos.push(act)
        updateCounters()
        setToolEnabled('undo', this.undos.length > 0)
        setToolEnabled('redo', this.redos.length > 0)
        project.setDirty()
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

enum DigitType {
    Hexadecimal = 0,
    Decimal = 1
}

class Project {
    tabs: Tab[] = []
    name: string = 'New Project'
    digitType: DigitType = DigitType.Hexadecimal
    pad: number = 4

    dirty: boolean = false

    constructor() {
        this.setDirty()
    }

    setDirty(val: boolean = true) {
        this.dirty = val
        if (val)
            document.title = this.name + "* | Memory Mapper"
        else
            document.title = this.name + " | Memory Mapper"
    }

    static deserialize(conf: any): Project {
        let p = new Project()
        p.name = conf.name
        p.digitType = conf.digitType
        p.pad = conf.pad
        p.tabs = conf.tabs.map((t: any) => Tab.deserialize(t))
        return p
    }

    serialize() {
        return { name: this.name, digitType: this.digitType, pad: this.pad, tabs: this.tabs.map(tab => tab.serialize()) }
    }

    static open() {
        let n = document.createElement('input')
        n.setAttribute('type', 'file')
        n.setAttribute('accept', '.memmap.json')
        n.addEventListener('change', e => {
            if (n.files.length > 0) {
                let r = new FileReader()
                r.addEventListener('load', ev => {
                    project = Project.deserialize(JSON.parse(r.result))
                    redraw()
                    updateProjectFields()
                    project.setDirty(false)
                })
                r.readAsText(n.files[0], 'utf-8')
            }
        })
        n.click()
    }

    save() {
        let out = JSON.stringify(this.serialize())
        let a = document.createElement('a')
        a.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(out))
        a.setAttribute('download', this.name + '.memmap.json')
        a.click()
        this.setDirty(false)
    }
}

function formatNum(num: number) {
    if (project.digitType == DigitType.Hexadecimal) {
        let str = num.toString(16).toUpperCase()
        while (str.length < project.pad || (str.length % 2) == 1) str = "0" + str
        return '0x' + str
    }else if (project.digitType == DigitType.Decimal) {
        let str = num.toString()
        while (str.length < project.pad) str = "0" + str
        return str
    }
}

function select(item: Item) {
    setItemField('size', item)
    setItemField('name', item)
    setItemField('desc', item)

    let allEles = document.body.querySelectorAll('.item')
    for (let i = 0; i < allEles.length; i ++) allEles[i].classList.remove('selected')

    if (item) {
        let selEle = container.querySelector('.item[data-id="' + item.id + '"]') as HTMLElement
        if (selEle) selEle.classList.add('selected')
    }
    
    setToolEnabled('rem', item != null && item.parent != null)
    setToolEnabled('up', item != null && item.parent != null && item.parent.subs.indexOf(item) > 0)
    setToolEnabled('down', item != null && item.parent != null && item.parent.subs.indexOf(item) < item.parent.subs.length - 1)
}

function selected() {
    let selEle = container.querySelector('.item.selected') as HTMLElement
    if (selEle) {
        return activeTab().items[parseInt(selEle.dataset.id)]
    }
    return null
}

function toggleOpen(id: number) {
    activeTab().items[id].open = !activeTab().items[id].open
    redraw(true)
}

function bindItemField(field: string) {
    let input = document.body.querySelector('#details input[name="'+field+'"], #details textarea[name="'+field+'"]') as HTMLInputElement
    input.disabled = true
    input.addEventListener('change', e => {
        let item = selected()
        if (item) activeTab().do(new ChangeFieldAction(item, field, (input.type == 'number') ? parseInt(input.value) : input.value))
    })
}

function setItemField(field: string, item: Item) {
    let input = document.body.querySelector('#details input[name="'+field+'"], #details textarea[name="'+field+'"]') as HTMLInputElement
    input.disabled = !item
    if (item) input.value = (item as any)[field]
    else input.value = ""
}

function bindProjectField(field: string) {
    let input = document.body.querySelector('#project input[name="'+field+'"], #project textarea[name="'+field+'"], #project select[name="'+field+'"]') as HTMLInputElement | HTMLSelectElement
    input.value = (project as any)[field]
    input.addEventListener('change', e => {
        if (input.tagName == 'SELECT' || input.type == 'number')
            (project as any)[field] = parseInt(input.value)
        else
            (project as any)[field] = input.value
        redraw(true)
        project.setDirty()
    })
}

function getItemEle(ele: HTMLElement) {
    while (ele && !ele.classList.contains('item')) ele = ele.parentElement
    return ele
}

function bindTool(name: string, key: string, action: (item: Item) => void) {
    let tool = document.body.querySelector('#tool-' + name) as HTMLElement
    tool.addEventListener('click', e => {
        action(selected())
    })

    if (key) {
        document.addEventListener('keydown', e => {
            if (!document.activeElement || document.activeElement == document.body) {
                if (e.key == key) {
                    e.preventDefault()
                    action(selected())
                }
            }
        })
    }
}

function setToolEnabled(name: string, enabled: boolean) {
    let tool = document.body.querySelector('#tool-' + name) as HTMLElement
    if (enabled) tool.classList.remove('disabled')
    else tool.classList.add('disabled')
}

function updateCounters() {
    document.getElementById('tool-undo').dataset.count = '' + (activeTab().undos.length ? activeTab().undos.length : '')
    document.getElementById('tool-redo').dataset.count = '' + (activeTab().redos.length ? activeTab().redos.length : '')
}

function updateProjectFields() {
    (document.body.querySelector('#project input[name="name"]') as HTMLInputElement).value = project.name;
    (document.body.querySelector('#project select[name="digitType"]') as HTMLSelectElement).value = '' + project.digitType;
    (document.body.querySelector('#project input[name="pad"]') as HTMLInputElement).value = '' + project.pad;
}

function updateTabs() {
    let out = ''
    for (let i = 0; i < project.tabs.length; i++) {
        if (i == curTab) out += '<div class="tab selected">' + activeTab().root.name + '</div>'
        else out += '<div class="tab" onclick="changeTab('+i+')">' + project.tabs[i].root.name + '</div>'
    }
    out += '<div id="new-tab" class="tab" onclick="addTab()"><i class="fa fa-plus"></i></div>'
    document.getElementById('tabs').innerHTML = out
}

function activeTab() {
    return project.tabs[curTab]
}

function changeTab(i: number) {
    curTab = i
    redraw()
    select(activeTab().root)
}

function addTab() {
    let tab = new Tab()
    curTab = project.tabs.length
    project.tabs.push(tab)
    tab.root = new Item(0x10000, "Map " + project.tabs.length, "")
    tab.items.push(tab.root)
    redraw()
    select(tab.root)
}

function redraw(keepSelected: boolean = false) {
    let sel = selected()
    container.innerHTML = activeTab().root.render()
    updateTabs()
    updateCounters()
    if (keepSelected) select(sel)
}

let container = document.getElementById('container')
container.addEventListener('click', e => {
    let ele = getItemEle(e.target as HTMLElement)
    let item: Item = null
    if (ele) item = activeTab().items[parseInt(ele.dataset.id)]
    select(item)
})

container.addEventListener('dragstart', e => {
    let ele = getItemEle(e.target as HTMLElement)
    if (ele) {
        let item = activeTab().items[parseInt(ele.dataset.id)]
        if (item.parent) {
            e.dataTransfer.setData('text/plain', '' + item.id)
        }else{
            e.preventDefault()
        }
    }else{
        e.preventDefault()
    }
})

container.addEventListener('dragover', e => {
    e.preventDefault()
    let ele = getItemEle(e.target as HTMLElement)
    if (ele) {
        e.dataTransfer.dropEffect = 'move'
    }
})

container.addEventListener('drop', e => {
    e.preventDefault()
    let ele = getItemEle(e.target as HTMLElement)
    if (ele) {
        let item = activeTab().items[parseInt(e.dataTransfer.getData('text/plain'))]
        let parent = activeTab().items[parseInt(ele.dataset.id)]

        if (item != parent) activeTab().do(new MoveAction(item, parent))
    }
})

let curTab = 0

let project = new Project()
addTab()

bindItemField('name')
bindItemField('desc')
bindItemField('size')

bindProjectField('name')
bindProjectField('digitType')
bindProjectField('pad')

bindTool('new', 'n', item => {})
bindTool('open', 'o', item => Project.open())
bindTool('save', 's', item => project.save())

let cbItem: Item = null

bindTool('cut', 'x', item => {
    if (item && item.parent) {
        if (cbItem) cbItem.copy(item)
        else cbItem = item
        activeTab().do(new RemoveAction(item))
        setToolEnabled('paste', true)
    }
})
bindTool('copy', 'c', item => {
    if (item) {
        if (!cbItem) cbItem = new Item()
        cbItem.copy(item)
        setToolEnabled('paste', true)
    }
})
bindTool('paste', 'v', item => {
    if (cbItem) activeTab().do(new AddAction(item, cbItem))
})

bindTool('undo', 'z', item => activeTab().undo())
bindTool('redo', 'y', item => activeTab().redo())

bindTool('add', 'Insert', item => activeTab().do(new AddAction(item)))

bindTool('rem', 'Delete', item => {
    if (item && item.parent) activeTab().do(new RemoveAction(item))
})

bindTool('up', 'ArrowUp', item => {
    if (item && item.parent) {
        let index = item.parent.subs.indexOf(item)
        if (index > 0) activeTab().do(new MoveUpAction(item))
    }
})

bindTool('down', 'ArrowDown', item => {
    if (item && item.parent) {
        let index = item.parent.subs.indexOf(item)
        if (index < item.parent.subs.length - 1) activeTab().do(new MoveDownAction(item))
    }
})

redraw()
select(activeTab().root)