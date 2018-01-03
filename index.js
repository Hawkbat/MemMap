define("actions/action", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Action {
    }
    exports.Action = Action;
});
define("enums", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DigitType;
    (function (DigitType) {
        DigitType[DigitType["Hexadecimal"] = 0] = "Hexadecimal";
        DigitType[DigitType["Decimal"] = 1] = "Decimal";
    })(DigitType = exports.DigitType || (exports.DigitType = {}));
});
define("project", ["require", "exports", "editor", "enums", "tab"], function (require, exports, editor_1, enums_1, tab_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Project {
        constructor(useDefaults = true) {
            this.digitType = enums_1.DigitType.Hexadecimal;
            this.name = 'New Project';
            this.pad = 4;
            this.tabs = [];
            if (useDefaults) {
                // tslint:disable-next-line:no-unused-expression
                new tab_1.Tab(this);
            }
        }
        static deserialize(conf) {
            const p = new Project(false);
            p.name = conf.name;
            p.digitType = conf.digitType;
            p.pad = conf.pad;
            p.tabs = conf.tabs.map((t) => tab_1.Tab.deserialize(p, t));
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
                        editor_1.ed.project = Project.deserialize(JSON.parse(r.result));
                        editor_1.ed.redraw();
                        editor_1.ed.updateProjectFields();
                        editor_1.ed.setDirty(false);
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
            editor_1.ed.setDirty(false);
        }
        serialize() {
            return { name: this.name, digitType: this.digitType, pad: this.pad, tabs: this.tabs.map((tab) => tab.serialize()) };
        }
    }
    exports.Project = Project;
});
define("tab", ["require", "exports", "editor", "item"], function (require, exports, editor_2, item_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const DEFAULT_MAP_SIZE = 0x10000;
    class Tab {
        constructor(project, itemConf) {
            this.items = [];
            this.redos = [];
            this.undos = [];
            this.project = project;
            this.project.tabs.push(this);
            this.root = itemConf ? item_1.Item.deserialize(this, itemConf) : new item_1.Item(this, DEFAULT_MAP_SIZE, `Map ${this.project.tabs.length}`, '');
        }
        static deserialize(project, conf) {
            const t = new Tab(project, conf);
            return t;
        }
        do(act) {
            act.do();
            this.redos.length = 0;
            this.undos.push(act);
            editor_2.ed.updateCounters();
            editor_2.ed.setToolEnabled('undo', this.undos.length > 0);
            editor_2.ed.setToolEnabled('redo', this.redos.length > 0);
            editor_2.ed.setDirty();
        }
        redo() {
            if (this.redos.length > 0) {
                const act = this.redos.pop();
                act.redo();
                this.undos.push(act);
                editor_2.ed.updateCounters();
                editor_2.ed.setToolEnabled('undo', this.undos.length > 0);
                editor_2.ed.setToolEnabled('redo', this.redos.length > 0);
                editor_2.ed.setDirty();
            }
        }
        serialize() {
            return this.root.serialize();
        }
        undo() {
            if (this.undos.length > 0) {
                const act = this.undos.pop();
                act.undo();
                this.redos.push(act);
                editor_2.ed.updateCounters();
                editor_2.ed.setToolEnabled('undo', this.undos.length > 0);
                editor_2.ed.setToolEnabled('redo', this.redos.length > 0);
                editor_2.ed.setDirty();
            }
        }
    }
    exports.Tab = Tab;
});
define("item", ["require", "exports", "editor", "enums"], function (require, exports, editor_3, enums_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const HEX_RADIX = 16;
    const ODD_MOD = 2;
    class Item {
        constructor(tab, size = 0, name = '', desc = '', subs = []) {
            this.open = true;
            this.parent = null;
            this.size = size;
            this.name = name;
            this.desc = desc;
            this.subs = subs;
            for (const sub of this.subs) {
                sub.parent = this;
            }
            this.tab = tab;
            this.id = tab.items.length;
            tab.items.push(this);
        }
        static deserialize(tab, conf) {
            const t = new Item(tab, conf.size, conf.name, conf.desc);
            t.subs = conf.subs.map((s) => Item.deserialize(tab, s));
            for (const sub of t.subs) {
                sub.parent = t;
            }
            t.id = tab.items.length;
            tab.items.push(t);
            return t;
        }
        copy(src) {
            this.size = src.size;
            this.name = src.name;
            this.desc = src.desc;
            for (const sub of this.subs) {
                sub.parent = null;
            }
            this.subs = [];
            for (const sub of this.subs) {
                const child = new Item(this.tab);
                child.copy(sub);
                child.parent = this;
                this.subs.push(child);
            }
        }
        render(start = 0, depth = 0) {
            let out = '';
            out += '<div class="col">';
            out += `<div class="row item" draggable="true" data-id="${this.id}">`;
            if (this.subs.length > 0) {
                out += `<i class="fa fa-fw fa-lg fa-caret-${this.open ? 'down' : 'right'}" onclick="ed.toggleOpen(${this.id})"></i>`;
            }
            else {
                out += '<i></i>';
            }
            if (this.size > 0) {
                out += `<div class="cell">${this.formatNum(start)}-${this.formatNum(start + this.size - 1)}:</div>`;
            }
            if (this.desc) {
                out += `<div class="cell">${this.name} (${this.desc})</div>`;
            }
            else {
                out += `<div class="cell">${this.name}</div>`;
            }
            out += '</div>';
            if (this.open) {
                let subStart = start;
                for (const sub of this.subs) {
                    out += sub.render(subStart, depth + 1);
                    subStart += sub.size;
                }
            }
            out += '</div>';
            return out;
        }
        serialize() {
            return { size: this.size, name: this.name, desc: this.desc, subs: this.subs.map((v) => v.serialize()) };
        }
        formatNum(num) {
            if (editor_3.ed.project.digitType === enums_2.DigitType.Hexadecimal) {
                let str = num.toString(HEX_RADIX).toUpperCase();
                while (str.length < editor_3.ed.project.pad || (str.length % ODD_MOD) === 1) {
                    str = `0${str}`;
                }
                return `0x${str}`;
            }
            else if (editor_3.ed.project.digitType === enums_2.DigitType.Decimal) {
                let str = num.toString();
                while (str.length < editor_3.ed.project.pad) {
                    str = `0${str}`;
                }
                return str;
            }
        }
    }
    exports.Item = Item;
});
define("actions/add", ["require", "exports", "editor", "item", "actions/action"], function (require, exports, editor_4, item_2, action_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AddAction extends action_1.Action {
        constructor(parent, src) {
            super();
            this.parent = (parent === null) ? editor_4.ed.activeTab().root : parent;
            this.src = src;
        }
        do() {
            this.item = new item_2.Item(editor_4.ed.activeTab());
            this.item.name = `Item ${this.item.id}`;
            if (this.src) {
                this.item.copy(this.src);
            }
            this.item.parent = this.parent;
            this.parent.subs.push(this.item);
            editor_4.ed.redraw();
            editor_4.ed.select(this.item);
        }
        redo() {
            this.item.parent = this.parent;
            this.parent.subs.push(this.item);
            editor_4.ed.redraw();
            editor_4.ed.select(this.item);
        }
        undo() {
            this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
            this.item.parent = null;
            editor_4.ed.redraw();
            editor_4.ed.select(null);
        }
    }
    exports.AddAction = AddAction;
});
define("actions/changefield", ["require", "exports", "editor", "actions/action"], function (require, exports, editor_5, action_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ChangeFieldAction extends action_2.Action {
        constructor(item, field, value) {
            super();
            this.item = item;
            this.field = field;
            // tslint:disable-next-line:no-any
            this.oldValue = this.item[field];
            this.newValue = value;
        }
        do() {
            // tslint:disable-next-line:no-any
            this.item[this.field] = this.newValue;
            editor_5.ed.redraw();
            editor_5.ed.select(this.item);
        }
        redo() {
            this.do();
        }
        undo() {
            // tslint:disable-next-line:no-any
            this.item[this.field] = this.oldValue;
            editor_5.ed.redraw();
            editor_5.ed.select(this.item);
        }
    }
    exports.ChangeFieldAction = ChangeFieldAction;
});
define("actions/move", ["require", "exports", "editor", "actions/action"], function (require, exports, editor_6, action_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MoveAction extends action_3.Action {
        constructor(item, parent) {
            super();
            this.item = item;
            this.oldIndex = item.parent.subs.indexOf(item);
            this.oldParent = item.parent;
            this.newParent = parent;
        }
        do() {
            this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
            this.item.parent = this.newParent;
            this.newParent.subs.push(this.item);
            editor_6.ed.redraw();
            editor_6.ed.select(this.item);
        }
        redo() {
            this.do();
        }
        undo() {
            this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
            this.item.parent = this.oldParent;
            this.oldParent.subs.splice(this.oldIndex, 0, this.item);
            editor_6.ed.redraw();
            editor_6.ed.select(this.item);
        }
    }
    exports.MoveAction = MoveAction;
});
define("actions/movedown", ["require", "exports", "editor", "actions/action"], function (require, exports, editor_7, action_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MoveDownAction extends action_4.Action {
        constructor(item) {
            super();
            this.item = item;
        }
        do() {
            this.index = this.item.parent.subs.indexOf(this.item);
            this.item.parent.subs.splice(this.index, 1);
            this.item.parent.subs.splice(this.index + 1, 0, this.item);
            editor_7.ed.redraw();
            editor_7.ed.select(this.item);
        }
        redo() {
            this.do();
        }
        undo() {
            this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
            this.item.parent.subs.splice(this.index, 0, this.item);
            editor_7.ed.redraw();
            editor_7.ed.select(this.item);
        }
    }
    exports.MoveDownAction = MoveDownAction;
});
define("actions/moveup", ["require", "exports", "editor", "actions/action"], function (require, exports, editor_8, action_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MoveUpAction extends action_5.Action {
        constructor(item) {
            super();
            this.item = item;
        }
        do() {
            this.index = this.item.parent.subs.indexOf(this.item);
            this.item.parent.subs.splice(this.index, 1);
            this.item.parent.subs.splice(this.index - 1, 0, this.item);
            editor_8.ed.redraw();
            editor_8.ed.select(this.item);
        }
        redo() {
            this.do();
        }
        undo() {
            this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
            this.item.parent.subs.splice(this.index, 0, this.item);
            editor_8.ed.redraw();
            editor_8.ed.select(this.item);
        }
    }
    exports.MoveUpAction = MoveUpAction;
});
define("actions/remove", ["require", "exports", "editor", "actions/action"], function (require, exports, editor_9, action_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RemoveAction extends action_6.Action {
        constructor(item) {
            super();
            this.item = item;
        }
        do() {
            this.parent = this.item.parent;
            this.index = this.item.parent.subs.indexOf(this.item);
            this.item.parent.subs.splice(this.index, 1);
            this.item.parent = null;
            editor_9.ed.redraw();
            editor_9.ed.select(null);
        }
        redo() {
            this.do();
        }
        undo() {
            this.item.parent = this.parent;
            this.parent.subs.splice(this.index, 0, this.item);
            editor_9.ed.redraw();
            editor_9.ed.select(this.item);
        }
    }
    exports.RemoveAction = RemoveAction;
});
define("actions/index", ["require", "exports", "actions/action", "actions/add", "actions/changefield", "actions/move", "actions/movedown", "actions/moveup", "actions/remove"], function (require, exports, action_7, add_1, changefield_1, move_1, movedown_1, moveup_1, remove_1) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(action_7);
    __export(add_1);
    __export(changefield_1);
    __export(move_1);
    __export(movedown_1);
    __export(moveup_1);
    __export(remove_1);
});
define("editor", ["require", "exports", "actions/index", "item", "project", "tab"], function (require, exports, Actions, item_3, project_1, tab_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const DEC_RADIX = 10;
    const AUTOSAVE_INTERVAL = 2000;
    class Editor {
        constructor() {
            this.cbItem = null;
            this.curTab = 0;
        }
        activeTab() {
            return this.project.tabs[this.curTab];
        }
        addTab() {
            const tab = new tab_2.Tab(this.project);
            this.curTab = this.project.tabs.length - 1;
            this.redraw();
            this.select(tab.root);
        }
        autosave() {
            localStorage.setItem('memmap-autosave', JSON.stringify(this.project.serialize()));
            this.setDirty(false);
        }
        bindExpander(id) {
            const panel = document.getElementById(id);
            const expander = document.getElementById(`expander-${id}`);
            const icon = expander.querySelector('i');
            expander.addEventListener('click', () => {
                panel.classList.toggle('hidden');
                icon.classList.toggle('fa-chevron-left');
                icon.classList.toggle('fa-chevron-right');
            });
        }
        bindItemField(field) {
            const input = document.body.querySelector(`#details input[name="${field}"], #details textarea[name="${field}"]`);
            input.disabled = true;
            input.addEventListener('change', () => {
                const item = this.selected();
                if (item) {
                    this.activeTab().do(new Actions.ChangeFieldAction(item, field, (input.type === 'number') ? parseInt(input.value, DEC_RADIX) : input.value));
                }
            });
        }
        bindProjectField(field) {
            const input = document.body.querySelector(`#project input[name="${field}"], #project textarea[name="${field}"], #project select[name="${field}"]`);
            // tslint:disable-next-line:no-any
            input.value = this.project[field];
            input.addEventListener('change', () => {
                // tslint:disable-next-line:no-any
                this.project[field] = (input.tagName === 'SELECT' || input.type === 'number') ? parseInt(input.value, DEC_RADIX) : input.value;
                this.redraw(true);
                this.setDirty();
            });
        }
        bindTool(name, key, action) {
            const tool = document.body.querySelector(`#tool-${name}`);
            tool.addEventListener('click', () => {
                action(this.selected());
            });
            if (key) {
                document.addEventListener('keydown', (e) => {
                    if (!document.activeElement || document.activeElement === document.body) {
                        if (e.key === key) {
                            e.preventDefault();
                            action(this.selected());
                        }
                    }
                });
            }
        }
        changeTab(i) {
            this.curTab = i;
            this.redraw();
            this.select(this.activeTab().root);
        }
        closeTab(i) {
            if ((i === this.curTab && i > 0) || this.curTab === this.project.tabs.length - 1) {
                this.curTab--;
            }
            this.project.tabs.splice(i, 1);
            this.redraw();
            this.select(this.activeTab().root);
        }
        findItemElement(ele) {
            let el = ele;
            while (el && !el.classList.contains('item')) {
                el = el.parentElement;
            }
            return el;
        }
        init() {
            this.container = document.getElementById('container');
            this.container.addEventListener('click', (e) => {
                const ele = this.findItemElement(e.target);
                let item;
                if (ele) {
                    item = this.activeTab().items[parseInt(ele.dataset.id, DEC_RADIX)];
                }
                this.select(item);
            });
            this.container.addEventListener('dragstart', (e) => {
                const ele = this.findItemElement(e.target);
                if (ele) {
                    const item = this.activeTab().items[parseInt(ele.dataset.id, DEC_RADIX)];
                    if (item.parent) {
                        e.dataTransfer.setData('text/plain', item.id.toString());
                    }
                    else {
                        e.preventDefault();
                    }
                }
                else {
                    e.preventDefault();
                }
            });
            this.container.addEventListener('dragover', (e) => {
                e.preventDefault();
                const ele = this.findItemElement(e.target);
                if (ele) {
                    e.dataTransfer.dropEffect = 'move';
                }
            });
            this.container.addEventListener('drop', (e) => {
                e.preventDefault();
                const ele = this.findItemElement(e.target);
                if (ele) {
                    const item = this.activeTab().items[parseInt(e.dataTransfer.getData('text/plain'), DEC_RADIX)];
                    const parent = this.activeTab().items[parseInt(ele.dataset.id, DEC_RADIX)];
                    if (item !== parent) {
                        this.activeTab().do(new Actions.MoveAction(item, parent));
                    }
                }
            });
            const autosave = localStorage.getItem('memmap-autosave');
            this.project = autosave ? project_1.Project.deserialize(JSON.parse(autosave)) : new project_1.Project();
            this.autosave();
            window.addEventListener('beforeunload', () => {
                this.autosave();
            });
            this.bindItemField('name');
            this.bindItemField('desc');
            this.bindItemField('size');
            this.bindProjectField('name');
            this.bindProjectField('digitType');
            this.bindProjectField('pad');
            this.bindTool('new', 'n', () => {
                if (confirm('You will lose all autosaved data if you start a new project. Continue?')) {
                    this.project = new project_1.Project();
                    this.redraw();
                }
            });
            this.bindTool('open', 'o', () => project_1.Project.open());
            this.bindTool('save', 's', () => this.project.save());
            this.bindTool('cut', 'x', (item) => {
                if (item && item.parent) {
                    if (this.cbItem) {
                        this.cbItem.copy(item);
                    }
                    else {
                        this.cbItem = item;
                    }
                    this.activeTab().do(new Actions.RemoveAction(item));
                    this.setToolEnabled('paste', true);
                }
            });
            this.bindTool('copy', 'c', (item) => {
                if (item) {
                    if (!this.cbItem) {
                        this.cbItem = new item_3.Item(exports.ed.activeTab());
                    }
                    this.cbItem.copy(item);
                    this.setToolEnabled('paste', true);
                }
            });
            this.bindTool('paste', 'v', (item) => {
                if (this.cbItem) {
                    this.activeTab().do(new Actions.AddAction(item, this.cbItem));
                }
            });
            this.bindTool('undo', 'z', () => this.activeTab().undo());
            this.bindTool('redo', 'y', () => this.activeTab().redo());
            this.bindTool('add', 'Insert', (item) => this.activeTab().do(new Actions.AddAction(item)));
            this.bindTool('rem', 'Delete', (item) => {
                if (item && item.parent) {
                    this.activeTab().do(new Actions.RemoveAction(item));
                }
            });
            this.bindTool('up', 'ArrowUp', (item) => {
                if (item && item.parent) {
                    const index = item.parent.subs.indexOf(item);
                    if (index > 0) {
                        this.activeTab().do(new Actions.MoveUpAction(item));
                    }
                }
            });
            this.bindTool('down', 'ArrowDown', (item) => {
                if (item && item.parent) {
                    const index = item.parent.subs.indexOf(item);
                    if (index < item.parent.subs.length - 1) {
                        this.activeTab().do(new Actions.MoveDownAction(item));
                    }
                }
            });
            this.bindExpander('details');
            this.bindExpander('project');
            this.redraw();
            this.select(this.activeTab().root);
        }
        redraw(keepSelected = false) {
            const sel = this.selected();
            this.container.innerHTML = this.activeTab().root.render();
            this.updateTabs();
            this.updateCounters();
            if (keepSelected) {
                this.select(sel);
            }
        }
        select(item) {
            this.setItemField('size', item);
            this.setItemField('name', item);
            this.setItemField('desc', item);
            const allEles = document.body.querySelectorAll('.item');
            for (const ele of allEles) {
                ele.classList.remove('selected');
            }
            if (item) {
                const selEle = this.container.querySelector(`.item[data-id="${item.id}"]`);
                if (selEle) {
                    selEle.classList.add('selected');
                }
            }
            this.setToolEnabled('rem', !!item && item.parent !== null);
            this.setToolEnabled('up', !!item && item.parent !== null && item.parent.subs.indexOf(item) > 0);
            this.setToolEnabled('down', !!item && item.parent !== null && item.parent.subs.indexOf(item) < item.parent.subs.length - 1);
        }
        selected() {
            const selEle = this.container.querySelector('.item.selected');
            if (selEle) {
                return this.activeTab().items[parseInt(selEle.dataset.id, DEC_RADIX)];
            }
            return null;
        }
        setDirty(val = true) {
            this.dirty = val;
            document.title = `${this.project.name}${this.dirty ? '*' : ''} | Memory Mapper`;
            if (this.autosaveTimeout) {
                clearTimeout(this.autosaveTimeout);
            }
            if (this.dirty) {
                this.autosaveTimeout = setTimeout(() => this.autosave(), AUTOSAVE_INTERVAL);
            }
        }
        setItemField(field, item) {
            const input = document.body.querySelector(`#details input[name="${field}"], #details textarea[name="${field}"]`);
            input.disabled = !item;
            // tslint:disable-next-line:no-any
            input.value = item ? item[field] : '';
        }
        setToolEnabled(name, enabled) {
            const tool = document.body.querySelector(`#tool-${name}`);
            if (enabled) {
                tool.classList.remove('disabled');
            }
            else {
                tool.classList.add('disabled');
            }
        }
        toggleOpen(id) {
            this.activeTab().items[id].open = !this.activeTab().items[id].open;
            this.redraw(true);
        }
        updateCounters() {
            document.getElementById('tool-undo').dataset.count = (this.activeTab().undos.length ? this.activeTab().undos.length : '').toString();
            document.getElementById('tool-redo').dataset.count = (this.activeTab().redos.length ? this.activeTab().redos.length : '').toString();
        }
        updateProjectFields() {
            document.body.querySelector('#project input[name="name"]').value = this.project.name;
            document.body.querySelector('#project select[name="digitType"]').value = this.project.digitType.toString();
            document.body.querySelector('#project input[name="pad"]').value = this.project.pad.toString();
        }
        updateTabs() {
            let out = '';
            for (let i = 0; i < this.project.tabs.length; i++) {
                if (i === this.curTab) {
                    out += `<div class="tab selected">${this.activeTab().root.name}`;
                }
                else {
                    out += `<div class="tab" onclick="ed.changeTab(${i})">${this.project.tabs[i].root.name}`;
                }
                if (this.project.tabs.length > 1) {
                    out += `<i class="fa fa-close" onclick="ed.closeTab(${i})"></i>`;
                }
                out += '</div>';
            }
            out += '<div id="new-tab" class="tab" onclick="ed.addTab()"><i class="fa fa-plus"></i></div>';
            document.getElementById('tabs').innerHTML = out;
        }
    }
    exports.Editor = Editor;
    exports.ed = new Editor();
});
define("main", ["require", "exports", "editor"], function (require, exports, editor_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable-next-line:no-any
    window.ed = editor_10.ed;
    editor_10.ed.init();
});
//# sourceMappingURL=index.js.map