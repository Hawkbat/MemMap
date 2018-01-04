import { ed } from '../editor.js';
import { Action } from './action.js';
export class MoveDownAction extends Action {
    constructor(item) {
        super();
        this.item = item;
    }
    do() {
        this.index = this.item.parent.subs.indexOf(this.item);
        this.item.parent.subs.splice(this.index, 1);
        this.item.parent.subs.splice(this.index + 1, 0, this.item);
        ed.redraw();
        ed.select(this.item);
    }
    redo() {
        this.do();
    }
    undo() {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
        this.item.parent.subs.splice(this.index, 0, this.item);
        ed.redraw();
        ed.select(this.item);
    }
}
//# sourceMappingURL=movedown.js.map