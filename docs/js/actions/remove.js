import { ed } from '../editor.js';
import { Action } from './action.js';
export class RemoveAction extends Action {
    constructor(item) {
        super();
        this.item = item;
    }
    do() {
        this.parent = this.item.parent;
        this.index = this.item.parent.getChildren().indexOf(this.item);
        this.item.unparent();
        ed.select(null);
    }
    redo() {
        this.do();
    }
    undo() {
        this.parent.insertChild(this.item, this.index);
        ed.select(this.item);
    }
}
//# sourceMappingURL=remove.js.map