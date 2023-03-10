import {
    Group,
    Vector3,
    LineBasicMaterial,
    BufferGeometry,
    Line,
    IcosahedronGeometry,
    MeshStandardMaterial,
    ArrowHelper,
    Mesh,
    Color,
} from 'three'
import { Connection } from '../../../../lib/connections'
import { SelectableTrait, Selector } from './traits'
import { ReplaySubject } from 'rxjs'

export class ConnectionObject3d
    extends Group
    implements SelectableTrait<Connection>
{
    public readonly connection: Connection
    public readonly positions: { [k: string]: Vector3 }
    public readonly line: Line
    public readonly lineMaterial: LineBasicMaterial

    public readonly selector: Selector<Connection>

    constructor(params: {
        connection: Connection
        positions: { [k: string]: Vector3 }
        color?: Color
        uidSelected$: ReplaySubject<string>
    }) {
        super()
        Object.assign(this, params)
        this.name = this.connection.uid
        const start = this.positions[this.connection.start.moduleId]
        const end = this.positions[this.connection.end.moduleId]
        const l = start.distanceTo(end)
        const dir = new Vector3().subVectors(end, start).normalize()
        const center = start.clone().add(dir.clone().multiplyScalar(l / 2))
        this.position.set(center.x, center.y, center.z)

        this.lineMaterial = new LineBasicMaterial({
            color: params.color || 0x0000ff,
            linewidth: 1,
        })
        this.connection.status$.subscribe((status) => {
            this.lineMaterial.color = status.connected
                ? new Color(0x0000ff)
                : new Color(0xff0000)
        })
        const geometry = new BufferGeometry().setFromPoints([start, end])
        this.line = new Line(geometry, this.lineMaterial)

        const arrowHelper = new ArrowHelper(
            dir,
            start.clone().add(dir.clone().multiplyScalar(l / 2)),
            1,
            0xffff00,
            2,
            1,
        )
        this.children = this.connection.configurationInstance.adaptor
            ? [this.line, arrowHelper, new AdaptorObject3D(params)]
            : [this.line, arrowHelper]

        this.selector = new Selector<Connection>({
            entity: this.connection,
            selectables: [this.line],
            onHovered: () => (this.lineMaterial.linewidth = 2),
            onSelected: () => (this.lineMaterial.linewidth = 4),
            onRestored: () => (this.lineMaterial.linewidth = 1),
            uidSelected$: params.uidSelected$,
        })
    }
}

export class AdaptorObject3D extends Mesh {
    public readonly connection: Connection
    public readonly positions: { [k: string]: Vector3 }

    constructor(params: {
        connection: Connection
        positions: { [k: string]: Vector3 }
    }) {
        super()
        Object.assign(this, params)
        const start = this.positions[this.connection.start.moduleId]
        const end = this.positions[this.connection.end.moduleId]

        const dir = new Vector3().subVectors(end, start).normalize()

        this.geometry = new IcosahedronGeometry(0.7)
        this.material = new MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffcc00,
            roughness: 0.3,
            metalness: 0.3,
        })
        const pos = end.clone().add(dir.clone().multiplyScalar(-2))
        this.position.set(pos.x, pos.y, pos.z)
        this.castShadow = true
    }
}
