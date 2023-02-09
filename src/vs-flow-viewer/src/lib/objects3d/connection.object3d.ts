import {
    Object3D,
    Vector3,
    LineBasicMaterial,
    BufferGeometry,
    Line,
    IcosahedronGeometry,
    MeshStandardMaterial,
    ArrowHelper,
    Mesh,
} from 'three'
import { Connection } from '../../../../lib/connections'

export class ConnectionObject3d extends Object3D {
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

        const material = new LineBasicMaterial({
            color: 0x0000ff,
        })

        const geometry = new BufferGeometry().setFromPoints([start, end])
        const line = new Line(geometry, material)
        line.castShadow = true
        const dir = new Vector3().subVectors(end, start).normalize()
        const l = start.distanceTo(end)

        const arrowHelper = new ArrowHelper(
            dir,
            start.clone().add(dir.clone().multiplyScalar(l / 2)),
            1,
            0xffff00,
            2,
            1,
        )
        this.children = this.connection.configuration.adaptor
            ? [line, arrowHelper, new AdaptorObject3D(params)]
            : [line, arrowHelper]
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
