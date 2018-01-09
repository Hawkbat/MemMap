import { ed } from '../editor.js';
import { Item } from '../item.js';
import { Action } from './action.js';
export class BreakLinkAction extends Action {
    constructor(item) {
        super();
        this.item = item;
        this.oldProto = item.proto;
        this.oldData = new Item(item.tab);
        this.oldData.deepCopy(item);
    }
    do() {
        this.item.deepCopy(this.item.proto);
        this.item.proto = undefined;
        ed.select(this.item);
    }
    redo() {
        this.do();
    }
    undo() {
        this.item.proto = this.oldProto;
        this.item.deepCopy(this.oldData);
        ed.select(this.item);
    }
}
//# sourceMappingURL=break.js.map