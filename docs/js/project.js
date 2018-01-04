import { ed } from './editor.js';
import { Tab } from './tab.js';
export class Project {
    constructor(useDefaults = true) {
        this.name = 'New Project';
        this.tabs = [];
        if (useDefaults) {
            // tslint:disable-next-line:no-unused-expression
            new Tab(this);
        }
    }
    static deserialize(conf) {
        const p = new Project(false);
        p.name = conf.name;
        p.tabs = conf.tabs.map((t) => Tab.deserialize(p, t));
        return p;
    }
    static open() {
        const n = document.createElement('input');
        n.setAttribute('type', 'file');
        n.setAttribute('accept', '.memmap.json');
        n.addEventListener('change', () => {
            if (n.files.length > 0) {
                const r = new FileReader();
                r.addEventListener('load', () => {
                    ed.project = Project.deserialize(JSON.parse(r.result));
                    ed.redraw();
                    ed.updateProjectFields();
                    ed.setDirty(false);
                });
                r.readAsText(n.files[0], 'utf-8');
            }
        });
        n.click();
    }
    save() {
        const out = JSON.stringify(this.serialize());
        const a = document.createElement('a');
        a.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(out)}`);
        a.setAttribute('download', `${this.name}.memmap.json`);
        a.click();
        ed.setDirty(false);
    }
    serialize() {
        return { name: this.name, tabs: this.tabs.map((tab) => tab.serialize()) };
    }
}
//# sourceMappingURL=project.js.map