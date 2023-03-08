import { Scene, PerspectiveCamera, Group, Box3, Mesh, Vector3 } from 'three'

import * as TrackballControls from 'three-trackballcontrols'

export function getChildrenGeometries(children) {
    const geometries = children
        .filter((child) => child instanceof Group || child['geometry'])
        .map((child) => {
            if (child instanceof Group) {
                return getChildrenGeometries(child.children).reduce(
                    (acc, e) => acc.concat(e),
                    [child],
                )
            }
            return [child]
        })
    return geometries.reduce((acc, e) => acc.concat(e), [])
}

export function getSceneBoundingBox(scene) {
    const selection = getChildrenGeometries(scene.children)
    const box = new Box3()

    selection.forEach((mesh) => {
        box.expandByObject(mesh)
    })

    return box
}

export function getBoundingBox(selection: Mesh[]) {
    const box = new Box3()

    selection.forEach((mesh) => {
        box.expandByObject(mesh)
    })

    return box
}

export function fitSceneToContent(
    scene: Scene,
    camera: PerspectiveCamera,
    controls: TrackballControls,
) {
    const bbox = getSceneBoundingBox(scene)
    const size = bbox.getSize(new Vector3())
    const center = bbox.getCenter(new Vector3())

    if (size.length() == 0) {
        return
    }

    const fitRatio = 1.2
    const pcamera = camera

    const maxSize = Math.max(size.x, size.y, size.z)
    const fitHeightDistance =
        maxSize / (2 * Math.atan((Math.PI * pcamera.fov) / 360))
    const fitWidthDistance = fitHeightDistance / pcamera.aspect
    const distance = fitRatio * Math.max(fitHeightDistance, fitWidthDistance)

    const direction = controls.target
        .clone()
        .sub(camera.position)
        .normalize()
        .multiplyScalar(distance)

    controls.maxDistance = distance * 10
    controls.target.copy(center)
    pcamera.near = distance / 100
    pcamera.far = distance * 100
    pcamera.updateProjectionMatrix()
    camera.position.copy(controls.target).sub(direction)

    controls.update()
}
