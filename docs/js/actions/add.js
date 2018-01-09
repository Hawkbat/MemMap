import { ed } from '../editor.js';
import { Item } from '../item.js';
import { Action } from './action.js';
export class AddAction extends Action {
    constructor(parent, src) {
        super();
        this.parent = (parent === null) ? ed.activeTab().root : parent;
        this.src = src;
        this.item = new Item(ed.activeTab());
        if (this.src) {
            this.item.proto = this.src;
        }
        else {
            // tslint:disable-next-line:no-any
            this.item.name = `Item ${this.item.id}`;
        }
    }
    do() {
        this.item.reparent(this.parent);
        ed.select(this.item);
    }
    redo() {
        this.do();
    }
    undo() {
        this.item.unparent();
        ed.select(null);
    }
}
//# sourceMappingURL=add.js.map