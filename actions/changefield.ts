import { ed } from '../editor.js'
import { Item } from '../item.js'
import { Action } from './action.js'

export class ChangeFieldAction extends Action {
	public field: string
	public group: string
	public newValue: string | number
	// tslint:disable-next-line:no-any
	public obj: any
	public oldValue: string | number

	// tslint:disable-next-line:no-any
	public constructor(obj: any, group: string, field: string, value: string | number) {
		super()
		this.obj = obj
		this.group = group
		this.field = field
		// tslint:disable-next-line:no-any
		this.oldValue = (this.obj as any)[field]
		this.newValue = value
	}

	public do(): void {
		// tslint:disable-next-line:no-any
		(this.obj as any)[this.field] = this.newValue
		ed.setFieldValue(this.group, this.field, this.obj)
		if (this.obj instanceof Item) {
			ed.select(this.obj as Item)
		}
	}

	public redo(): void {
		this.do()
	}

	public undo(): void {
		// tslint:disable-next-line:no-any
		(this.obj as any)[this.field] = this.oldValue
		ed.setFieldValue(this.group, this.field, this.obj)
		if (this.obj instanceof Item) {
			ed.select(this.obj as Item)
		}
	}
}
