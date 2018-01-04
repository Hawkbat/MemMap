import { ed } from '../editor.js';
import { Item } from '../item.js';
import { Action } from './action.js';
export class AddAction extends Action {
    constructor(parent, src) {
        super();
        this.parent = (parent === null) ? ed.activeTab().root : parent;
        this.src = src;
    }
    do() {
        this.item = new Item(ed.activeTab());
        this.item.name = `Item ${this.item.id}`;
        if (this.src) {
            this.item.copy(this.src);
        }
        this.item.parent = this.parent;
        this.parent.subs.push(this.item);
        ed.redraw();
        ed.select(this.item);
    }
    redo() {
        this.item.parent = this.parent;
        this.parent.subs.push(this.item);
        ed.redraw();
        ed.select(this.item);
    }
    undo() {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
        this.item.parent = null;
        ed.redraw();
        ed.select(null);
    }
}
//# sourceMappingURL=add.js.map