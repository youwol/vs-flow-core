import {
    Object3D,
    Vector3,
    LineBasicMaterial,
    BufferGeometry,
    Line,
    ArrowHelper,
} from 'three'

export class PseudoConnectionObject3d extends Object3D {
    public readonly connection: { start: string; end: string }
    public readonly positions: { [k: string]: Vector3 }

    constructor(params: {
        connection: { start: string; end: string }
        positions: { [k: string]: Vector3 }
    }) {
        super()
        Object.assign(this, params)
        const start = this.positions[this.connection.start]
        const end = this.positions[this.connection.end]

        const material = new LineBasicMaterial({
            color: 0x00ffff,
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
        this.children = [line, arrowHelper]
    }
}
