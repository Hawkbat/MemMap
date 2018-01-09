import { ed } from './editor.js';
import { DigitType } from './enums.js';
const HEX_RADIX = 16;
export class Item {
    constructor(tab, size, name, desc, subs, uuid) {
        this.open = true;
        this.size = size;
        this.name = name;
        this.desc = desc;
        this.subs = subs;
        if (this.subs) {
            for (const sub of this.subs) {
                sub.parent = this;
            }
        }
        this.tab = tab;
        this.id = tab.items.length;
        this.uuid = uuid ? uuid : Date.now() + Math.random();
        Item.byUUID[this.uuid] = this;
        tab.items.push(this);
    }
    static deserialize(tab, conf) {
        const t = new Item(tab, conf.size, conf.name, conf.desc, undefined, conf.uuid);
        if (conf.subs) {
            t.subs = conf.subs.map((s) => Item.deserialize(tab, s));
            for (const sub of t.subs) {
                sub.parent = t;
            }
        }
        if (conf.proto) {
            tab.tempProtoMap[t.uuid] = conf.proto;
        }
        t.id = tab.items.length;
        tab.items.push(t);
        return t;
    }
    addChild(child) {
        child.unparent();
        if (!this.subs) {
            this.subs = [];
        }
        this.subs.push(child);
        child.parent = this;
        return this.subs.length - 1;
    }
    deepCopy(src) {
        this.size = src.size;
        this.name = src.name;
        this.desc = src.desc;
        if (this.subs) {
            for (const sub of this.subs) {
                sub.parent = null;
            }
            this.subs = [];
            for (const sub of this.subs) {
                const child = new Item(this.tab);
                child.deepCopy(sub);
                child.parent = this;
                this.subs.push(child);
            }
        }
    }
    getChildren(depth = 0) {
        return this.subs ? this.subs : this.proto && depth < ed.project.depthLimit ? this.proto.getChildren(depth + 1) : [];
    }
    getDesc(depth = 0) {
        return this.desc ? this.desc : this.proto && depth < ed.project.depthLimit ? this.proto.getDesc(depth + 1) : '';
    }
    getName(depth = 0) {
        return this.name ? this.name : this.proto && depth < ed.project.depthLimit ? this.proto.getName(depth + 1) : '';
    }
    getSize(depth = 0) {
        return this.size ? this.size : this.proto && depth < ed.project.depthLimit ? this.proto.getSize(depth + 1) : 0;
    }
    insertChild(child, index) {
        child.unparent();
        if (!this.subs) {
            this.subs = [];
        }
        this.subs.splice(index, 0, child);
        child.parent = this;
        return this.subs.indexOf(child);
    }
    isChildOf(item) {
        let parent = this.parent;
        while (parent) {
            if (parent === item) {
                return true;
            }
            parent = parent.parent;
        }
        return false;
    }
    isRecursive() {
        return this.proto && this.isChildOf(this.proto);
    }
    removeChild(child) {
        const index = this.subs.indexOf(child);
        this.subs.splice(index, 1);
        child.parent = null;
        if (this.subs.length === 0) {
            this.subs = undefined;
        }
        return index;
    }
    render(start = 0, depth = 0, proto = false) {
        let out = '';
        out += '<div class="col">';
        out += `<div class="row item${(proto ? ' proto' : '') + (ed.shouldHighlight(this) ? ' highlighted' : '')}" draggable="true" data-id="${this.id}">`;
        if (this.getChildren() && this.getChildren().length > 0) {
            out += `<i class="fa fa-fw fa-lg fa-caret-${this.open ? 'down' : 'right'}" onclick="ed.toggleOpen(${this.id})"></i>`;
        }
        else {
            out += '<i></i>';
        }
        if (this.getSize() > 0) {
            out += `<div class="cell">${this.formatNum(start)}-${this.formatNum(start + this.getSize() - 1)}:</div>`;
        }
        if (this.getDesc()) {
            out += `<div class="cell">${this.getName()} (${this.getDesc()})</div>`;
        }
        else {
            out += `<div class="cell">${this.getName()}</div>`;
        }
        if (this.proto) {
            out += '<i class="fa fa-link"></i>';
        }
        out += '</div>';
        if (this.open && this.getChildren().length > 0) {
            if (depth >= ed.project.depthLimit) {
                out += '<div class="col">...</div>';
            }
            else {
                let subStart = start;
                for (const sub of this.getChildren()) {
                    out += sub.render(subStart, depth + 1, proto || (!!this.proto && !this.subs));
                    subStart += sub.getSize();
                }
            }
        }
        out += '</div>';
        return out;
    }
    reparent(parent) {
        this.unparent();
        if (parent) {
            parent.addChild(this);
        }
    }
    serialize() {
        const conf = { size: this.size, name: this.name, desc: this.desc, uuid: this.uuid };
        if (this.proto) {
            conf.proto = this.proto.uuid;
        }
        if (this.subs) {
            conf.subs = this.subs.map((v) => v.serialize());
        }
        return conf;
    }
    unparent() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
    formatNum(num) {
        if (ed.activeTab().digitType === DigitType.Hexadecimal) {
            let str = num.toString(HEX_RADIX).toUpperCase();
            while (str.length < ed.activeTab().pad) {
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
Item.byUUID = {};
//# sourceMappingURL=item.js.map