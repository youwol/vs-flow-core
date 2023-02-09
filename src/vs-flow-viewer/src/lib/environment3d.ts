import {
    GridHelper,
    Light,
    Mesh,
    Object3D,
    PerspectiveCamera,
    PlaneGeometry,
    Raycaster,
    Scene,
    ShadowMaterial,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three'
import { SelectableTrait } from './objects3d/traits'
import { ProjectState } from '../../../lib/project'
import { CSS2DRenderer } from './renderers/css-2d-renderer'
import * as THREE from 'three'
import { ModuleObject3d } from './objects3d/module.object3d'
import { ConnectionObject3d } from './objects3d/connection.object3d'
import { fitSceneToContent, getBoundingBox } from './utils'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { ReplaySubject } from 'rxjs'
import { Implementation } from '../../../lib/modules'

export type SelectableMesh = Mesh & {
    userData: { selectableTrait: SelectableTrait }
}

export class Environment3D {
    public readonly project: ProjectState
    public readonly positions: { [_k: string]: Vector3 }

    public readonly htmlElementContainer: HTMLDivElement

    public readonly rayCaster = new Raycaster()
    public readonly scene = new Scene()
    public readonly pointer = new Vector2()
    public readonly renderer = new WebGLRenderer({ antialias: true })
    public readonly labelRenderer = new CSS2DRenderer()

    public readonly camera: PerspectiveCamera
    public readonly controls: TrackballControls

    public readonly selectables: SelectableMesh[]

    public hovered: SelectableMesh
    public readonly moduleSelected$: ReplaySubject<Implementation>
    constructor(params: {
        htmlElementContainer: HTMLDivElement
        project: ProjectState
        positions: { [_k: string]: Vector3 }
        moduleSelected$: ReplaySubject<Implementation>
    }) {
        Object.assign(this, params)

        this.renderer.shadowMap.enabled = true
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(
            this.htmlElementContainer.clientWidth,
            this.htmlElementContainer.clientHeight,
        )
        this.htmlElementContainer.appendChild(this.renderer.domElement)

        this.labelRenderer.domElement.style.position = 'absolute'
        this.labelRenderer.domElement.style.top = '0px'
        this.labelRenderer.domElement.classList.add('h-100', 'w-100')
        this.labelRenderer.setSize(
            this.htmlElementContainer.clientWidth,
            this.htmlElementContainer.clientHeight,
        )
        this.htmlElementContainer.appendChild(this.labelRenderer.domElement)

        this.camera = new PerspectiveCamera(
            27,
            this.htmlElementContainer.clientWidth /
                this.htmlElementContainer.clientHeight,
            1,
            3500,
        )
        this.camera.position.z = 2750

        this.controls = new TrackballControls(
            this.camera,
            this.htmlElementContainer,
        )

        this.scene.background = new THREE.Color(0xaaaaaa)
        this.scene.fog = new THREE.Fog(0x050505, 2000, 3500)

        this.htmlElementContainer.onpointermove = (event) => {
            const target = event.target as HTMLDivElement
            this.pointer.x = (event.offsetX / target.clientWidth) * 2 - 1
            this.pointer.y = -(event.offsetY / target.clientHeight) * 2 + 1
        }
        this.htmlElementContainer.onclick = () => {
            if (this.hovered) {
                this.moduleSelected$.next(
                    this.hovered.userData.selectableTrait.getEntity(),
                )
            } else {
                this.moduleSelected$.next(undefined)
            }
        }

        const modules = this.project.main.modules.map(
            (module) =>
                new ModuleObject3d({
                    module,
                    positions: this.positions,
                    moduleSelected$: params.moduleSelected$,
                }),
        )
        const connections = this.project.main.connections.map(
            (connection) =>
                new ConnectionObject3d({
                    connection,
                    positions: this.positions,
                }),
        )
        const lights = this.createLights(modules)

        const ground = this.createGround(modules)

        modules.forEach((mesh) => this.scene.add(mesh))

        connections.forEach((mesh) => this.scene.add(mesh))

        lights.forEach((light) => {
            this.scene.add(light)
        })
        ground.forEach((obj) => this.scene.add(obj))

        this.selectables = modules
            .map((m) => m.children)
            .flat() as SelectableMesh[]

        setTimeout(() => {
            const observer = new window['ResizeObserver'](() => {
                this.renderer.setSize(
                    this.htmlElementContainer.clientWidth,
                    this.htmlElementContainer.clientHeight,
                )

                this.labelRenderer.setSize(
                    this.htmlElementContainer.clientWidth,
                    this.htmlElementContainer.clientHeight,
                )
                this.camera.aspect =
                    this.htmlElementContainer.clientWidth /
                    this.htmlElementContainer.clientHeight
                this.camera.updateProjectionMatrix()
            })
            observer.observe(this.htmlElementContainer)
            fitSceneToContent(this.scene, this.camera, this.controls)
        })
    }

    private createLights(meshes: Object3D[]): Light[] {
        return meshes
            .map((mesh) => {
                const light = new THREE.DirectionalLight(0xffffff, 1)
                light.position.set(
                    mesh.position.x,
                    mesh.position.y + 1,
                    mesh.position.z,
                )
                light.target = mesh
                light.castShadow = true
                return light
            })
            .flat()
    }

    private createGround(meshes: Mesh[]): Object3D[] {
        if (meshes.length == 0) {
            return [new GridHelper(10, 10)]
        }
        const bbox = getBoundingBox(meshes)
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
        plane.position.set(center.x, bbox.min.y - 0.2 * size.y, 0)
        helper.position.set(center.x, bbox.min.y - 0.2 * size.y, 0)

        return [plane, helper]
    }
}
