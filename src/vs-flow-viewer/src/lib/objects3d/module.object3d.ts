import {
    Mesh,
    MeshStandardMaterial,
    SphereBufferGeometry,
    Vector3,
} from 'three'
import { Implementation } from '../../../../lib/modules'
import { CSS2DObject } from '../renderers/css-2d-renderer'
import { SelectableTrait } from './traits'
import { ReplaySubject } from 'rxjs'

export class ModuleObject3d extends Mesh implements SelectableTrait {
    public readonly module: Implementation
    public readonly positions: { [k: string]: Vector3 }

    public readonly sphere: Mesh
    public readonly sphereMaterial: MeshStandardMaterial
    public readonly uidSelected$: ReplaySubject<string>

    public selected = false
    constructor(params: {
        module: Implementation
        positions: { [k: string]: Vector3 }
        uidSelected$: ReplaySubject<string>
    }) {
        super()
        Object.assign(this, params)
        this.uidSelected$.subscribe((uid) => {
            if (uid != this.module.uid) {
                this.selected = false
                this.onRestored()
                return
            }
            this.onSelected()
        })
        Object.assign(this, params)
        const position = this.positions[this.module.uid]
        const geometry = new SphereBufferGeometry(2, 32, 32)
        this.sphereMaterial = new MeshStandardMaterial({
            color: 0x049ef4,
            roughness: 0.3,
            metalness: 0.3,
            emissive: 0x8f0000,
        })
        this.sphere = new Mesh(geometry, this.sphereMaterial)
        this.sphere.position.set(position.x, position.y, 0)
        this.sphere.castShadow = true
        const labelDiv = document.createElement('div')
        labelDiv.className = 'label'
        labelDiv.textContent = this.module.configuration.name as string
        labelDiv.style.marginTop = '-1em'
        const label = new CSS2DObject(labelDiv)
        label.position.set(0, 1, 0)
        this.sphere.add(label)
        label.layers.set(0)
        this.children = [this.sphere]
        this.sphere.userData.selectableTrait = this
    }

    getEntity(): Implementation {
        return this.module
    }

    getSelectables() {
        return [this.sphere]
    }

    onHovered() {
        document.body.style.cursor = 'pointer'
        this.sphereMaterial.emissive.set(0x008f00)
    }
    onRestored() {
        if (this.selected) {
            return
        }
        document.body.style.cursor = 'default'
        this.sphereMaterial.emissive.set(0x8f0000)
    }
    onSelected() {
        this.selected = true
        document.body.style.cursor = 'default'
        this.sphereMaterial.emissive.set(0x00008f)
    }
}
