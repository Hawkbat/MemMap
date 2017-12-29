
abstract class Action {
    static undos: Action[] = []
    static redos: Action[] = []

    static redo() {
        if (Action.redos.length > 0) {
            let act = Action.redos.pop()
            act.redo()
            Action.undos.push(act)
            Action.updateCounters()
        }
    }

    static undo() {
        if (Action.undos.length > 0) {
            let act = Action.undos.pop()
            act.undo()
            Action.redos.push(act)
            Action.updateCounters()
        }
    }

    static do(act: Action): void {
        act.do()
        Action.redos.length = 0
        Action.undos.push(act)
        Action.updateCounters()
    }

    static updateCounters() {
        document.getElementById('tool-undo').dataset.count = '' + Action.undos.length
        document.getElementById('tool-redo').dataset.count = '' + Action.redos.length
    }

    protected abstract do(): void
    protected abstract redo(): void
    protected abstract undo(): void
}

class AddAction extends Action {
    item: Item
    parent: Item

    constructor(parent: Item) {
        super()
        this.parent = (parent == null) ? Item.root : parent
    }

    do() {
        this.item = new Item(0, '', '')
        this.item.name = 'Item ' + this.item.id
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

    parent: Item
    id: number

    static root: Item
    static items: Item[] = []

    constructor(size: number, name: string, desc: string, subs: Item[] = []) {
        this.size = size
        this.name = name
        this.desc = desc
        this.subs = subs
        for (let i = 0; i < this.subs.length; i ++) this.subs[i].parent = this
        this.id = Item.items.length
        Item.items.push(this)
    }

    render(start: number = 0, depth: number = 0): string {
        let out = ''
        out += '<div class="col">'
        out += '<div class="row item" draggable="true" data-id="' + this.id + '">'
        if (this.size > 0) out += '<div class="cell">' + toHex(start) + '-' + toHex(start + this.size - 1) + ':</div>'
        if (this.desc)
            out += '<div class="cell">' + this.name + ' (' + this.desc + ')</div>'
        else
            out += '<div class="cell">' + this.name + '</div>'
        out += '</div>'
        for (let i = 0; i < this.subs.length; i ++) {
            out += this.subs[i].render(start, depth + 1)
            start += this.subs[i].size
        }
        out += '</div>'
        return out
    }
}

function toHex(num: number) {
    let str = num.toString(16).toUpperCase()
    while (str.length < 4 || (str.length % 2) == 1) str = "0" + str
    return '0x' + str
}

function select(item: Item) {
    setInput('size', item)
    setInput('name', item)
    setInput('desc', item)

    let allEles = document.body.querySelectorAll('.item')
    for (let i = 0; i < allEles.length; i ++) allEles[i].classList.remove('selected')

    if (item) {
        let selEle = container.querySelector('.item[data-id="' + item.id + '"]') as HTMLElement
        if (selEle) selEle.classList.add('selected')
    }
}

function getSelected() {
    let selEle = container.querySelector('.item.selected') as HTMLElement
    if (selEle) {
        return Item.items[parseInt(selEle.dataset.id)]
    }
    return null
}

function bindInput(field: string) {
    let input = document.body.querySelector('input[name="'+field+'"], textarea[name="'+field+'"]') as HTMLInputElement
    input.disabled = true
    input.addEventListener('change', e => {
        let item = getSelected()
        if (item) Action.do(new ChangeFieldAction(item, field, (input.type == 'number') ? parseInt(input.value) : input.value))
    })
}

function setInput(field: string, item: Item) {
    let input = document.body.querySelector('input[name="'+field+'"], textarea[name="'+field+'"]') as HTMLInputElement
    input.disabled = !item
    if (item) input.value = (item as any)[field]
    else input.value = ""
}

function getItemEle(ele: HTMLElement) {
    while (ele && !ele.classList.contains('item')) ele = ele.parentElement
    return ele
}

function bindTool(name: string, key: string, action: (item: Item) => void) {
    let tool = document.body.querySelector('#tool-' + name) as HTMLElement
    tool.addEventListener('click', e => {
        action(getSelected())
    })

    if (key) {
        document.addEventListener('keydown', e => {
            if (!document.activeElement || document.activeElement == document.body) {
                if (e.key == key) {
                    e.preventDefault()
                    action(getSelected())
                }
            }
        })
    }
}

function updateTabs() {
    let out = ''
    out += '<div class="tab selected">' + Item.root.name + '</div>'
    out += '<div id="new-tab" class="tab"><i class="fa fa-plus"></i></div>'
    document.getElementById('tabs').innerHTML = out
}

function redraw() {
    container.innerHTML = Item.root.render()
    updateTabs()
}

Item.root = new Item(0x10000, "Map 1", "")

let container = document.getElementById('container')
container.addEventListener('click', e => {
    let ele = getItemEle(e.target as HTMLElement)
    let item: Item = null
    if (ele) item = Item.items[parseInt(ele.dataset.id)]
    select(item)
})

container.addEventListener('dragstart', e => {
    let ele = getItemEle(e.target as HTMLElement)
    if (ele) {
        let item = Item.items[parseInt(ele.dataset.id)]
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
        let item = Item.items[parseInt(e.dataTransfer.getData('text/plain'))]
        let parent = Item.items[parseInt(ele.dataset.id)]

        if (item != parent) Action.do(new MoveAction(item, parent))
    }
})

bindInput('name')
bindInput('desc')
bindInput('size')

bindTool('undo', 'z', item => Action.undo())
bindTool('redo', 'y', item => Action.redo())

bindTool('add', '', item => Action.do(new AddAction(item)))

bindTool('rem', '', item => {
    if (item && item.parent) Action.do(new RemoveAction(item))
})

bindTool('up', '', item => {
    if (item && item.parent) {
        let index = item.parent.subs.indexOf(item)
        if (index > 0) Action.do(new MoveUpAction(item))
    }
})

bindTool('down', '', item => {
    if (item && item.parent) {
        let index = item.parent.subs.indexOf(item)
        if (index < item.parent.subs.length - 1) Action.do(new MoveDownAction(item))
    }
})

redraw()
select(Item.root)