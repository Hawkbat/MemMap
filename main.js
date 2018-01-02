"use strict";
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
var Action = /** @class */ (function () {
    function Action() {
    }
    return Action;
}());
var AddAction = /** @class */ (function (_super) {
    __extends(AddAction, _super);
    function AddAction(parent, src) {
        if (src === void 0) { src = null; }
        var _this = _super.call(this) || this;
        _this.parent = (parent == null) ? activeTab().root : parent;
        _this.src = src;
        return _this;
    }
    AddAction.prototype.do = function () {
        this.item = new Item();
        this.item.name = 'Item ' + this.item.id;
        if (this.src)
            this.item.copy(this.src);
        this.item.parent = this.parent;
        this.parent.subs.push(this.item);
        redraw();
        select(this.item);
    };
    AddAction.prototype.undo = function () {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
        this.item.parent = null;
        redraw();
        select(null);
    };
    AddAction.prototype.redo = function () {
        this.item.parent = this.parent;
        this.parent.subs.push(this.item);
        redraw();
        select(this.item);
    };
    return AddAction;
}(Action));
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
        redraw();
        select(null);
    };
    RemoveAction.prototype.undo = function () {
        this.item.parent = this.parent;
        this.parent.subs.splice(this.index, 0, this.item);
        redraw();
        select(this.item);
    };
    RemoveAction.prototype.redo = function () {
        this.do();
    };
    return RemoveAction;
}(Action));
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
        redraw();
        select(this.item);
    };
    MoveAction.prototype.undo = function () {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
        this.item.parent = this.oldParent;
        this.oldParent.subs.splice(this.oldIndex, 0, this.item);
        redraw();
        select(this.item);
    };
    MoveAction.prototype.redo = function () {
        this.do();
    };
    return MoveAction;
}(Action));
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
        redraw();
        select(this.item);
    };
    MoveUpAction.prototype.undo = function () {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
        this.item.parent.subs.splice(this.index, 0, this.item);
        redraw();
        select(this.item);
    };
    MoveUpAction.prototype.redo = function () {
        this.do();
    };
    return MoveUpAction;
}(Action));
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
        redraw();
        select(this.item);
    };
    MoveDownAction.prototype.undo = function () {
        this.item.parent.subs.splice(this.item.parent.subs.indexOf(this.item), 1);
        this.item.parent.subs.splice(this.index, 0, this.item);
        redraw();
        select(this.item);
    };
    MoveDownAction.prototype.redo = function () {
        this.do();
    };
    return MoveDownAction;
}(Action));
var ChangeFieldAction = /** @class */ (function (_super) {
    __extends(ChangeFieldAction, _super);
    function ChangeFieldAction(item, field, value) {
        var _this = _super.call(this) || this;
        _this.item = item;
        _this.field = field;
        _this.oldValue = _this.item[field];
        _this.newValue = value;
        return _this;
    }
    ChangeFieldAction.prototype.do = function () {
        this.item[this.field] = this.newValue;
        redraw();
        select(this.item);
    };
    ChangeFieldAction.prototype.undo = function () {
        this.item[this.field] = this.oldValue;
        redraw();
        select(this.item);
    };
    ChangeFieldAction.prototype.redo = function () {
        this.do();
    };
    return ChangeFieldAction;
}(Action));
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
        for (var i = 0; i < this.subs.length; i++)
            this.subs[i].parent = this;
        this.id = activeTab().items.length;
        activeTab().items.push(this);
    }
    Item.prototype.copy = function (src) {
        this.size = src.size;
        this.name = src.name;
        this.desc = src.desc;
        for (var i = 0; i < this.subs.length; i++)
            this.subs[i].parent = null;
        this.subs = [];
        for (var i = 0; i < src.subs.length; i++) {
            var child = new Item();
            child.copy(src.subs[i]);
            child.parent = this;
            this.subs.push(child);
        }
    };
    Item.prototype.render = function (start, depth) {
        if (start === void 0) { start = 0; }
        if (depth === void 0) { depth = 0; }
        var out = '';
        out += '<div class="col">';
        out += '<div class="row item" draggable="true" data-id="' + this.id + '">';
        if (this.subs.length > 0) {
            if (this.open)
                out += '<i class="fa fa-fw fa-lg fa-caret-down" onclick="toggleOpen(' + this.id + ')"></i>';
            else
                out += '<i class="fa fa-fw fa-lg fa-caret-right" onclick="toggleOpen(' + this.id + ')"></i>';
        }
        else {
            out += '<i></i>';
        }
        if (this.size > 0)
            out += '<div class="cell">' + formatNum(start) + '-' + formatNum(start + this.size - 1) + ':</div>';
        if (this.desc)
            out += '<div class="cell">' + this.name + ' (' + this.desc + ')</div>';
        else
            out += '<div class="cell">' + this.name + '</div>';
        out += '</div>';
        if (this.open) {
            for (var i = 0; i < this.subs.length; i++) {
                out += this.subs[i].render(start, depth + 1);
                start += this.subs[i].size;
            }
        }
        out += '</div>';
        return out;
    };
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
    Item.prototype.serialize = function () {
        return { size: this.size, name: this.name, desc: this.desc, subs: this.subs.map(function (v) { return v.serialize(); }) };
    };
    return Item;
}());
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
            updateCounters();
            setToolEnabled('undo', this.undos.length > 0);
            setToolEnabled('redo', this.redos.length > 0);
            project.setDirty();
        }
    };
    Tab.prototype.undo = function () {
        if (this.undos.length > 0) {
            var act = this.undos.pop();
            act.undo();
            this.redos.push(act);
            updateCounters();
            setToolEnabled('undo', this.undos.length > 0);
            setToolEnabled('redo', this.redos.length > 0);
            project.setDirty();
        }
    };
    Tab.prototype.do = function (act) {
        act.do();
        this.redos.length = 0;
        this.undos.push(act);
        updateCounters();
        setToolEnabled('undo', this.undos.length > 0);
        setToolEnabled('redo', this.redos.length > 0);
        project.setDirty();
    };
    Tab.deserialize = function (conf) {
        var t = new Tab();
        t.root = Item.deserialize(t, conf);
        return t;
    };
    Tab.prototype.serialize = function () {
        return this.root.serialize();
    };
    return Tab;
}());
var DigitType;
(function (DigitType) {
    DigitType[DigitType["Hexadecimal"] = 0] = "Hexadecimal";
    DigitType[DigitType["Decimal"] = 1] = "Decimal";
})(DigitType || (DigitType = {}));
var Project = /** @class */ (function () {
    function Project() {
        this.tabs = [];
        this.name = 'New Project';
        this.digitType = DigitType.Hexadecimal;
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
        p.tabs = conf.tabs.map(function (t) { return Tab.deserialize(t); });
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
                    project = Project.deserialize(JSON.parse(r_1.result));
                    redraw();
                    updateProjectFields();
                    project.setDirty(false);
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
function formatNum(num) {
    if (project.digitType == DigitType.Hexadecimal) {
        var str = num.toString(16).toUpperCase();
        while (str.length < project.pad || (str.length % 2) == 1)
            str = "0" + str;
        return '0x' + str;
    }
    else if (project.digitType == DigitType.Decimal) {
        var str = num.toString();
        while (str.length < project.pad)
            str = "0" + str;
        return str;
    }
}
function select(item) {
    setItemField('size', item);
    setItemField('name', item);
    setItemField('desc', item);
    var allEles = document.body.querySelectorAll('.item');
    for (var i = 0; i < allEles.length; i++)
        allEles[i].classList.remove('selected');
    if (item) {
        var selEle = container.querySelector('.item[data-id="' + item.id + '"]');
        if (selEle)
            selEle.classList.add('selected');
    }
    setToolEnabled('rem', item != null && item.parent != null);
    setToolEnabled('up', item != null && item.parent != null && item.parent.subs.indexOf(item) > 0);
    setToolEnabled('down', item != null && item.parent != null && item.parent.subs.indexOf(item) < item.parent.subs.length - 1);
}
function selected() {
    var selEle = container.querySelector('.item.selected');
    if (selEle) {
        return activeTab().items[parseInt(selEle.dataset.id)];
    }
    return null;
}
function toggleOpen(id) {
    activeTab().items[id].open = !activeTab().items[id].open;
    redraw(true);
}
function bindItemField(field) {
    var input = document.body.querySelector('#details input[name="' + field + '"], #details textarea[name="' + field + '"]');
    input.disabled = true;
    input.addEventListener('change', function (e) {
        var item = selected();
        if (item)
            activeTab().do(new ChangeFieldAction(item, field, (input.type == 'number') ? parseInt(input.value) : input.value));
    });
}
function setItemField(field, item) {
    var input = document.body.querySelector('#details input[name="' + field + '"], #details textarea[name="' + field + '"]');
    input.disabled = !item;
    if (item)
        input.value = item[field];
    else
        input.value = "";
}
function bindProjectField(field) {
    var input = document.body.querySelector('#project input[name="' + field + '"], #project textarea[name="' + field + '"], #project select[name="' + field + '"]');
    input.value = project[field];
    input.addEventListener('change', function (e) {
        if (input.tagName == 'SELECT' || input.type == 'number')
            project[field] = parseInt(input.value);
        else
            project[field] = input.value;
        redraw(true);
        project.setDirty();
    });
}
function getItemEle(ele) {
    while (ele && !ele.classList.contains('item'))
        ele = ele.parentElement;
    return ele;
}
function bindTool(name, key, action) {
    var tool = document.body.querySelector('#tool-' + name);
    tool.addEventListener('click', function (e) {
        action(selected());
    });
    if (key) {
        document.addEventListener('keydown', function (e) {
            if (!document.activeElement || document.activeElement == document.body) {
                if (e.key == key) {
                    e.preventDefault();
                    action(selected());
                }
            }
        });
    }
}
function setToolEnabled(name, enabled) {
    var tool = document.body.querySelector('#tool-' + name);
    if (enabled)
        tool.classList.remove('disabled');
    else
        tool.classList.add('disabled');
}
function updateCounters() {
    document.getElementById('tool-undo').dataset.count = '' + (activeTab().undos.length ? activeTab().undos.length : '');
    document.getElementById('tool-redo').dataset.count = '' + (activeTab().redos.length ? activeTab().redos.length : '');
}
function updateProjectFields() {
    document.body.querySelector('#project input[name="name"]').value = project.name;
    document.body.querySelector('#project select[name="digitType"]').value = '' + project.digitType;
    document.body.querySelector('#project input[name="pad"]').value = '' + project.pad;
}
function updateTabs() {
    var out = '';
    for (var i = 0; i < project.tabs.length; i++) {
        if (i == curTab)
            out += '<div class="tab selected">' + activeTab().root.name + '</div>';
        else
            out += '<div class="tab" onclick="changeTab(' + i + ')">' + project.tabs[i].root.name + '</div>';
    }
    out += '<div id="new-tab" class="tab" onclick="addTab()"><i class="fa fa-plus"></i></div>';
    document.getElementById('tabs').innerHTML = out;
}
function activeTab() {
    return project.tabs[curTab];
}
function changeTab(i) {
    curTab = i;
    redraw();
    select(activeTab().root);
}
function addTab() {
    var tab = new Tab();
    curTab = project.tabs.length;
    project.tabs.push(tab);
    tab.root = new Item(0x10000, "Map " + project.tabs.length, "");
    tab.items.push(tab.root);
    redraw();
    select(tab.root);
}
function redraw(keepSelected) {
    if (keepSelected === void 0) { keepSelected = false; }
    var sel = selected();
    container.innerHTML = activeTab().root.render();
    updateTabs();
    updateCounters();
    if (keepSelected)
        select(sel);
}
var container = document.getElementById('container');
container.addEventListener('click', function (e) {
    var ele = getItemEle(e.target);
    var item = null;
    if (ele)
        item = activeTab().items[parseInt(ele.dataset.id)];
    select(item);
});
container.addEventListener('dragstart', function (e) {
    var ele = getItemEle(e.target);
    if (ele) {
        var item = activeTab().items[parseInt(ele.dataset.id)];
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
container.addEventListener('dragover', function (e) {
    e.preventDefault();
    var ele = getItemEle(e.target);
    if (ele) {
        e.dataTransfer.dropEffect = 'move';
    }
});
container.addEventListener('drop', function (e) {
    e.preventDefault();
    var ele = getItemEle(e.target);
    if (ele) {
        var item = activeTab().items[parseInt(e.dataTransfer.getData('text/plain'))];
        var parent_1 = activeTab().items[parseInt(ele.dataset.id)];
        if (item != parent_1)
            activeTab().do(new MoveAction(item, parent_1));
    }
});
var curTab = 0;
var project = new Project();
addTab();
bindItemField('name');
bindItemField('desc');
bindItemField('size');
bindProjectField('name');
bindProjectField('digitType');
bindProjectField('pad');
bindTool('new', 'n', function (item) { });
bindTool('open', 'o', function (item) { return Project.open(); });
bindTool('save', 's', function (item) { return project.save(); });
var cbItem = null;
bindTool('cut', 'x', function (item) {
    if (item && item.parent) {
        if (cbItem)
            cbItem.copy(item);
        else
            cbItem = item;
        activeTab().do(new RemoveAction(item));
        setToolEnabled('paste', true);
    }
});
bindTool('copy', 'c', function (item) {
    if (item) {
        if (!cbItem)
            cbItem = new Item();
        cbItem.copy(item);
        setToolEnabled('paste', true);
    }
});
bindTool('paste', 'v', function (item) {
    if (cbItem)
        activeTab().do(new AddAction(item, cbItem));
});
bindTool('undo', 'z', function (item) { return activeTab().undo(); });
bindTool('redo', 'y', function (item) { return activeTab().redo(); });
bindTool('add', 'Insert', function (item) { return activeTab().do(new AddAction(item)); });
bindTool('rem', 'Delete', function (item) {
    if (item && item.parent)
        activeTab().do(new RemoveAction(item));
});
bindTool('up', 'ArrowUp', function (item) {
    if (item && item.parent) {
        var index = item.parent.subs.indexOf(item);
        if (index > 0)
            activeTab().do(new MoveUpAction(item));
    }
});
bindTool('down', 'ArrowDown', function (item) {
    if (item && item.parent) {
        var index = item.parent.subs.indexOf(item);
        if (index < item.parent.subs.length - 1)
            activeTab().do(new MoveDownAction(item));
    }
});
redraw();
select(activeTab().root);
