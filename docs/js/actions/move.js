import { ed } from '../editor.js';
import { Action } from './action.js';
export class MoveAction extends Action {
    constructor(item, parent) {
        super();
        this.item = item;
        this.oldIndex = item.parent.getChildren().indexOf(item);
        this.oldParent = item.parent;
        this.newParent = parent;
    }
    do() {
        this.item.reparent(this.newParent);
        ed.select(this.item);
    }
    redo() {
        this.do();
    }
    undo() {
        this.oldParent.insertChild(this.item, this.oldIndex);
        ed.select(this.item);
    }
}
//# sourceMappingURL=move.js.map