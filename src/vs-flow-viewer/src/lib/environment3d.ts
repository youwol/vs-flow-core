import {
    Light,
    Object3D,
    PerspectiveCamera,
    Raycaster,
    Scene,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three'
import { Selector } from './objects3d/traits'
import { ProjectState } from '../../../lib/project'
import { CSS2DRenderer } from './renderers/css-2d-renderer'
import * as THREE from 'three'
import { ModuleObject3d } from './objects3d/module.object3d'
import { fitSceneToContent } from './utils'
import { Observable, ReplaySubject } from 'rxjs'
import { Implementation } from '../../../lib/modules'
import { ConnectionObject3d } from './objects3d/connection.object3d'
import { GroupObject3d } from './objects3d/group.object3d'
import { Layer } from '../../../lib/workflows'
import { PseudoConnectionObject3d } from './objects3d/pseudo-connection.object3d'
import { Connection } from '../../../lib/connections'
import { computeCoordinates } from './dag'
import { GroundObject3d } from './objects3d/ground.object3d'
import { VirtualDOM, render } from '@youwol/flux-view'
import { CSS3DObject, CSS3DRenderer } from './renderers/css-3d-renderer'
import { TrackballControls } from './controls/trackball.controls'
import { UidTrait } from '../../../lib/modules/traits'

export type SelectableObject3D = Object3D & {
    userData: { selector: Selector<UidTrait> }
}

class InterLayersConnection {
    connection: {
        start: string
        end: string
    }
    constructor(params: {
        connection: {
            start: string
            end: string
        }
    }) {
        Object.assign(this, params)
    }
}
class IntraLayerConnection {
    connection: Connection
    constructor(params: { connection: Connection }) {
        Object.assign(this, params)
    }
}

type CustomElement<TObject> = {
    id: string
    parentId: string
    object: (projectState: ProjectState) => TObject
    wrapper: (obj: Object3D) => void
}
export class Dynamic3dContent {
    static customElements: { [k: string]: CustomElement<VirtualDOM> } = {}
    public readonly environment3d: Environment3D
    public readonly project: ProjectState
    public readonly entitiesPosition: { [k: string]: Vector3 }
    public readonly layerOrganizer: LayerOrganizer
    public readonly modules: ModuleObject3d[]
    public readonly groups: GroupObject3d[]
    public readonly intraConnection: ConnectionObject3d[]
    public readonly interConnection: PseudoConnectionObject3d[]

    public lights: Object3D[]
    public ground: Object3D[]

    constructor(params: {
        project: ProjectState
        uidSelected$: ReplaySubject<string>
        layerOrganizer: LayerOrganizer
        entitiesPosition: { [k: string]: Vector3 }
        environment3d: Environment3D
    }) {
        Object.assign(this, params)
        this.modules = this.layerOrganizer.modules.map((module) => {
            return new ModuleObject3d({
                module: module,
                entitiesPositions: this.entitiesPosition,
                uidSelected$: params.uidSelected$,
            })
        })
        this.groups = this.layerOrganizer.groups.map((group) => {
            return new GroupObject3d({
                project: this.project,
                environment3d: this.environment3d,
                group: group,
                entitiesPositions: this.entitiesPosition,
                uidSelected$: params.uidSelected$,
            })
        })
        this.intraConnection = this.layerOrganizer.intraConnections.map((c) => {
            return new ConnectionObject3d({
                connection: c.connection,
                positions: this.entitiesPosition,
                uidSelected$: params.uidSelected$,
            })
        })
        this.interConnection = this.layerOrganizer.interConnections.map((c) => {
            return new PseudoConnectionObject3d({
                connection: c.connection,
                positions: this.entitiesPosition,
            })
        })

        this.lights = this.createLights([...this.modules, ...this.groups])
        //this.ground = this.createGround([...this.modules, ...this.groups])
    }

    addToScene(container: Scene | Object3D) {
        const allElements = [
            this.lights,
            this.ground,
            this.modules,
            this.groups,
            this.intraConnection,
            this.interConnection,
        ]
            .flat()
            .filter((obj) => obj != undefined)

        allElements.forEach((mesh: Object3D) => {
            container.add(mesh)
            const customElements = Object.values(
                Dynamic3dContent.customElements,
            )
                .map((elem) => ({
                    ...elem,
                    parent: container.getObjectByName(elem.parentId),
                }))
                .filter((elem) => elem.parent != undefined)
            customElements.forEach(({ parent, object, wrapper }) => {
                const view = object(this.project)
                const object3D =
                    view instanceof Object3D
                        ? view
                        : new CSS3DObject(
                              render(view) as unknown as HTMLDivElement,
                          )

                wrapper(object3D)
                parent.add(object3D)
            })
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
}

export class LayerOrganizer {
    public readonly project: ProjectState
    public readonly layerId: string
    public readonly intraConnections: IntraLayerConnection[]
    public readonly interConnections: InterLayersConnection[]
    public readonly layersChildren: { [_key: string]: string[] }
    public readonly modules: Implementation[]
    public readonly groups: Layer[]
    public readonly moduleIds: string[]
    public readonly allChildrenModuleIds: string[]
    public readonly groupIds: string[]
    public readonly entitiesId: string[]

    constructor(params: { project: ProjectState; layerId: string }) {
        Object.assign(this, params)
        const layer = this.project.main.rootLayer.filter(
            (l) => l.uid == this.layerId,
        )[0]
        this.moduleIds = layer.moduleIds
        this.modules = this.moduleIds.map((uid) => {
            return this.project.main.modules.find((m) => m.uid == uid)
        })
        this.groups = layer.children
        this.groupIds = this.groups.map((l) => l.uid)
        this.entitiesId = [...this.moduleIds, ...this.groupIds]

        this.intraConnections = this.project.main.connections
            .filter(
                (connection) =>
                    this.moduleIds.includes(connection.start.moduleId) &&
                    this.moduleIds.includes(connection.end.moduleId),
            )
            .map((connection) => new IntraLayerConnection({ connection }))

        this.layersChildren = layer.children.reduce((acc, l) => {
            const moduleIds = l.reduce((acc, e) => [...acc, ...e.moduleIds], [])
            return { ...acc, [l.uid]: moduleIds }
        }, {})
        this.allChildrenModuleIds = Object.values(this.layersChildren).flat()

        const findParent = (id): string => {
            return layer.moduleIds.includes(id)
                ? id
                : Object.entries(this.layersChildren).find(
                      ([_uid, moduleIds]) => {
                          return moduleIds.includes(id)
                      },
                  )[0]
        }

        this.interConnections = this.project.main.connections
            .filter(
                (connection) =>
                    (this.moduleIds.includes(connection.start.moduleId) &&
                        this.allChildrenModuleIds.includes(
                            connection.end.moduleId,
                        )) ||
                    (this.moduleIds.includes(connection.end.moduleId) &&
                        this.allChildrenModuleIds.includes(
                            connection.start.moduleId,
                        )),
            )
            .map((connection) => {
                return new InterLayersConnection({
                    connection: {
                        start: findParent(connection.start.moduleId),
                        end: findParent(connection.end.moduleId),
                    },
                })
            })
    }

    dagData() {
        return this.entitiesId.map((uid) => {
            const intraConnections = this.intraConnections
                .filter((c) => c.connection.end.moduleId == uid)
                .map((c) => c.connection.start.moduleId)
            const interConnections = this.interConnections
                .filter((c) => c.connection.end == uid)
                .map((c) => c.connection.start)

            return {
                id: uid,
                parentIds: [...intraConnections, ...interConnections],
            }
        })
    }
}

export class Environment3D {
    public readonly project: ProjectState
    public readonly layerId: string
    public readonly entitiesPosition: { [_k: string]: Vector3 }
    public readonly layerOrganizer: LayerOrganizer
    public readonly htmlElementContainer: HTMLDivElement

    public readonly rayCaster = new Raycaster()
    public readonly scene = new Scene()
    public readonly pointer = new Vector2()
    public readonly renderer = new WebGLRenderer({ antialias: true })
    public readonly htmlRendered2D = new CSS2DRenderer()
    public readonly htmlRendered3D = new CSS3DRenderer()

    public readonly camera: PerspectiveCamera
    public readonly controls //: typeof(TrackballControls)

    public selectables: SelectableObject3D[] = []
    public ground: GroundObject3d
    public hovered: SelectableObject3D
    public readonly uidSelected$: ReplaySubject<string>

    public readonly controls$: Observable<{ controls; camera }>
    constructor(params: {
        htmlElementContainer: HTMLDivElement
        layerId: string
        project: ProjectState
        uidSelected$: ReplaySubject<string>
    }) {
        Object.assign(this, params)
        this.layerOrganizer = new LayerOrganizer({
            project: this.project,
            layerId: this.layerId,
        })
        const organizer = new LayerOrganizer({
            project: this.project,
            layerId: this.project.main.rootLayer.uid,
        })
        const dagData = organizer.dagData()
        this.entitiesPosition = computeCoordinates(dagData)
        this.scene.background = new THREE.Color(0xaaaaaa)
        this.scene.fog = new THREE.Fog(0x050505, 2000, 3500)
        const dynamicContent3d = new Dynamic3dContent({
            project: this.project,
            uidSelected$: this.uidSelected$,
            layerOrganizer: this.layerOrganizer,
            entitiesPosition: this.entitiesPosition,
            environment3d: this,
        })
        dynamicContent3d.addToScene(this.scene)

        const { clientWidth, clientHeight } = this.htmlElementContainer
        this.addSelectables(dynamicContent3d)

        this.renderer.shadowMap.enabled = true
        this.renderer.setPixelRatio(window.devicePixelRatio)

        this.htmlRendered2D.domElement.style.position = 'absolute'
        this.htmlRendered2D.domElement.style.top = '0px'
        this.htmlRendered2D.domElement.classList.add('h-100', 'w-100')

        this.htmlRendered3D.domElement.style.position = 'absolute'
        this.htmlRendered3D.domElement.style.top = '0px'
        this.htmlRendered3D.domElement.classList.add('h-100', 'w-100')

        this.renderer.setSize(clientWidth, clientHeight)
        this.htmlElementContainer.appendChild(this.renderer.domElement)
        this.htmlRendered2D.setSize(clientWidth, clientHeight)
        this.htmlRendered3D.setSize(clientWidth, clientHeight)
        this.htmlElementContainer.appendChild(this.htmlRendered2D.domElement)
        this.htmlElementContainer.appendChild(this.htmlRendered3D.domElement)

        this.camera = new PerspectiveCamera(
            27,
            clientWidth / clientHeight,
            1,
            3500,
        )
        this.camera.position.z = 2750

        this.controls = new TrackballControls(
            this.camera,
            this.htmlElementContainer,
        )

        this.htmlElementContainer.onpointermove = (event) => {
            const target = event.target as HTMLDivElement
            this.pointer.x = (event.offsetX / target.clientWidth) * 2 - 1
            this.pointer.y = -(event.offsetY / target.clientHeight) * 2 + 1
        }
        this.htmlElementContainer.onclick = () => {
            if (this.hovered) {
                this.uidSelected$.next(
                    this.hovered.userData.selector.getEntity().uid,
                )
            } else {
                this.uidSelected$.next(undefined)
            }
        }

        setTimeout(() => {
            const observer = new window['ResizeObserver'](() => {
                this.renderer.setSize(
                    this.htmlElementContainer.clientWidth,
                    this.htmlElementContainer.clientHeight,
                )

                this.htmlRendered2D.setSize(
                    this.htmlElementContainer.clientWidth,
                    this.htmlElementContainer.clientHeight,
                )
                this.htmlRendered3D.setSize(
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

    addSelectables(dynamicContent3d: Dynamic3dContent) {
        this.selectables = [
            ...this.selectables,
            ...([
                ...dynamicContent3d.modules,
                ...dynamicContent3d.intraConnection,
                ...dynamicContent3d.groups,
            ]
                .map((m) => m.children)
                .flat() as SelectableObject3D[]),
        ]
        this.ground && this.scene.remove(this.ground)
        this.ground = new GroundObject3d({ selectables: this.selectables })
        this.scene.add(this.ground)
    }

    display(elem: CustomElement<VirtualDOM>) {
        Dynamic3dContent.customElements[elem.id] = elem
    }
}
