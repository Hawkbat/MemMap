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
    Action.redo = function () {
        if (Action.redos.length > 0) {
            var act = Action.redos.pop();
            act.redo();
            Action.undos.push(act);
            Action.updateCounters();
        }
    };
    Action.undo = function () {
        if (Action.undos.length > 0) {
            var act = Action.undos.pop();
            act.undo();
            Action.redos.push(act);
            Action.updateCounters();
        }
    };
    Action.do = function (act) {
        act.do();
        Action.redos.length = 0;
        Action.undos.push(act);
        Action.updateCounters();
    };
    Action.updateCounters = function () {
        document.getElementById('tool-undo').dataset.count = '' + Action.undos.length;
        document.getElementById('tool-redo').dataset.count = '' + Action.redos.length;
    };
    Action.undos = [];
    Action.redos = [];
    return Action;
}());
var AddAction = /** @class */ (function (_super) {
    __extends(AddAction, _super);
    function AddAction(parent) {
        var _this = _super.call(this) || this;
        _this.parent = (parent == null) ? Item.root : parent;
        return _this;
    }
    AddAction.prototype.do = function () {
        this.item = new Item(1, '', '');
        this.item.name = 'Item ' + this.item.id;
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
        if (subs === void 0) { subs = []; }
        this.size = size;
        this.name = name;
        this.desc = desc;
        this.subs = subs;
        for (var i = 0; i < this.subs.length; i++)
            this.subs[i].parent = this;
        this.id = Item.items.length;
        Item.items.push(this);
    }
    Item.prototype.render = function (start, depth) {
        if (start === void 0) { start = 0; }
        if (depth === void 0) { depth = 0; }
        var out = '';
        out += '<div class="col">';
        out += '<div class="row item" draggable="true" data-id="' + this.id + '">';
        out += '<div class="cell">' + toHex(start) + '-' + toHex(start + this.size - 1) + ':</div>';
        if (this.desc)
            out += '<div class="cell">' + this.name + ' (' + this.desc + ')</div>';
        else
            out += '<div class="cell">' + this.name + '</div>';
        out += '</div>';
        for (var i = 0; i < this.subs.length; i++) {
            out += this.subs[i].render(start, depth + 1);
            start += this.subs[i].size;
        }
        out += '</div>';
        return out;
    };
    Item.items = [];
    return Item;
}());
function toHex(num) {
    var str = num.toString(16).toUpperCase();
    while (str.length < 4 || (str.length % 2) == 1)
        str = "0" + str;
    return '0x' + str;
}
function select(item) {
    setInput('size', item);
    setInput('name', item);
    setInput('desc', item);
    var allEles = document.body.querySelectorAll('.item');
    for (var i = 0; i < allEles.length; i++)
        allEles[i].classList.remove('selected');
    if (item) {
        var selEle = container.querySelector('.item[data-id="' + item.id + '"]');
        if (selEle)
            selEle.classList.add('selected');
    }
}
function getSelected() {
    var selEle = container.querySelector('.item.selected');
    if (selEle) {
        return Item.items[parseInt(selEle.dataset.id)];
    }
    return null;
}
function bindInput(field) {
    var input = document.body.querySelector('input[name="' + field + '"], textarea[name="' + field + '"]');
    input.disabled = true;
    input.addEventListener('change', function (e) {
        var item = getSelected();
        if (item)
            Action.do(new ChangeFieldAction(item, field, (input.type == 'number') ? parseInt(input.value) : input.value));
    });
}
function setInput(field, item) {
    var input = document.body.querySelector('input[name="' + field + '"], textarea[name="' + field + '"]');
    input.disabled = !item;
    if (item)
        input.value = item[field];
    else
        input.value = "";
}
function getItemEle(ele) {
    while (ele && !ele.classList.contains('item'))
        ele = ele.parentElement;
    return ele;
}
function bindTool(name, action) {
    var tool = document.body.querySelector('#tool-' + name);
    tool.addEventListener('click', function (e) {
        action(getSelected());
    });
}
function redraw() {
    container.innerHTML = Item.root.render();
}
Item.root = new Item(0x10000, "Memory Map", "");
var container = document.getElementById('container');
container.addEventListener('click', function (e) {
    var ele = getItemEle(e.target);
    var item = null;
    if (ele)
        item = Item.items[parseInt(ele.dataset.id)];
    select(item);
});
container.addEventListener('dragstart', function (e) {
    var ele = getItemEle(e.target);
    if (ele) {
        var item = Item.items[parseInt(ele.dataset.id)];
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
        var item = Item.items[parseInt(e.dataTransfer.getData('text/plain'))];
        var parent_1 = Item.items[parseInt(ele.dataset.id)];
        if (item != parent_1)
            Action.do(new MoveAction(item, parent_1));
    }
});
bindInput('name');
bindInput('desc');
bindInput('size');
bindTool('undo', function (item) { return Action.undo(); });
bindTool('redo', function (item) { return Action.redo(); });
bindTool('add', function (item) { return Action.do(new AddAction(item)); });
bindTool('rem', function (item) {
    if (item && item.parent)
        Action.do(new RemoveAction(item));
});
bindTool('up', function (item) {
    if (item && item.parent) {
        var index = item.parent.subs.indexOf(item);
        if (index > 0)
            Action.do(new MoveUpAction(item));
    }
});
bindTool('down', function (item) {
    if (item && item.parent) {
        var index = item.parent.subs.indexOf(item);
        if (index < item.parent.subs.length - 1)
            Action.do(new MoveDownAction(item));
    }
});
redraw();
select(Item.root);
