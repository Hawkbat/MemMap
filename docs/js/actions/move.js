import { ed } from '../editor.js';
import { Action } from './action.js';
export class MoveAction extends Action {
    constructor(item, parent) {
        super();
        this.item = item;
        this.oldIndex = item.parent.subs.indexOf(item);
        this.oldParent = item.parent;
        this.newParent = parent;
    }
    do() {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
        this.item.parent = this.newParent;
        this.newParent.subs.push(this.item);
        ed.redraw();
        ed.select(this.item);
    }
    redo() {
        this.do();
    }
    undo() {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
        this.item.parent = this.oldParent;
        this.oldParent.subs.splice(this.oldIndex, 0, this.item);
        ed.redraw();
        ed.select(this.item);
    }
}
//# sourceMappingURL=move.js.map