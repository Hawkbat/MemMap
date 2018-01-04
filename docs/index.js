var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("actions/action", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Action = /** @class */ (function () {
        function Action() {
        }
        return Action;
    }());
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
define("project", ["require", "exports", "editor", "tab"], function (require, exports, editor_1, tab_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Project = /** @class */ (function () {
        function Project(useDefaults) {
            if (useDefaults === void 0) { useDefaults = true; }
            this.name = 'New Project';
            this.tabs = [];
            if (useDefaults) {
                // tslint:disable-next-line:no-unused-expression
                new tab_1.Tab(this);
            }
        }
        Project.deserialize = function (conf) {
            var p = new Project(false);
            p.name = conf.name;
            p.tabs = conf.tabs.map(function (t) { return tab_1.Tab.deserialize(p, t); });
            return p;
        };
        Project.open = function () {
            var n = document.createElement('input');
            n.setAttribute('type', 'file');
            n.setAttribute('accept', '.memmap.json');
            n.addEventListener('change', function () {
                if (n.files.length > 0) {
                    var r_1 = new FileReader();
                    r_1.addEventListener('load', function () {
                        editor_1.ed.project = Project.deserialize(JSON.parse(r_1.result));
                        editor_1.ed.redraw();
                        editor_1.ed.updateProjectFields();
                        editor_1.ed.setDirty(false);
                    });
                    r_1.readAsText(n.files[0], 'utf-8');
                }
            });
            n.click();
        };
        Project.prototype.save = function () {
            var out = JSON.stringify(this.serialize());
            var a = document.createElement('a');
            a.setAttribute('href', "data:application/json;charset=utf-8," + encodeURIComponent(out));
            a.setAttribute('download', this.name + ".memmap.json");
            a.click();
            editor_1.ed.setDirty(false);
        };
        Project.prototype.serialize = function () {
            return { name: this.name, tabs: this.tabs.map(function (tab) { return tab.serialize(); }) };
        };
        return Project;
    }());
    exports.Project = Project;
});
define("tab", ["require", "exports", "editor", "enums", "item"], function (require, exports, editor_2, enums_1, item_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DEFAULT_MAP_SIZE = 0x10000;
    var Tab = /** @class */ (function () {
        function Tab(project, itemConf) {
            this.digitType = enums_1.DigitType.Hexadecimal;
            this.items = [];
            this.pad = 4;
            this.redos = [];
            this.undos = [];
            this.project = project;
            this.project.tabs.push(this);
            this.root = itemConf ? item_1.Item.deserialize(this, itemConf) : new item_1.Item(this, DEFAULT_MAP_SIZE, "Map " + this.project.tabs.length, '');
        }
        Tab.deserialize = function (project, conf) {
            var t = new Tab(project, conf.root);
            t.digitType = conf.digitType;
            t.pad = conf.pad;
            return t;
        };
        Tab.prototype.do = function (act) {
            act.do();
            this.redos.length = 0;
            this.undos.push(act);
            editor_2.ed.updateCounters();
            editor_2.ed.setToolEnabled('undo', this.undos.length > 0);
            editor_2.ed.setToolEnabled('redo', this.redos.length > 0);
            editor_2.ed.setDirty();
        };
        Tab.prototype.redo = function () {
            if (this.redos.length > 0) {
                var act = this.redos.pop();
                act.redo();
                this.undos.push(act);
                editor_2.ed.updateCounters();
                editor_2.ed.setToolEnabled('undo', this.undos.length > 0);
                editor_2.ed.setToolEnabled('redo', this.redos.length > 0);
                editor_2.ed.setDirty();
            }
        };
        Tab.prototype.serialize = function () {
            return { digitType: this.digitType, pad: this.pad, root: this.root.serialize() };
        };
        Tab.prototype.undo = function () {
            if (this.undos.length > 0) {
                var act = this.undos.pop();
                act.undo();
                this.redos.push(act);
                editor_2.ed.updateCounters();
                editor_2.ed.setToolEnabled('undo', this.undos.length > 0);
                editor_2.ed.setToolEnabled('redo', this.redos.length > 0);
                editor_2.ed.setDirty();
            }
        };
        return Tab;
    }());
    exports.Tab = Tab;
});
define("item", ["require", "exports", "editor", "enums"], function (require, exports, editor_3, enums_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var HEX_RADIX = 16;
    var ODD_MOD = 2;
    var Item = /** @class */ (function () {
        function Item(tab, size, name, desc, subs) {
            if (size === void 0) { size = 0; }
            if (name === void 0) { name = ''; }
            if (desc === void 0) { desc = ''; }
            if (subs === void 0) { subs = []; }
            this.open = true;
            this.parent = null;
            this.size = size;
            this.name = name;
            this.desc = desc;
            this.subs = subs;
            for (var _i = 0, _a = this.subs; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.parent = this;
            }
            this.tab = tab;
            this.id = tab.items.length;
            tab.items.push(this);
        }
        Item.deserialize = function (tab, conf) {
            var t = new Item(tab, conf.size, conf.name, conf.desc);
            t.subs = conf.subs.map(function (s) { return Item.deserialize(tab, s); });
            for (var _i = 0, _a = t.subs; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.parent = t;
            }
            t.id = tab.items.length;
            tab.items.push(t);
            return t;
        };
        Item.prototype.copy = function (src) {
            this.size = src.size;
            this.name = src.name;
            this.desc = src.desc;
            for (var _i = 0, _a = this.subs; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.parent = null;
            }
            this.subs = [];
            for (var _b = 0, _c = this.subs; _b < _c.length; _b++) {
                var sub = _c[_b];
                var child = new Item(this.tab);
                child.copy(sub);
                child.parent = this;
                this.subs.push(child);
            }
        };
        Item.prototype.render = function (start, depth) {
            if (start === void 0) { start = 0; }
            if (depth === void 0) { depth = 0; }
            var out = '';
            out += '<div class="col">';
            out += "<div class=\"row item\" draggable=\"true\" data-id=\"" + this.id + "\">";
            if (this.subs.length > 0) {
                out += "<i class=\"fa fa-fw fa-lg fa-caret-" + (this.open ? 'down' : 'right') + "\" onclick=\"ed.toggleOpen(" + this.id + ")\"></i>";
            }
            else {
                out += '<i></i>';
            }
            if (this.size > 0) {
                out += "<div class=\"cell\">" + this.formatNum(start) + "-" + this.formatNum(start + this.size - 1) + ":</div>";
            }
            if (this.desc) {
                out += "<div class=\"cell\">" + this.name + " (" + this.desc + ")</div>";
            }
            else {
                out += "<div class=\"cell\">" + this.name + "</div>";
            }
            out += '</div>';
            if (this.open) {
                var subStart = start;
                for (var _i = 0, _a = this.subs; _i < _a.length; _i++) {
                    var sub = _a[_i];
                    out += sub.render(subStart, depth + 1);
                    subStart += sub.size;
                }
            }
            out += '</div>';
            return out;
        };
        Item.prototype.serialize = function () {
            return { size: this.size, name: this.name, desc: this.desc, subs: this.subs.map(function (v) { return v.serialize(); }) };
        };
        Item.prototype.formatNum = function (num) {
            if (editor_3.ed.activeTab().digitType === enums_2.DigitType.Hexadecimal) {
                var str = num.toString(HEX_RADIX).toUpperCase();
                while (str.length < editor_3.ed.activeTab().pad || (str.length % ODD_MOD) === 1) {
                    str = "0" + str;
                }
                return "0x" + str;
            }
            else if (editor_3.ed.activeTab().digitType === enums_2.DigitType.Decimal) {
                var str = num.toString();
                while (str.length < editor_3.ed.activeTab().pad) {
                    str = "0" + str;
                }
                return str;
            }
        };
        return Item;
    }());
    exports.Item = Item;
});
define("actions/add", ["require", "exports", "editor", "item", "actions/action"], function (require, exports, editor_4, item_2, action_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AddAction = /** @class */ (function (_super) {
        __extends(AddAction, _super);
        function AddAction(parent, src) {
            var _this = _super.call(this) || this;
            _this.parent = (parent === null) ? editor_4.ed.activeTab().root : parent;
            _this.src = src;
            return _this;
        }
        AddAction.prototype.do = function () {
            this.item = new item_2.Item(editor_4.ed.activeTab());
            this.item.name = "Item " + this.item.id;
            if (this.src) {
                this.item.copy(this.src);
            }
            this.item.parent = this.parent;
            this.parent.subs.push(this.item);
            editor_4.ed.redraw();
            editor_4.ed.select(this.item);
        };
        AddAction.prototype.redo = function () {
            this.item.parent = this.parent;
            this.parent.subs.push(this.item);
            editor_4.ed.redraw();
            editor_4.ed.select(this.item);
        };
        AddAction.prototype.undo = function () {
            this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
            this.item.parent = null;
            editor_4.ed.redraw();
            editor_4.ed.select(null);
        };
        return AddAction;
    }(action_1.Action));
    exports.AddAction = AddAction;
});
define("actions/changefield", ["require", "exports", "editor", "item", "actions/action"], function (require, exports, editor_5, item_3, action_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ChangeFieldAction = /** @class */ (function (_super) {
        __extends(ChangeFieldAction, _super);
        // tslint:disable-next-line:no-any
        function ChangeFieldAction(obj, group, field, value) {
            var _this = _super.call(this) || this;
            _this.obj = obj;
            _this.group = group;
            _this.field = field;
            // tslint:disable-next-line:no-any
            _this.oldValue = _this.obj[field];
            _this.newValue = value;
            return _this;
        }
        ChangeFieldAction.prototype.do = function () {
            // tslint:disable-next-line:no-any
            this.obj[this.field] = this.newValue;
            editor_5.ed.setFieldValue(this.group, this.field, this.obj);
            editor_5.ed.redraw();
            if (this.obj instanceof item_3.Item) {
                editor_5.ed.select(this.obj);
            }
        };
        ChangeFieldAction.prototype.redo = function () {
            this.do();
        };
        ChangeFieldAction.prototype.undo = function () {
            // tslint:disable-next-line:no-any
            this.obj[this.field] = this.oldValue;
            editor_5.ed.setFieldValue(this.group, this.field, this.obj);
            editor_5.ed.redraw();
            if (this.obj instanceof item_3.Item) {
                editor_5.ed.select(this.obj);
            }
        };
        return ChangeFieldAction;
    }(action_2.Action));
    exports.ChangeFieldAction = ChangeFieldAction;
});
define("actions/move", ["require", "exports", "editor", "actions/action"], function (require, exports, editor_6, action_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MoveAction = /** @class */ (function (_super) {
        __extends(MoveAction, _super);
        function MoveAction(item, parent) {
            var _this = _super.call(this) || this;
            _this.item = item;
            _this.oldIndex = item.parent.subs.indexOf(item);
            _this.oldParent = item.parent;
            _this.newParent = parent;
            return _this;
        }
        MoveAction.prototype.do = function () {
            this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
            this.item.parent = this.newParent;
            this.newParent.subs.push(this.item);
            editor_6.ed.redraw();
            editor_6.ed.select(this.item);
        };
        MoveAction.prototype.redo = function () {
            this.do();
        };
        MoveAction.prototype.undo = function () {
            this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
            this.item.parent = this.oldParent;
            this.oldParent.subs.splice(this.oldIndex, 0, this.item);
            editor_6.ed.redraw();
            editor_6.ed.select(this.item);
        };
        return MoveAction;
    }(action_3.Action));
    exports.MoveAction = MoveAction;
});
define("actions/movedown", ["require", "exports", "editor", "actions/action"], function (require, exports, editor_7, action_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MoveDownAction = /** @class */ (function (_super) {
        __extends(MoveDownAction, _super);
        function MoveDownAction(item) {
            var _this = _super.call(this) || this;
            _this.item = item;
            return _this;
        }
        MoveDownAction.prototype.do = function () {
            this.index = this.item.parent.subs.indexOf(this.item);
            this.item.parent.subs.splice(this.index, 1);
            this.item.parent.subs.splice(this.index + 1, 0, this.item);
            editor_7.ed.redraw();
            editor_7.ed.select(this.item);
        };
        MoveDownAction.prototype.redo = function () {
            this.do();
        };
        MoveDownAction.prototype.undo = function () {
            this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
            this.item.parent.subs.splice(this.index, 0, this.item);
            editor_7.ed.redraw();
            editor_7.ed.select(this.item);
        };
        return MoveDownAction;
    }(action_4.Action));
    exports.MoveDownAction = MoveDownAction;
});
define("actions/moveup", ["require", "exports", "editor", "actions/action"], function (require, exports, editor_8, action_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MoveUpAction = /** @class */ (function (_super) {
        __extends(MoveUpAction, _super);
        function MoveUpAction(item) {
            var _this = _super.call(this) || this;
            _this.item = item;
            return _this;
        }
        MoveUpAction.prototype.do = function () {
            this.index = this.item.parent.subs.indexOf(this.item);
            this.item.parent.subs.splice(this.index, 1);
            this.item.parent.subs.splice(this.index - 1, 0, this.item);
            editor_8.ed.redraw();
            editor_8.ed.select(this.item);
        };
        MoveUpAction.prototype.redo = function () {
            this.do();
        };
        MoveUpAction.prototype.undo = function () {
            this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
            this.item.parent.subs.splice(this.index, 0, this.item);
            editor_8.ed.redraw();
            editor_8.ed.select(this.item);
        };
        return MoveUpAction;
    }(action_5.Action));
    exports.MoveUpAction = MoveUpAction;
});
define("actions/remove", ["require", "exports", "editor", "actions/action"], function (require, exports, editor_9, action_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RemoveAction = /** @class */ (function (_super) {
        __extends(RemoveAction, _super);
        function RemoveAction(item) {
            var _this = _super.call(this) || this;
            _this.item = item;
            return _this;
        }
        RemoveAction.prototype.do = function () {
            this.parent = this.item.parent;
            this.index = this.item.parent.subs.indexOf(this.item);
            this.item.parent.subs.splice(this.index, 1);
            this.item.parent = null;
            editor_9.ed.redraw();
            editor_9.ed.select(null);
        };
        RemoveAction.prototype.redo = function () {
            this.do();
        };
        RemoveAction.prototype.undo = function () {
            this.item.parent = this.parent;
            this.parent.subs.splice(this.index, 0, this.item);
            editor_9.ed.redraw();
            editor_9.ed.select(this.item);
        };
        return RemoveAction;
    }(action_6.Action));
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
define("editor", ["require", "exports", "actions/index", "enums", "item", "project", "tab"], function (require, exports, Actions, enums_3, item_4, project_1, tab_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DEC_RADIX = 10;
    var AUTOSAVE_INTERVAL = 2000;
    var Editor = /** @class */ (function () {
        function Editor() {
            this.cbItem = null;
            this.curTab = 0;
        }
        Editor.prototype.activeTab = function () {
            return this.project.tabs[this.curTab];
        };
        Editor.prototype.addExpander = function (id, right) {
            if (right === void 0) { right = false; }
            var expander = document.createElement('div');
            var icon = document.createElement('i');
            expander.id = "expander-" + id;
            expander.classList.add('expander', 'col');
            icon.classList.add('fa', "fa-chevron-" + (right ? 'right' : 'left'));
            expander.appendChild(icon);
            document.getElementById('body').appendChild(expander);
            expander.addEventListener('click', function () {
                var panel = document.getElementById("fields-" + id);
                panel.classList.toggle('hidden');
                icon.classList.toggle('fa-chevron-left');
                icon.classList.toggle('fa-chevron-right');
            });
        };
        Editor.prototype.addFieldGroup = function (id) {
            var group = document.createElement('div');
            group.id = "fields-" + id;
            group.classList.add('fields', 'col');
            document.getElementById('body').appendChild(group);
        };
        Editor.prototype.addHeadingField = function (group, label) {
            var fields = document.getElementById("fields-" + group);
            var heading = document.createElement('div');
            heading.classList.add('field', 'heading');
            heading.innerText = label;
            fields.appendChild(heading);
        };
        // tslint:disable-next-line:no-any
        Editor.prototype.addInputField = function (group, field, label, type, obj) {
            var _this = this;
            var fields = document.getElementById("fields-" + group);
            var input = document.createElement('input');
            input.classList.add('field');
            input.type = type;
            input.name = field;
            if (!!obj()) {
                // tslint:disable-next-line:no-any
                input.value = obj()[field];
            }
            var labelEle = document.createElement('label');
            labelEle.classList.add('field');
            labelEle.innerText = label;
            fields.appendChild(labelEle);
            fields.appendChild(input);
            input.disabled = !obj();
            input.addEventListener('change', function () {
                if (!!obj()) {
                    _this.activeTab().do(new Actions.ChangeFieldAction(obj(), group, field, (type === 'number') ? parseInt(input.value, DEC_RADIX) : input.value));
                }
            });
        };
        // tslint:disable-next-line:no-any
        Editor.prototype.addSelectField = function (group, field, label, options, obj) {
            var _this = this;
            var fields = document.getElementById("fields-" + group);
            var select = document.createElement('select');
            select.classList.add('field');
            select.name = field;
            for (var i = 0; i < options.length; i++) {
                select.add(new Option(options[i], i.toString()));
            }
            if (!!obj()) {
                // tslint:disable-next-line:no-any
                select.value = obj()[field];
            }
            var labelEle = document.createElement('label');
            labelEle.classList.add('field');
            labelEle.innerText = label;
            fields.appendChild(labelEle);
            fields.appendChild(select);
            select.disabled = !obj();
            select.addEventListener('change', function () {
                if (!!obj()) {
                    _this.activeTab().do(new Actions.ChangeFieldAction(obj(), group, field, parseInt(select.value, DEC_RADIX)));
                }
            });
        };
        Editor.prototype.addTab = function () {
            var tab = new tab_2.Tab(this.project);
            this.curTab = this.project.tabs.length - 1;
            this.redraw();
            this.updateProjectFields();
            this.select(tab.root);
        };
        // tslint:disable-next-line:no-any
        Editor.prototype.addTextAreaField = function (group, field, label, obj) {
            var _this = this;
            var fields = document.getElementById("fields-" + group);
            var textarea = document.createElement('textarea');
            textarea.classList.add('field');
            textarea.name = field;
            if (!!obj()) {
                // tslint:disable-next-line:no-any
                textarea.value = obj()[field];
            }
            var labelEle = document.createElement('label');
            labelEle.classList.add('field');
            labelEle.innerText = label;
            fields.appendChild(labelEle);
            fields.appendChild(textarea);
            textarea.disabled = !obj();
            textarea.addEventListener('change', function () {
                if (!!obj()) {
                    _this.activeTab().do(new Actions.ChangeFieldAction(obj(), group, field, textarea.value));
                }
            });
        };
        Editor.prototype.addTool = function (name, title, icon, key, action) {
            var _this = this;
            var tool = document.querySelector('#header').appendChild(document.createElement('div'));
            tool.classList.add('tool');
            tool.id = "tool-" + name;
            tool.title = "" + title + (key ? " (" + (key.substr(0, 1).toUpperCase() + key.substr(1)) + ")" : '');
            tool.innerHTML = "<i class=\"fa fa-" + icon + "\"></i>";
            tool.dataset.count = '0';
            // Const tool: HTMLElement = document.body.querySelector(`#tool-${name}`) as HTMLElement
            tool.addEventListener('click', function () {
                action(_this.selected());
            });
            if (key) {
                document.addEventListener('keydown', function (e) {
                    if (!document.activeElement || document.activeElement === document.body) {
                        if (e.key === key) {
                            e.preventDefault();
                            action(_this.selected());
                        }
                    }
                });
            }
        };
        Editor.prototype.addToolSpacer = function () {
            var spacer = document.createElement('div');
            spacer.classList.add('spacer');
            document.getElementById('header').appendChild(spacer);
        };
        Editor.prototype.addWorkspace = function () {
            var _this = this;
            var workspace = document.createElement('div');
            workspace.classList.add('col', 'expand');
            workspace.innerHTML = "<div id=\"workspace\" class=\"col expand\"><div id=\"tabs\" class=\"row\"></div><div id=\"container\" class=\"col\"></div></div>";
            document.getElementById('body').appendChild(workspace);
            this.container = document.getElementById('container');
            this.container.addEventListener('click', function (e) {
                var ele = _this.findItemElement(e.target);
                var item;
                if (ele) {
                    item = _this.activeTab().items[parseInt(ele.dataset.id, DEC_RADIX)];
                }
                _this.select(item);
            });
            this.container.addEventListener('dragstart', function (e) {
                var ele = _this.findItemElement(e.target);
                if (ele) {
                    var item = _this.activeTab().items[parseInt(ele.dataset.id, DEC_RADIX)];
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
            this.container.addEventListener('dragover', function (e) {
                e.preventDefault();
                var ele = _this.findItemElement(e.target);
                if (ele) {
                    e.dataTransfer.dropEffect = 'move';
                }
            });
            this.container.addEventListener('drop', function (e) {
                e.preventDefault();
                var ele = _this.findItemElement(e.target);
                if (ele) {
                    var item = _this.activeTab().items[parseInt(e.dataTransfer.getData('text/plain'), DEC_RADIX)];
                    var parent_1 = _this.activeTab().items[parseInt(ele.dataset.id, DEC_RADIX)];
                    if (item !== parent_1) {
                        _this.activeTab().do(new Actions.MoveAction(item, parent_1));
                    }
                }
            });
        };
        Editor.prototype.autosave = function () {
            localStorage.setItem('memmap-autosave', JSON.stringify(this.project.serialize()));
            this.setDirty(false);
        };
        Editor.prototype.changeTab = function (i) {
            this.curTab = i;
            this.redraw();
            this.updateProjectFields();
            this.select(this.activeTab().root);
        };
        Editor.prototype.closeTab = function (i) {
            if ((i === this.curTab && i > 0) || this.curTab === this.project.tabs.length - 1) {
                this.curTab--;
            }
            this.project.tabs.splice(i, 1);
            this.redraw();
            this.updateProjectFields();
            this.select(this.activeTab().root);
        };
        Editor.prototype.findItemElement = function (ele) {
            var el = ele;
            while (el && !el.classList.contains('item')) {
                el = el.parentElement;
            }
            return el;
        };
        Editor.prototype.init = function () {
            var _this = this;
            var autosave = localStorage.getItem('memmap-autosave');
            this.project = autosave ? project_1.Project.deserialize(JSON.parse(autosave)) : new project_1.Project();
            this.autosave();
            window.addEventListener('beforeunload', function () {
                _this.autosave();
            });
            this.addFieldGroup('item');
            this.addHeadingField('item', 'Details');
            this.addInputField('item', 'size', 'Size', 'number', function () { return _this.selected(); });
            this.addInputField('item', 'name', 'Name', 'text', function () { return _this.selected(); });
            this.addTextAreaField('item', 'desc', 'Description', function () { return _this.selected(); });
            this.addExpander('item');
            this.addWorkspace();
            this.addExpander('project', true);
            this.addFieldGroup('project');
            this.addHeadingField('project', 'Map');
            this.addSelectField('project', 'digitType', 'Digit Type', Object.keys(enums_3.DigitType).filter(function (v) { return isNaN(parseInt(v, DEC_RADIX)); }), function () { return _this.activeTab(); });
            this.addInputField('project', 'pad', 'Padding Digits', 'number', function () { return _this.activeTab(); });
            this.addHeadingField('project', 'Project');
            this.addInputField('project', 'name', 'Name', 'text', function () { return _this.project; });
            this.addToolSpacer();
            this.addTool('new', 'New Project', 'file', 'n', function () {
                if (confirm('You will lose all autosaved data if you start a new project. Continue?')) {
                    _this.project = new project_1.Project();
                    _this.redraw();
                }
            });
            this.addTool('open', 'Open Project', 'folder-open', 'o', function () { return project_1.Project.open(); });
            this.addTool('save', 'Download Project', 'download', 's', function () { return _this.project.save(); });
            this.addToolSpacer();
            this.addTool('cut', 'Cut', 'cut', 'x', function (item) {
                if (item && item.parent) {
                    if (_this.cbItem) {
                        _this.cbItem.copy(item);
                    }
                    else {
                        _this.cbItem = item;
                    }
                    _this.activeTab().do(new Actions.RemoveAction(item));
                    _this.setToolEnabled('paste', true);
                }
            });
            this.addTool('copy', 'Copy', 'copy', 'c', function (item) {
                if (item) {
                    if (!_this.cbItem) {
                        _this.cbItem = new item_4.Item(exports.ed.activeTab());
                    }
                    _this.cbItem.copy(item);
                    _this.setToolEnabled('paste', true);
                }
            });
            this.addTool('paste', 'Paste', 'paste', 'v', function (item) {
                if (_this.cbItem) {
                    _this.activeTab().do(new Actions.AddAction(item, _this.cbItem));
                }
            });
            this.setToolEnabled('paste', false);
            this.addToolSpacer();
            this.addTool('undo', 'Undo', 'undo', 'z', function () { return _this.activeTab().undo(); });
            this.setToolEnabled('undo', false);
            this.addTool('redo', 'Redo', 'repeat', 'y', function () { return _this.activeTab().redo(); });
            this.setToolEnabled('redo', false);
            this.addToolSpacer();
            this.addTool('add', 'Add Item', 'plus', 'Insert', function (item) { return _this.activeTab().do(new Actions.AddAction(item)); });
            this.addTool('rem', 'Remove Item', 'minus', 'Delete', function (item) {
                if (item && item.parent) {
                    _this.activeTab().do(new Actions.RemoveAction(item));
                }
            });
            this.addTool('up', 'Move Up', 'arrow-up', 'Home', function (item) {
                if (item && item.parent) {
                    var index = item.parent.subs.indexOf(item);
                    if (index > 0) {
                        _this.activeTab().do(new Actions.MoveUpAction(item));
                    }
                }
            });
            this.addTool('down', 'Move Down', 'arrow-down', 'End', function (item) {
                if (item && item.parent) {
                    var index = item.parent.subs.indexOf(item);
                    if (index < item.parent.subs.length - 1) {
                        _this.activeTab().do(new Actions.MoveDownAction(item));
                    }
                }
            });
            this.addToolSpacer();
            // tslint:disable-next-line:cyclomatic-complexity
            window.addEventListener('keydown', function (e) {
                var sel = _this.selected();
                if (sel && (!document.activeElement || document.activeElement === document.body)) {
                    var index = sel.parent ? sel.parent.subs.indexOf(sel) : -1;
                    switch (e.key) {
                        case 'ArrowUp':
                            if (index === 0) {
                                _this.select(sel.parent);
                            }
                            else if (index > 0) {
                                var item = sel.parent.subs[index - 1];
                                while (item.open && item.subs.length > 0) {
                                    item = item.subs[item.subs.length - 1];
                                }
                                _this.select(item);
                            }
                            break;
                        case 'ArrowLeft':
                            if (sel.subs.length > 0 && sel.open) {
                                sel.open = false;
                                _this.redraw(true);
                            }
                            else if (sel.parent) {
                                _this.select(sel.parent);
                            }
                            break;
                        case 'ArrowRight':
                            if (sel.subs.length > 0 && !sel.open) {
                                sel.open = true;
                                _this.redraw(true);
                            }
                            else if (sel.subs.length > 0) {
                                _this.select(sel.subs[0]);
                            }
                            break;
                        case 'ArrowDown':
                            if (sel.subs.length > 0 && sel.open) {
                                _this.select(sel.subs[0]);
                            }
                            else if (sel.parent && index < sel.parent.subs.length - 1) {
                                _this.select(sel.parent.subs[index + 1]);
                            }
                            else if (sel.parent) {
                                var item = sel;
                                while (item.parent && index === item.parent.subs.length - 1) {
                                    item = item.parent;
                                    index = item.parent ? item.parent.subs.indexOf(item) : -1;
                                }
                                if (item && index >= 0) {
                                    item = item.parent.subs[index + 1];
                                    _this.select(item);
                                }
                            }
                            break;
                        default:
                    }
                }
            });
            this.redraw();
            this.select(this.activeTab().root);
        };
        Editor.prototype.redraw = function (keepSelected) {
            if (keepSelected === void 0) { keepSelected = false; }
            var sel = this.selected();
            this.container.innerHTML = this.activeTab().root.render();
            this.updateTabs();
            this.updateCounters();
            if (keepSelected) {
                this.select(sel);
            }
        };
        Editor.prototype.select = function (item) {
            this.setFieldValue('item', 'size', item);
            this.setFieldValue('item', 'name', item);
            this.setFieldValue('item', 'desc', item);
            var allEles = document.body.querySelectorAll('.item');
            for (var _i = 0, allEles_1 = allEles; _i < allEles_1.length; _i++) {
                var ele = allEles_1[_i];
                ele.classList.remove('selected');
            }
            if (item) {
                var selEle = this.container.querySelector(".item[data-id=\"" + item.id + "\"]");
                if (selEle) {
                    selEle.classList.add('selected');
                }
            }
            this.setToolEnabled('rem', !!item && item.parent !== null);
            this.setToolEnabled('up', !!item && item.parent !== null && item.parent.subs.indexOf(item) > 0);
            this.setToolEnabled('down', !!item && item.parent !== null && item.parent.subs.indexOf(item) < item.parent.subs.length - 1);
        };
        Editor.prototype.selected = function () {
            if (this.container) {
                var selEle = this.container.querySelector('.item.selected');
                if (selEle) {
                    return this.activeTab().items[parseInt(selEle.dataset.id, DEC_RADIX)];
                }
            }
            return null;
        };
        Editor.prototype.setDirty = function (val) {
            var _this = this;
            if (val === void 0) { val = true; }
            this.dirty = val;
            document.title = "" + this.project.name + (this.dirty ? '*' : '') + " | Memory Mapper";
            if (this.autosaveTimeout) {
                clearTimeout(this.autosaveTimeout);
            }
            if (this.dirty) {
                this.autosaveTimeout = window.setTimeout(function () { return _this.autosave(); }, AUTOSAVE_INTERVAL);
            }
        };
        // tslint:disable-next-line:no-any
        Editor.prototype.setFieldValue = function (group, field, obj) {
            var input = document.body.querySelector("#fields-" + group + " input[name=\"" + field + "\"], #fields-" + group + " textarea[name=\"" + field + "\"], #fields-" + group + " select[name=\"" + field + "\"]");
            input.disabled = !obj;
            // tslint:disable-next-line:no-any
            input.value = obj ? obj[field] : '';
        };
        Editor.prototype.setToolEnabled = function (name, enabled) {
            var tool = document.body.querySelector("#tool-" + name);
            if (enabled) {
                tool.classList.remove('disabled');
            }
            else {
                tool.classList.add('disabled');
            }
        };
        Editor.prototype.toggleOpen = function (id) {
            this.activeTab().items[id].open = !this.activeTab().items[id].open;
            this.redraw(true);
        };
        Editor.prototype.updateCounters = function () {
            document.getElementById('tool-undo').dataset.count = (this.activeTab().undos.length ? this.activeTab().undos.length : '').toString();
            document.getElementById('tool-redo').dataset.count = (this.activeTab().redos.length ? this.activeTab().redos.length : '').toString();
        };
        Editor.prototype.updateProjectFields = function () {
            document.body.querySelector('#fields-project input[name="name"]').value = this.project.name;
            document.body.querySelector('#fields-project select[name="digitType"]').value = this.activeTab().digitType.toString();
            document.body.querySelector('#fields-project input[name="pad"]').value = this.activeTab().pad.toString();
        };
        Editor.prototype.updateTabs = function () {
            var out = '';
            for (var i = 0; i < this.project.tabs.length; i++) {
                if (i === this.curTab) {
                    out += "<div class=\"tab selected\">" + this.activeTab().root.name;
                }
                else {
                    out += "<div class=\"tab\" onclick=\"ed.changeTab(" + i + ")\">" + this.project.tabs[i].root.name;
                }
                if (this.project.tabs.length > 1) {
                    out += "<i class=\"fa fa-close\" onclick=\"ed.closeTab(" + i + ")\"></i>";
                }
                out += '</div>';
            }
            out += '<div id="new-tab" class="tab" onclick="ed.addTab()"><i class="fa fa-plus"></i></div>';
            document.getElementById('tabs').innerHTML = out;
        };
        return Editor;
    }());
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