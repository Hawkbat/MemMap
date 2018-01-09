import { ed } from './editor.js';
import { DigitType } from './enums.js';
import { Item } from './item.js';
const DEFAULT_MAP_SIZE = 0x10000;
export class Tab {
    constructor(project, itemConf) {
        this.digitType = DigitType.Hexadecimal;
        this.items = [];
        this.pad = 4;
        this.redos = [];
        this.tempProtoMap = {};
        this.undos = [];
        this.project = project;
        this.project.tabs.push(this);
        this.root = itemConf ? Item.deserialize(this, itemConf) : new Item(this, DEFAULT_MAP_SIZE, `Map ${this.project.tabs.length}`);
    }
    static deserialize(project, conf) {
        const t = new Tab(project, conf.root);
        t.digitType = conf.digitType;
        t.pad = conf.pad;
        for (const key of Object.keys(t.tempProtoMap)) {
            Item.byUUID[key].proto = Item.byUUID[t.tempProtoMap[parseFloat(key)]];
        }
        return t;
    }
    do(act) {
        act.do();
        this.redos.length = 0;
        this.undos.push(act);
        ed.redraw(true);
        ed.setToolEnabled('undo', this.undos.length > 0);
        ed.setToolEnabled('redo', this.redos.length > 0);
        ed.setDirty();
    }
    redo() {
        if (this.redos.length > 0) {
            const act = this.redos.pop();
            act.redo();
            this.undos.push(act);
            ed.redraw(true);
            ed.setToolEnabled('undo', this.undos.length > 0);
            ed.setToolEnabled('redo', this.redos.length > 0);
            ed.setDirty();
        }
    }
    serialize() {
        return { digitType: this.digitType, pad: this.pad, root: this.root.serialize() };
    }
    undo() {
        if (this.undos.length > 0) {
            const act = this.undos.pop();
            act.undo();
            this.redos.push(act);
            ed.redraw(true);
            ed.setToolEnabled('undo', this.undos.length > 0);
            ed.setToolEnabled('redo', this.redos.length > 0);
            ed.setDirty();
        }
    }
}
//# sourceMappingURL=tab.js.map