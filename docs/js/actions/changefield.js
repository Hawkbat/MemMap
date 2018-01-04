import { ed } from '../editor.js';
import { Item } from '../item.js';
import { Action } from './action.js';
export class ChangeFieldAction extends Action {
    // tslint:disable-next-line:no-any
    constructor(obj, group, field, value) {
        super();
        this.obj = obj;
        this.group = group;
        this.field = field;
        // tslint:disable-next-line:no-any
        this.oldValue = this.obj[field];
        this.newValue = value;
    }
    do() {
        // tslint:disable-next-line:no-any
        this.obj[this.field] = this.newValue;
        ed.setFieldValue(this.group, this.field, this.obj);
        ed.redraw();
        if (this.obj instanceof Item) {
            ed.select(this.obj);
        }
    }
    redo() {
        this.do();
    }
    undo() {
        // tslint:disable-next-line:no-any
        this.obj[this.field] = this.oldValue;
        ed.setFieldValue(this.group, this.field, this.obj);
        ed.redraw();
        if (this.obj instanceof Item) {
            ed.select(this.obj);
        }
    }
}
//# sourceMappingURL=changefield.js.map