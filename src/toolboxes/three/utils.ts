import {
    Box3,
    BufferGeometry,
    Group,
    Object3D,
    PerspectiveCamera,
    Mesh,
    Scene,
    Vector3,
    WebGLRenderer,
} from 'three'
import { TrackballControls } from '../../vs-flow-viewer/src/lib/controls/trackball.controls'

export function initializeRenderer({
    renderingDiv,
    scene,
    camera,
    controls,
    registeredRenderLoopActions,
    viewerInstance,
    fit,
}: {
    renderingDiv: HTMLDivElement
    scene: Scene
    camera?: PerspectiveCamera
    controls?: TrackballControls
    registeredRenderLoopActions?: {
        [_key: string]: { action: (Module) => void; instance: unknown }
    }
    viewerInstance?: unknown
    fit?: boolean
}) {
    if (!registeredRenderLoopActions) {
        registeredRenderLoopActions = {}
    }
    if (fit == undefined) {
        fit = false
    }

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2', { alpha: false })
    const renderer = new WebGLRenderer({ canvas, context, antialias: true })
    renderer.setSize(renderingDiv.clientWidth, renderingDiv.clientHeight)

    if (renderingDiv.children.length == 0) {
        renderingDiv.appendChild(renderer.domElement)
    }
    const animate = () => {
        requestAnimationFrame(animate)
        Object.values(registeredRenderLoopActions).forEach(
            ({ action, instance }) => action.bind(instance)(viewerInstance),
        )
        controls.update()
        renderer.render(scene, camera)
    }
    animate()
    if (fit) {
        fitSceneToContent(scene, camera, controls)
    }
    return renderer
}

export function getChildrenGeometries(children) {
    const geometries = children
        .filter((child) => child instanceof Group || child['geometry'])
        .map((child) => {
            if (child instanceof Group) {
                return getChildrenGeometries(child.children).reduce(
                    (acc, e) => acc.concat(e),
                    [],
                )
            }
            return [child]
        })
    return geometries.reduce((acc, e) => acc.concat(e), [])
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

export function getSceneBoundingBox(scene) {
    const selection = getChildrenGeometries(scene.children)
    const box = new Box3()

    selection.forEach((mesh) => {
        box.expandByObject(mesh)
    })

    return box
}

export function fitSceneToContentIfNeeded(
    fromBBox: Box3,
    scene: Scene,
    camera: PerspectiveCamera,
    controls: TrackballControls,
) {
    if (!scene || !camera || !controls) {
        return
    }
    const toBBox = getSceneBoundingBox(scene)
    let size = fromBBox.getSize(new Vector3())
    const fromSize = Math.max(size.x, size.y, size.z)
    size = toBBox.getSize(new Vector3())
    const toSize = Math.max(size.x, size.y, size.z)

    if (fromSize == 0 && toSize > 0) {
        fitSceneToContent(scene, camera, controls)
    }

    const minTranslation = fromBBox.min.distanceTo(toBBox.min) / fromSize
    const maxTranslation = fromBBox.max.distanceTo(toBBox.max) / fromSize
    const hasChanged = minTranslation > 0.1 || maxTranslation > 0.1

    if (hasChanged && controls) {
        fitSceneToContent(scene, camera, controls)
    }
}
type Transform = {
    x: number
    y: number
    z: number
}
type AllTransform = {
    rotation: Transform
    translation: Transform
    scaling: Transform
}
export function applyTransformation(object: Object3D, transform: AllTransform) {
    const scale = transform.scaling
    const rotation = transform.rotation
    const translation = transform.translation

    const applyOnGeom = (geometry: BufferGeometry) => {
        geometry.scale(scale.x, scale.y, scale.z)
        geometry.rotateX((rotation.x / 180) * Math.PI)
        geometry.rotateY((rotation.y / 180) * Math.PI)
        geometry.rotateZ((rotation.z / 180) * Math.PI)
        geometry.translate(translation.x, translation.y, translation.z)
    }
    if (object instanceof Group) {
        const objects = getChildrenGeometries(object.children)
        objects.forEach((obj) => {
            applyOnGeom(obj.geometry)
        })
    }
    if (object instanceof Mesh) {
        applyOnGeom(object.geometry)
    }

    return object
}
