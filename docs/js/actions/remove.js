import { ed } from '../editor.js';
import { Action } from './action.js';
export class RemoveAction extends Action {
    constructor(item) {
        super();
        this.item = item;
    }
    do() {
        this.parent = this.item.parent;
        this.index = this.item.parent.subs.indexOf(this.item);
        this.item.parent.subs.splice(this.index, 1);
        this.item.parent = null;
        ed.redraw();
        ed.select(null);
    }
    redo() {
        this.do();
    }
    undo() {
        this.item.parent = this.parent;
        this.parent.subs.splice(this.index, 0, this.item);
        ed.redraw();
        ed.select(this.item);
    }
}
//# sourceMappingURL=remove.js.map