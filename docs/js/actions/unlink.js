import { ed } from '../editor.js';
import { Action } from './action.js';
export class LinkAction extends Action {
    constructor(item) {
        super();
        this.item = item;
        this.oldProto = item.proto;
    }
    do() {
        this.item.proto = this.newProto;
        ed.redraw();
        ed.select(this.item);
    }
    redo() {
        this.do();
    }
    undo() {
        this.item.proto = this.oldProto;
        ed.redraw();
        ed.select(this.item);
    }
}
//# sourceMappingURL=unlink.js.map