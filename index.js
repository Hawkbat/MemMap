var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
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
    exports.default = Action;
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
define("tab", ["require", "exports", "item", "editor"], function (require, exports, item_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Tab = /** @class */ (function () {
        function Tab() {
            this.items = [];
            this.undos = [];
            this.redos = [];
        }
        Tab.prototype.redo = function () {
            if (this.redos.length > 0) {
                var act = this.redos.pop();
                act.redo();
                this.undos.push(act);
                editor_1.default.updateCounters();
                editor_1.default.setToolEnabled('undo', this.undos.length > 0);
                editor_1.default.setToolEnabled('redo', this.redos.length > 0);
                editor_1.default.project.setDirty();
            }
        };
        Tab.prototype.undo = function () {
            if (this.undos.length > 0) {
                var act = this.undos.pop();
                act.undo();
                this.redos.push(act);
                editor_1.default.updateCounters();
                editor_1.default.setToolEnabled('undo', this.undos.length > 0);
                editor_1.default.setToolEnabled('redo', this.redos.length > 0);
                editor_1.default.project.setDirty();
            }
        };
        Tab.prototype.do = function (act) {
            act.do();
            this.redos.length = 0;
            this.undos.push(act);
            editor_1.default.updateCounters();
            editor_1.default.setToolEnabled('undo', this.undos.length > 0);
            editor_1.default.setToolEnabled('redo', this.redos.length > 0);
            editor_1.default.project.setDirty();
        };
        Tab.deserialize = function (conf) {
            var t = new Tab();
            t.root = item_1.default.deserialize(t, conf);
            return t;
        };
        Tab.prototype.serialize = function () {
            return this.root.serialize();
        };
        return Tab;
    }());
    exports.default = Tab;
});
define("item", ["require", "exports", "editor", "enums"], function (require, exports, editor_2, enums_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var HEX_BASE = 16;
    var ODD_MOD = 2;
    function formatNum(num) {
        if (editor_2.default.project.digitType === enums_1.DigitType.Hexadecimal) {
            var str = num.toString(HEX_BASE).toUpperCase();
            while (str.length < editor_2.default.project.pad || (str.length % ODD_MOD) === 1) {
                str = "0" + str;
            }
            return "0x" + str;
        }
        else if (editor_2.default.project.digitType === enums_1.DigitType.Decimal) {
            var str = num.toString();
            while (str.length < editor_2.default.project.pad) {
                str = "0" + str;
            }
            return str;
        }
    }
    var Item = /** @class */ (function () {
        function Item(size, name, desc, subs) {
            if (size === void 0) { size = 0; }
            if (name === void 0) { name = ''; }
            if (desc === void 0) { desc = ''; }
            if (subs === void 0) { subs = []; }
            this.open = true;
            this.size = size;
            this.name = name;
            this.desc = desc;
            this.subs = subs;
            try {
                for (var _a = __values(this.subs), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var sub = _b.value;
                    sub.parent = this;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
            }
            this.id = editor_2.default.activeTab().items.length;
            editor_2.default.activeTab().items.push(this);
            var e_1, _c;
        }
        Item.deserialize = function (tab, conf) {
            var t = new Item();
            t.size = conf.size;
            t.name = conf.name;
            t.desc = conf.desc;
            t.subs = conf.subs.map(function (s) { return Item.deserialize(tab, s); });
            t.id = tab.items.length;
            tab.items.push(t);
            return t;
        };
        Item.prototype.copy = function (src) {
            this.size = src.size;
            this.name = src.name;
            this.desc = src.desc;
            try {
                for (var _a = __values(this.subs), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var sub = _b.value;
                    sub.parent = undefined;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_2) throw e_2.error; }
            }
            this.subs = [];
            try {
                for (var _d = __values(this.subs), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var sub = _e.value;
                    var child = new Item();
                    child.copy(sub);
                    child.parent = this;
                    this.subs.push(child);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_f = _d.return)) _f.call(_d);
                }
                finally { if (e_3) throw e_3.error; }
            }
            var e_2, _c, e_3, _f;
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
                out += "<div class=\"cell\">" + formatNum(start) + "-" + formatNum(start + this.size - 1) + ":</div>";
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
                try {
                    for (var _a = __values(this.subs), _b = _a.next(); !_b.done; _b = _a.next()) {
                        var sub = _b.value;
                        out += sub.render(subStart, depth + 1);
                        subStart += sub.size;
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            }
            out += '</div>';
            return out;
            var e_4, _c;
        };
        Item.prototype.serialize = function () {
            return { size: this.size, name: this.name, desc: this.desc, subs: this.subs.map(function (v) { return v.serialize(); }) };
        };
        return Item;
    }());
    exports.default = Item;
});
define("actions/add", ["require", "exports", "editor", "item", "actions/action"], function (require, exports, editor_3, item_2, action_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AddAction = /** @class */ (function (_super) {
        __extends(AddAction, _super);
        function AddAction(parent, src) {
            var _this = _super.call(this) || this;
            _this.parent = (parent === undefined) ? editor_3.default.activeTab().root : parent;
            _this.src = src;
            return _this;
        }
        AddAction.prototype.do = function () {
            this.item = new item_2.default();
            this.item.name = "Item " + this.item.id;
            if (this.src) {
                this.item.copy(this.src);
            }
            this.item.parent = this.parent;
            this.parent.subs.push(this.item);
            editor_3.default.redraw();
            editor_3.default.select(this.item);
        };
        AddAction.prototype.redo = function () {
            this.item.parent = this.parent;
            this.parent.subs.push(this.item);
            editor_3.default.redraw();
            editor_3.default.select(this.item);
        };
        AddAction.prototype.undo = function () {
            this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
            this.item.parent = undefined;
            editor_3.default.redraw();
            editor_3.default.select();
        };
        return AddAction;
    }(action_1.default));
    exports.default = AddAction;
});
define("actions/changefield", ["require", "exports", "editor", "actions/action"], function (require, exports, editor_4, action_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ChangeFieldAction = /** @class */ (function (_super) {
        __extends(ChangeFieldAction, _super);
        function ChangeFieldAction(item, field, value) {
            var _this = _super.call(this) || this;
            _this.item = item;
            _this.field = field;
            // tslint:disable-next-line:no-any
            _this.oldValue = _this.item[field];
            _this.newValue = value;
            return _this;
        }
        ChangeFieldAction.prototype.do = function () {
            // tslint:disable-next-line:no-any
            this.item[this.field] = this.newValue;
            editor_4.default.redraw();
            editor_4.default.select(this.item);
        };
        ChangeFieldAction.prototype.redo = function () {
            this.do();
        };
        ChangeFieldAction.prototype.undo = function () {
            // tslint:disable-next-line:no-any
            this.item[this.field] = this.oldValue;
            editor_4.default.redraw();
            editor_4.default.select(this.item);
        };
        return ChangeFieldAction;
    }(action_2.default));
    exports.default = ChangeFieldAction;
});
define("actions/move", ["require", "exports", "editor", "actions/action"], function (require, exports, editor_5, action_3) {
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
            editor_5.default.redraw();
            editor_5.default.select(this.item);
        };
        MoveAction.prototype.redo = function () {
            this.do();
        };
        MoveAction.prototype.undo = function () {
            this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
            this.item.parent = this.oldParent;
            this.oldParent.subs.splice(this.oldIndex, 0, this.item);
            editor_5.default.redraw();
            editor_5.default.select(this.item);
        };
        return MoveAction;
    }(action_3.default));
    exports.default = MoveAction;
});
define("actions/movedown", ["require", "exports", "editor", "actions/action"], function (require, exports, editor_6, action_4) {
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
            this.item.parent.subs.splice(this.index + 1, 0, this.item);
            editor_6.default.redraw();
            editor_6.default.select(this.item);
        };
        MoveUpAction.prototype.redo = function () {
            this.do();
        };
        MoveUpAction.prototype.undo = function () {
            this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
            this.item.parent.subs.splice(this.index, 0, this.item);
            editor_6.default.redraw();
            editor_6.default.select(this.item);
        };
        return MoveUpAction;
    }(action_4.default));
    exports.default = MoveUpAction;
});
define("actions/moveup", ["require", "exports", "editor", "actions/action"], function (require, exports, editor_7, action_5) {
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
            editor_7.default.redraw();
            editor_7.default.select(this.item);
        };
        MoveUpAction.prototype.redo = function () {
            this.do();
        };
        MoveUpAction.prototype.undo = function () {
            this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
            this.item.parent.subs.splice(this.index, 0, this.item);
            editor_7.default.redraw();
            editor_7.default.select(this.item);
        };
        return MoveUpAction;
    }(action_5.default));
    exports.default = MoveUpAction;
});
define("actions/remove", ["require", "exports", "editor", "actions/action"], function (require, exports, editor_8, action_6) {
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
            this.item.parent = undefined;
            editor_8.default.redraw();
            editor_8.default.select();
        };
        RemoveAction.prototype.redo = function () {
            this.do();
        };
        RemoveAction.prototype.undo = function () {
            this.item.parent = this.parent;
            this.parent.subs.splice(this.index, 0, this.item);
            editor_8.default.redraw();
            editor_8.default.select(this.item);
        };
        return RemoveAction;
    }(action_6.default));
    exports.default = RemoveAction;
});
define("actions/index", ["require", "exports", "actions/action", "actions/add", "actions/changefield", "actions/move", "actions/movedown", "actions/moveup", "actions/remove"], function (require, exports, action_7, add_1, changefield_1, move_1, movedown_1, moveup_1, remove_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = { Action: action_7.default, AddAction: add_1.default, ChangeFieldAction: changefield_1.default, MoveAction: move_1.default, MoveDownAction: movedown_1.default, MoveUpAction: moveup_1.default, RemoveAction: remove_1.default };
});
define("project", ["require", "exports", "tab", "enums", "editor"], function (require, exports, tab_1, enums_2, editor_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Project = /** @class */ (function () {
        function Project() {
            this.tabs = [];
            this.name = 'New Project';
            this.digitType = enums_2.DigitType.Hexadecimal;
            this.pad = 4;
            this.dirty = false;
            this.setDirty();
        }
        Project.prototype.setDirty = function (val) {
            if (val === void 0) { val = true; }
            this.dirty = val;
            if (val)
                document.title = this.name + "* | Memory Mapper";
            else
                document.title = this.name + " | Memory Mapper";
        };
        Project.deserialize = function (conf) {
            var p = new Project();
            p.name = conf.name;
            p.digitType = conf.digitType;
            p.pad = conf.pad;
            p.tabs = conf.tabs.map(function (t) { return tab_1.default.deserialize(t); });
            return p;
        };
        Project.prototype.serialize = function () {
            return { name: this.name, digitType: this.digitType, pad: this.pad, tabs: this.tabs.map(function (tab) { return tab.serialize(); }) };
        };
        Project.open = function () {
            var n = document.createElement('input');
            n.setAttribute('type', 'file');
            n.setAttribute('accept', '.memmap.json');
            n.addEventListener('change', function (e) {
                if (n.files.length > 0) {
                    var r_1 = new FileReader();
                    r_1.addEventListener('load', function (ev) {
                        editor_9.default.project = Project.deserialize(JSON.parse(r_1.result));
                        editor_9.default.redraw();
                        editor_9.default.updateProjectFields();
                        editor_9.default.project.setDirty(false);
                    });
                    r_1.readAsText(n.files[0], 'utf-8');
                }
            });
            n.click();
        };
        Project.prototype.save = function () {
            var out = JSON.stringify(this.serialize());
            var a = document.createElement('a');
            a.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(out));
            a.setAttribute('download', this.name + '.memmap.json');
            a.click();
            this.setDirty(false);
        };
        return Project;
    }());
    exports.default = Project;
});
define("editor", ["require", "exports", "actions/index", "item", "project", "tab"], function (require, exports, actions_1, item_3, project_1, tab_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Editor = /** @class */ (function () {
        function Editor() {
            this.project = new project_1.default();
            this.cbItem = undefined;
            this.curTab = 0;
        }
        Editor.prototype.select = function (item) {
            this.setItemField('size', item);
            this.setItemField('name', item);
            this.setItemField('desc', item);
            var allEles = document.body.querySelectorAll('.item');
            try {
                for (var allEles_1 = __values(allEles), allEles_1_1 = allEles_1.next(); !allEles_1_1.done; allEles_1_1 = allEles_1.next()) {
                    var ele = allEles_1_1.value;
                    ele.classList.remove('selected');
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (allEles_1_1 && !allEles_1_1.done && (_a = allEles_1.return)) _a.call(allEles_1);
                }
                finally { if (e_5) throw e_5.error; }
            }
            if (item) {
                var selEle = this.container.querySelector(".item[data-id=\"" + item.id + "\"]");
                if (selEle) {
                    selEle.classList.add('selected');
                }
            }
            this.setToolEnabled('rem', item !== undefined && item.parent !== undefined);
            this.setToolEnabled('up', item !== undefined && item.parent !== undefined && item.parent.subs.indexOf(item) > 0);
            this.setToolEnabled('down', item !== undefined && item.parent !== undefined && item.parent.subs.indexOf(item) < item.parent.subs.length - 1);
            var e_5, _a;
        };
        Editor.prototype.selected = function () {
            var selEle = this.container.querySelector('.item.selected');
            if (selEle) {
                return this.activeTab().items[parseInt(selEle.dataset.id)];
            }
            return null;
        };
        Editor.prototype.toggleOpen = function (id) {
            this.activeTab().items[id].open = !this.activeTab().items[id].open;
            this.redraw(true);
        };
        Editor.prototype.bindItemField = function (field) {
            var _this = this;
            var input = document.body.querySelector('#details input[name="' + field + '"], #details textarea[name="' + field + '"]');
            input.disabled = true;
            input.addEventListener('change', function (e) {
                var item = _this.selected();
                if (item)
                    _this.activeTab().do(new actions_1.default.ChangeFieldAction(item, field, (input.type == 'number') ? parseInt(input.value) : input.value));
            });
        };
        Editor.prototype.setItemField = function (field, item) {
            var input = document.body.querySelector('#details input[name="' + field + '"], #details textarea[name="' + field + '"]');
            input.disabled = !item;
            if (item)
                input.value = item[field];
            else
                input.value = "";
        };
        Editor.prototype.bindProjectField = function (field) {
            var _this = this;
            var input = document.body.querySelector('#project input[name="' + field + '"], #project textarea[name="' + field + '"], #project select[name="' + field + '"]');
            input.value = this.project[field];
            input.addEventListener('change', function (e) {
                if (input.tagName == 'SELECT' || input.type == 'number')
                    _this.project[field] = parseInt(input.value);
                else
                    _this.project[field] = input.value;
                _this.redraw(true);
                _this.project.setDirty();
            });
        };
        Editor.prototype.getItemEle = function (ele) {
            while (ele && !ele.classList.contains('item'))
                ele = ele.parentElement;
            return ele;
        };
        Editor.prototype.bindTool = function (name, key, action) {
            var _this = this;
            var tool = document.body.querySelector('#tool-' + name);
            tool.addEventListener('click', function (e) {
                action(_this.selected());
            });
            if (key) {
                document.addEventListener('keydown', function (e) {
                    if (!document.activeElement || document.activeElement == document.body) {
                        if (e.key == key) {
                            e.preventDefault();
                            action(_this.selected());
                        }
                    }
                });
            }
        };
        Editor.prototype.setToolEnabled = function (name, enabled) {
            var tool = document.body.querySelector('#tool-' + name);
            if (enabled)
                tool.classList.remove('disabled');
            else
                tool.classList.add('disabled');
        };
        Editor.prototype.updateCounters = function () {
            document.getElementById('tool-undo').dataset.count = '' + (this.activeTab().undos.length ? this.activeTab().undos.length : '');
            document.getElementById('tool-redo').dataset.count = '' + (this.activeTab().redos.length ? this.activeTab().redos.length : '');
        };
        Editor.prototype.updateProjectFields = function () {
            document.body.querySelector('#project input[name="name"]').value = this.project.name;
            document.body.querySelector('#project select[name="digitType"]').value = '' + this.project.digitType;
            document.body.querySelector('#project input[name="pad"]').value = '' + this.project.pad;
        };
        Editor.prototype.updateTabs = function () {
            var out = '';
            for (var i = 0; i < this.project.tabs.length; i++) {
                if (i == this.curTab)
                    out += '<div class="tab selected">' + this.activeTab().root.name + '</div>';
                else
                    out += '<div class="tab" onclick="ed.changeTab(' + i + ')">' + this.project.tabs[i].root.name + '</div>';
            }
            out += '<div id="new-tab" class="tab" onclick="ed.addTab()"><i class="fa fa-plus"></i></div>';
            document.getElementById('tabs').innerHTML = out;
        };
        Editor.prototype.activeTab = function () {
            return this.project.tabs[this.curTab];
        };
        Editor.prototype.changeTab = function (i) {
            this.curTab = i;
            this.redraw();
            this.select(this.activeTab().root);
        };
        Editor.prototype.addTab = function () {
            var tab = new tab_2.default();
            this.curTab = this.project.tabs.length;
            this.project.tabs.push(tab);
            tab.root = new item_3.default(0x10000, "Map " + this.project.tabs.length, "");
            tab.items.push(tab.root);
            this.redraw();
            this.select(tab.root);
        };
        Editor.prototype.redraw = function (keepSelected) {
            if (keepSelected === void 0) { keepSelected = false; }
            var sel = this.selected();
            this.container.innerHTML = this.activeTab().root.render();
            this.updateTabs();
            this.updateCounters();
            if (keepSelected)
                this.select(sel);
        };
        Editor.prototype.init = function () {
            var _this = this;
            this.container = document.getElementById('container');
            this.container.addEventListener('click', function (e) {
                var ele = _this.getItemEle(e.target);
                var item = null;
                if (ele)
                    item = _this.activeTab().items[parseInt(ele.dataset.id)];
                _this.select(item);
            });
            this.container.addEventListener('dragstart', function (e) {
                var ele = _this.getItemEle(e.target);
                if (ele) {
                    var item = _this.activeTab().items[parseInt(ele.dataset.id)];
                    if (item.parent) {
                        e.dataTransfer.setData('text/plain', '' + item.id);
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
                var ele = _this.getItemEle(e.target);
                if (ele) {
                    e.dataTransfer.dropEffect = 'move';
                }
            });
            this.container.addEventListener('drop', function (e) {
                e.preventDefault();
                var ele = _this.getItemEle(e.target);
                if (ele) {
                    var item = _this.activeTab().items[parseInt(e.dataTransfer.getData('text/plain'))];
                    var parent = _this.activeTab().items[parseInt(ele.dataset.id)];
                    if (item != parent)
                        _this.activeTab().do(new actions_1.default.MoveAction(item, parent));
                }
            });
            this.addTab();
            this.bindItemField('name');
            this.bindItemField('desc');
            this.bindItemField('size');
            this.bindProjectField('name');
            this.bindProjectField('digitType');
            this.bindProjectField('pad');
            this.bindTool('new', 'n', function (item) { });
            this.bindTool('open', 'o', function (item) { return project_1.default.open(); });
            this.bindTool('save', 's', function (item) { return _this.project.save(); });
            this.bindTool('cut', 'x', function (item) {
                if (item && item.parent) {
                    if (_this.cbItem)
                        _this.cbItem.copy(item);
                    else
                        _this.cbItem = item;
                    _this.activeTab().do(new actions_1.default.RemoveAction(item));
                    _this.setToolEnabled('paste', true);
                }
            });
            this.bindTool('copy', 'c', function (item) {
                if (item) {
                    if (!_this.cbItem)
                        _this.cbItem = new item_3.default();
                    _this.cbItem.copy(item);
                    _this.setToolEnabled('paste', true);
                }
            });
            this.bindTool('paste', 'v', function (item) {
                if (_this.cbItem)
                    _this.activeTab().do(new actions_1.default.AddAction(item, _this.cbItem));
            });
            this.bindTool('undo', 'z', function (item) { return _this.activeTab().undo(); });
            this.bindTool('redo', 'y', function (item) { return _this.activeTab().redo(); });
            this.bindTool('add', 'Insert', function (item) { return _this.activeTab().do(new actions_1.default.AddAction(item)); });
            this.bindTool('rem', 'Delete', function (item) {
                if (item && item.parent)
                    _this.activeTab().do(new actions_1.default.RemoveAction(item));
            });
            this.bindTool('up', 'ArrowUp', function (item) {
                if (item && item.parent) {
                    var index = item.parent.subs.indexOf(item);
                    if (index > 0)
                        _this.activeTab().do(new actions_1.default.MoveUpAction(item));
                }
            });
            this.bindTool('down', 'ArrowDown', function (item) {
                if (item && item.parent) {
                    var index = item.parent.subs.indexOf(item);
                    if (index < item.parent.subs.length - 1)
                        _this.activeTab().do(new actions_1.default.MoveDownAction(item));
                }
            });
            this.redraw();
            this.select(this.activeTab().root);
        };
        return Editor;
    }());
    exports.Editor = Editor;
    exports.default = new Editor();
});
define("main", ["require", "exports", "editor"], function (require, exports, editor_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable-next-line:no-any
    window.ed = editor_10.default;
    editor_10.default.init();
});
