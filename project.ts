import Tab from "./tab"
import { DigitType } from "./enums"
import ed from "./editor"

export default class Project {
    tabs: Tab[] = []
    name: string = 'New Project'
    digitType: DigitType = DigitType.Hexadecimal
    pad: number = 4

    dirty: boolean = false

    constructor() {
        this.setDirty()
    }

    setDirty(val: boolean = true) {
        this.dirty = val
        if (val)
            document.title = this.name + "* | Memory Mapper"
        else
            document.title = this.name + " | Memory Mapper"
    }

    static deserialize(conf: any): Project {
        let p = new Project()
        p.name = conf.name
        p.digitType = conf.digitType
        p.pad = conf.pad
        p.tabs = conf.tabs.map((t: any) => Tab.deserialize(t))
        return p
    }

    serialize() {
        return { name: this.name, digitType: this.digitType, pad: this.pad, tabs: this.tabs.map(tab => tab.serialize()) }
    }

    static open() {
        let n = document.createElement('input')
        n.setAttribute('type', 'file')
        n.setAttribute('accept', '.memmap.json')
        n.addEventListener('change', e => {
            if (n.files.length > 0) {
                let r = new FileReader()
                r.addEventListener('load', ev => {
                    ed.project = Project.deserialize(JSON.parse(r.result))
                    ed.redraw()
                    ed.updateProjectFields()
                    ed.project.setDirty(false)
                })
                r.readAsText(n.files[0], 'utf-8')
            }
        })
        n.click()
    }

    save() {
        let out = JSON.stringify(this.serialize())
        let a = document.createElement('a')
        a.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(out))
        a.setAttribute('download', this.name + '.memmap.json')
        a.click()
        this.setDirty(false)
    }
}