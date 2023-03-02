import {
    BoxHelper,
    Color,
    Group,
    Mesh,
    MeshStandardMaterial,
    SphereBufferGeometry,
    Vector3,
} from 'three'
import { Implementation } from '../../../../lib/modules'
import { SelectableTrait } from './traits'
import { ReplaySubject } from 'rxjs'
import { Layer } from '../../../../lib/workflows'
import { ProjectState } from '../../../../lib/project'
import { computeCoordinates } from '../dag'
import {
    Dynamic3dContent,
    Environment3D,
    LayerOrganizer,
} from '../environment3d'
import { ConnectionObject3d } from './connection.object3d'
import { CSS3DObject } from '../renderers/css-3d-renderer'

export class GroupObject3d extends Mesh implements SelectableTrait {
    public readonly environment3d: Environment3D
    public readonly group: Layer
    public readonly project: ProjectState
    public readonly entitiesPositions: { [_k: string]: Vector3 }

    public readonly sphere: Mesh
    public readonly sphereMaterial: MeshStandardMaterial
    public readonly uidSelected$: ReplaySubject<string>

    public selected = false
    public readonly groupSubWf3d = new Group()
    constructor(params: {
        project: ProjectState
        group: Layer
        entitiesPositions: { [_k: string]: Vector3 }
        uidSelected$: ReplaySubject<string>
        environment3d: Environment3D
    }) {
        super()
        Object.assign(this, params)
        Object.assign(this, params)
        const position = this.entitiesPositions[this.group.uid]
        const geometry = new SphereBufferGeometry(4, 32, 32)
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
        labelDiv.textContent = this.group.uid
        labelDiv.style.marginTop = '-1em'
        labelDiv.style.fontSize = '8px'
        const label = new CSS3DObject(labelDiv)
        label.position.set(0, 1, 0)
        this.sphere.add(label)
        label.layers.set(0)
        this.children = [this.sphere, this.groupSubWf3d]

        this.sphere.userData.selectableTrait = this
        this.uidSelected$.subscribe((uid) => {
            if (uid != this.group.uid) {
                this.selected = false
                this.onRestored()
                return
            }
            this.onSelected()
        })
    }

    getEntity(): Implementation {
        return this.group as any
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
        if (this.groupSubWf3d.children.length > 0) {
            return
        }
        const layerOrganizer = new LayerOrganizer({
            project: this.project,
            layerId: this.group.uid,
        })
        const dagData = layerOrganizer.dagData()
        const entitiesPosition = computeCoordinates(dagData, -100)
        const dynamicContent3d = new Dynamic3dContent({
            project: this.project,
            uidSelected$: this.uidSelected$,
            layerOrganizer,
            entitiesPosition: entitiesPosition,
            environment3d: this.environment3d,
        })
        dynamicContent3d.addToScene(this.groupSubWf3d)
        this.groupSubWf3d.add(new BoxHelper(this.groupSubWf3d, 0xffff00))
        this.groupSubWf3d.add(new BoxHelper(this.sphere, 0xffff00))
        // add connection crossing the groups
        this.project.main.connections
            .filter((c) => {
                return (
                    (entitiesPosition[c.start.moduleId] &&
                        this.entitiesPositions[c.end.moduleId]) ||
                    (entitiesPosition[c.end.moduleId] &&
                        this.entitiesPositions[c.start.moduleId])
                )
            })
            .map(
                (c) =>
                    new ConnectionObject3d({
                        connection: c,
                        positions: {
                            ...entitiesPosition,
                            ...this.entitiesPositions,
                        },
                        color: new Color().set(0x00ffff),
                    }),
            )
            .forEach((c) => {
                this.groupSubWf3d.add(c)
            })
        document.body.style.cursor = 'default'
        this.environment3d.addSelectables(dynamicContent3d)

        this.sphereMaterial.emissive.set(0x00008f)
    }
}
