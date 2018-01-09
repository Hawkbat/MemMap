import { ed } from '../editor.js';
import { Action } from './action.js';
export class LinkAction extends Action {
    constructor(item, proto) {
        super();
        this.item = item;
        this.oldProto = item.proto;
        this.newProto = proto;
    }
    do() {
        this.item.proto = this.newProto;
        ed.select(this.item);
    }
    redo() {
        this.do();
    }
    undo() {
        this.item.proto = this.oldProto;
        ed.select(this.item);
    }
}
//# sourceMappingURL=link.js.map