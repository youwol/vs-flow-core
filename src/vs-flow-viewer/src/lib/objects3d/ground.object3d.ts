import { GridHelper, Mesh, PlaneGeometry, ShadowMaterial, Vector3 } from 'three'
import { getBoundingBox } from '../utils'
import { SelectableObject3D } from '../environment3d'

export class GroundObject3d extends Mesh {
    public readonly name = 'ground'
    public readonly selectables: Mesh[]

    constructor(params: { selectables: SelectableObject3D[] }) {
        super()
        Object.assign(this, params)
        if (this.selectables.length == 0) {
            this.children = [new GridHelper(10, 10)]
            return
        }
        const bbox = getBoundingBox(this.selectables)
        const size = new Vector3()
        bbox.getSize(size)
        const maxSize = 1.25 * Math.max(size.x, size.y, size.z)

        const center = new Vector3()
        bbox.getCenter(center)

        const divisions = 100
        const helper = new GridHelper(maxSize, divisions)

        helper.material['opacity'] = 0.25
        helper.material['transparent'] = true

        const planeGeometry = new PlaneGeometry(maxSize, maxSize)
        planeGeometry.rotateX(-Math.PI / 2)
        const planeMaterial = new ShadowMaterial({
            color: 0x000000,
            opacity: 0.2,
        })
        const plane = new Mesh(planeGeometry, planeMaterial)
        plane.receiveShadow = true
        plane.position.set(center.x, bbox.min.y - 0.2 * size.y, center.z)
        helper.position.set(center.x, bbox.min.y - 0.2 * size.y, center.z)

        this.children = [plane, helper]
    }
}
