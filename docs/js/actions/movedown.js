import { ed } from '../editor.js';
import { Action } from './action.js';
export class MoveDownAction extends Action {
    constructor(item) {
        super();
        this.item = item;
    }
    do() {
        this.index = this.item.parent.getChildren().indexOf(this.item);
        this.item.parent.insertChild(this.item, this.index + 1);
        ed.select(this.item);
    }
    redo() {
        this.do();
    }
    undo() {
        this.item.parent.insertChild(this.item, this.index);
        ed.select(this.item);
    }
}
//# sourceMappingURL=movedown.js.map