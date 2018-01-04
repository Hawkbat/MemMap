import { ed } from './editor.js';
import { DigitType } from './enums.js';
const HEX_RADIX = 16;
const ODD_MOD = 2;
export class Item {
    constructor(tab, size = 0, name = '', desc = '', subs = []) {
        this.open = true;
        this.parent = null;
        this.size = size;
        this.name = name;
        this.desc = desc;
        this.subs = subs;
        for (const sub of this.subs) {
            sub.parent = this;
        }
        this.tab = tab;
        this.id = tab.items.length;
        tab.items.push(this);
    }
    static deserialize(tab, conf) {
        const t = new Item(tab, conf.size, conf.name, conf.desc);
        t.subs = conf.subs.map((s) => Item.deserialize(tab, s));
        for (const sub of t.subs) {
            sub.parent = t;
        }
        t.id = tab.items.length;
        tab.items.push(t);
        return t;
    }
    copy(src) {
        this.size = src.size;
        this.name = src.name;
        this.desc = src.desc;
        for (const sub of this.subs) {
            sub.parent = null;
        }
        this.subs = [];
        for (const sub of this.subs) {
            const child = new Item(this.tab);
            child.copy(sub);
            child.parent = this;
            this.subs.push(child);
        }
    }
    render(start = 0, depth = 0) {
        let out = '';
        out += '<div class="col">';
        out += `<div class="row item" draggable="true" data-id="${this.id}">`;
        if (this.subs.length > 0) {
            out += `<i class="fa fa-fw fa-lg fa-caret-${this.open ? 'down' : 'right'}" onclick="ed.toggleOpen(${this.id})"></i>`;
        }
        else {
            out += '<i></i>';
        }
        if (this.size > 0) {
            out += `<div class="cell">${this.formatNum(start)}-${this.formatNum(start + this.size - 1)}:</div>`;
        }
        if (this.desc) {
            out += `<div class="cell">${this.name} (${this.desc})</div>`;
        }
        else {
            out += `<div class="cell">${this.name}</div>`;
        }
        out += '</div>';
        if (this.open) {
            let subStart = start;
            for (const sub of this.subs) {
                out += sub.render(subStart, depth + 1);
                subStart += sub.size;
            }
        }
        out += '</div>';
        return out;
    }
    serialize() {
        return { size: this.size, name: this.name, desc: this.desc, subs: this.subs.map((v) => v.serialize()) };
    }
    formatNum(num) {
        if (ed.activeTab().digitType === DigitType.Hexadecimal) {
            let str = num.toString(HEX_RADIX).toUpperCase();
            while (str.length < ed.activeTab().pad || (str.length % ODD_MOD) === 1) {
                str = `0${str}`;
            }
            return `0x${str}`;
        }
        else if (ed.activeTab().digitType === DigitType.Decimal) {
            let str = num.toString();
            while (str.length < ed.activeTab().pad) {
                str = `0${str}`;
            }
            return str;
        }
    }
}
//# sourceMappingURL=item.js.map