import { ed } from "./editor"
import { DigitType } from "./enums"
import { Tab } from "./tab"

const HEX_RADIX: number = 16
const ODD_MOD: number = 2

export interface IItemConfig {
    desc: string
    name: string
    size: number
    subs: IItemConfig[]
}

export class Item {

    public static deserialize(tab: Tab, conf: IItemConfig): Item {
        const t: Item = new Item(tab, conf.size, conf.name, conf.desc)
        t.subs = conf.subs.map((s: IItemConfig) => Item.deserialize(tab, s))
        for (const sub of t.subs) {
            sub.parent = t
        }
        t.id = tab.items.length
        tab.items.push(t)
        return t
    }

    public desc: string
    public id: number
    public name: string
    public open: boolean = true
    public parent: Item = null
    public size: number
    public subs: Item[]

    private tab: Tab

    public constructor(tab: Tab, size: number = 0, name: string = '', desc: string = '', subs: Item[] = []) {
        this.size = size
        this.name = name
        this.desc = desc
        this.subs = subs
        for (const sub of this.subs) {
            sub.parent = this
        }
        this.tab = tab
        this.id = tab.items.length
        tab.items.push(this)
    }

    public copy(src: Item): void {
        this.size = src.size
        this.name = src.name
        this.desc = src.desc
        for (const sub of this.subs) {
            sub.parent = null
        }
        this.subs = []
        for (const sub of this.subs) {
            const child: Item = new Item(this.tab)
            child.copy(sub)
            child.parent = this
            this.subs.push(child)
        }
    }

    public render(start: number = 0, depth: number = 0): string {
        let out: string = ''
        out += '<div class="col">'
        out += `<div class="row item" draggable="true" data-id="${this.id}">`
        if (this.subs.length > 0) {
            out += `<i class="fa fa-fw fa-lg fa-caret-${this.open ? 'down' : 'right'}" onclick="ed.toggleOpen(${this.id})"></i>`
        } else {
            out += '<i></i>'
        }
        if (this.size > 0) {
            out += `<div class="cell">${this.formatNum(start)}-${this.formatNum(start + this.size - 1)}:</div>`
        }
        if (this.desc) {
            out += `<div class="cell">${this.name} (${this.desc})</div>`
        } else {
            out += `<div class="cell">${this.name}</div>`
        }
        out += '</div>'
        if (this.open) {
            let subStart: number = start
            for (const sub of this.subs) {
                out += sub.render(subStart, depth + 1)
                subStart += sub.size
            }
        }
        out += '</div>'
        return out
    }

    public serialize(): IItemConfig {
        return { size: this.size, name: this.name, desc: this.desc, subs: this.subs.map((v: Item) => v.serialize()) }
    }

    private formatNum(num: number): string {
        if (ed.project.digitType === DigitType.Hexadecimal) {
            let str: string = num.toString(HEX_RADIX).toUpperCase()
            while (str.length < ed.project.pad || (str.length % ODD_MOD) === 1) {
                str = `0${str}`
            }
            return `0x${str}`
        } else if (ed.project.digitType === DigitType.Decimal) {
            let str: string = num.toString()
            while (str.length < ed.project.pad) {
                str = `0${str}`
            }
            return str
        }
    }
}
