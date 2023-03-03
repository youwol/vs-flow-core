import {
    Mesh,
    MeshStandardMaterial,
    SphereBufferGeometry,
    Vector3,
} from 'three'
import { Implementation } from '../../../../lib/modules'
import { SelectableTrait, Selector } from './traits'
import { ReplaySubject } from 'rxjs'
import { CSS3DObject } from '../renderers/css-3d-renderer'
import { render } from '@youwol/flux-view'

export class ModuleObject3d
    extends Mesh
    implements SelectableTrait<Implementation>
{
    public readonly module: Implementation
    public readonly entitiesPositions: { [k: string]: Vector3 }

    public readonly sphere: Mesh
    public readonly sphereMaterial: MeshStandardMaterial
    public readonly uidSelected$: ReplaySubject<string>
    public readonly selector: Selector<Implementation>

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
        this.sphere.name = `#${this.module.uid}`

        this.selector = new Selector<Implementation>({
            entity: this.module,
            selectables: [this.sphere],
            onHovered: () => this.sphereMaterial.emissive.set(0x008f00),
            onSelected: () => this.sphereMaterial.emissive.set(0x00008f),
            onRestored: () => this.sphereMaterial.emissive.set(0x8f0000),
            uidSelected$: this.uidSelected$,
        })
    }
}
