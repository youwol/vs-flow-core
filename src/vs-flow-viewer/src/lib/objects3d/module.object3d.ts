import {
    Mesh,
    MeshStandardMaterial,
    SphereBufferGeometry,
    Vector3,
} from 'three'
import { Implementation } from '../../../../lib/modules'
import { SelectableTrait } from './traits'
import { ReplaySubject } from 'rxjs'
import { CSS3DObject } from '../renderers/css-3d-renderer'

export class ModuleObject3d extends Mesh implements SelectableTrait {
    public readonly module: Implementation
    public readonly entitiesPositions: { [k: string]: Vector3 }

    public readonly sphere: Mesh
    public readonly sphereMaterial: MeshStandardMaterial
    public readonly uidSelected$: ReplaySubject<string>

    public selected = false
    constructor(params: {
        module: Implementation
        entitiesPositions: { [k: string]: Vector3 }
        uidSelected$: ReplaySubject<string>
    }) {
        super()
        Object.assign(this, params)
        const position = this.entitiesPositions[this.module.uid]
        const geometry = new SphereBufferGeometry(2, 32, 32)
        this.sphereMaterial = new MeshStandardMaterial({
            color: 0x049ef4,
            roughness: 0.3,
            metalness: 0.3,
            emissive: 0x8f0000,
        })
        this.sphere = new Mesh(geometry, this.sphereMaterial)
        this.sphere.position.set(position.x, position.y, position.z)
        this.sphere.castShadow = true
        const labelDiv = document.createElement('div')
        labelDiv.className = 'label'
        labelDiv.textContent = this.module.configuration.name as string
        labelDiv.style.marginTop = '-1em'
        labelDiv.style.fontSize = '4px'
        const label = new CSS3DObject(labelDiv)
        label.position.set(0, 0, 0)
        this.sphere.add(label)
        label.layers.set(0)
        this.children = [this.sphere]
        this.sphere.userData.selectableTrait = this
        this.sphere.name = `#${this.module.uid}`
        this.uidSelected$.subscribe((uid) => {
            if (uid != this.module.uid) {
                this.selected = false
                this.onRestored()
                return
            }
            this.onSelected()
        })
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
