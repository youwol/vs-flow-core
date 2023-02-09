import { AppState } from '../app.state'
import { VirtualDOM } from '@youwol/flux-view'
import * as THREE from 'three'
import {
    SphereGeometry,
    Mesh,
    MeshStandardMaterial,
    Object3D,
    Light,
    GridHelper,
    ShadowMaterial,
    PlaneGeometry,
    IcosahedronGeometry,
} from 'three'

import { ProjectState } from '../../../../lib/project'
import { renderDag } from './dag'
import { fitSceneToContent, getBoundingBox } from './utils'
import * as TrackballControls from 'three-trackballcontrols'
import { CSS2DObject, CSS2DRenderer } from './cdd-2d-renderer'

export class Viewer3DView {
    public readonly class = 'h-100 w-100'
    public readonly style = {
        position: 'relative',
    }
    public readonly state: AppState
    public readonly project: ProjectState
    public readonly children: VirtualDOM[]
    public readonly positions: { [_k: string]: { x: number; y: number } }

    constructor(params: { state: AppState; project: ProjectState }) {
        Object.assign(this, params)
        this.positions =
            this.project.main.modules.length > 0 ? renderDag(this.project) : {}

        this.children = [
            {
                class: 'h-100 w-100',
                connectedCallback: (htmlElement: HTMLDivElement) => {
                    const scene = this.createScene(htmlElement)

                    setTimeout(() => {
                        const observer = new window['ResizeObserver'](() => {
                            scene.renderer.setSize(
                                htmlElement.clientWidth,
                                htmlElement.clientHeight,
                            )

                            scene.labelRenderer.setSize(
                                htmlElement.clientWidth,
                                htmlElement.clientHeight,
                            )
                            scene.camera.aspect =
                                htmlElement.clientWidth /
                                htmlElement.clientHeight
                            scene.camera.updateProjectionMatrix()
                        })
                        observer.observe(htmlElement)
                        fitSceneToContent(
                            scene.scene,
                            scene.camera,
                            scene.controls,
                        )
                    }, 0)
                    animate(scene)
                },
            },
        ]
    }

    createModules() {
        if (this.project.main.modules.length == 0) {
            return []
        }
        return this.project.main.modules
            .map((module) => {
                const position = this.positions[module.uid]
                const geometry = new SphereGeometry(2, 32, 32)
                const material = new MeshStandardMaterial({
                    color: 0x049ef4,
                    roughness: 0.3,
                    metalness: 0.3,
                    emissive: 0x8f0000,
                })
                const sphere = new Mesh(geometry, material)
                sphere.position.set(position.x, position.y, 0)
                sphere.castShadow = true
                const labelDiv = document.createElement('div')
                labelDiv.className = 'label'
                labelDiv.textContent = module.configuration.name as string
                labelDiv.style.marginTop = '-1em'
                const label = new CSS2DObject(labelDiv)
                label.position.set(0, 1, 0)
                sphere.add(label)
                label.layers.set(0)
                return sphere
            })
            .flat()
    }

    createConnections() {
        return this.project.main.connections
            .map((connection) => {
                const startPos = this.positions[connection.start.moduleId]
                const endPos = this.positions[connection.end.moduleId]
                const start = new THREE.Vector3(startPos.x, startPos.y, 0)
                const end = new THREE.Vector3(endPos.x, endPos.y, 0)

                const material = new THREE.LineBasicMaterial({
                    color: 0x0000ff,
                })

                const points = []
                points.push(start)
                points.push(end)
                const geometry = new THREE.BufferGeometry().setFromPoints(
                    points,
                )
                const line = new THREE.Line(geometry, material)
                line.castShadow = true
                const dir = new THREE.Vector3()
                    .subVectors(end, start)
                    .normalize()

                const l = start.distanceTo(end)

                const arrowHelper = new THREE.ArrowHelper(
                    dir,
                    start.clone().add(dir.clone().multiplyScalar(l / 2)), //.add(dir.multiply(0.5)), //new THREE.Vector3().lerp(start, end, 0.5), //start.add(end).multiply(0.5),
                    1,
                    0xffff00,
                    2,
                    1,
                )
                let adaptorMeshes = []
                if (connection.configuration.adaptor) {
                    const geometry = new IcosahedronGeometry(0.7)
                    const material = new MeshStandardMaterial({
                        color: 0xffff00,
                        emissive: 0xffcc00,
                        roughness: 0.3,
                        metalness: 0.3,
                    })
                    const adaptorMesh = new Mesh(geometry, material)
                    const pos = end.clone().add(dir.clone().multiplyScalar(-2))
                    adaptorMesh.position.set(pos.x, pos.y, pos.z)
                    adaptorMesh.castShadow = true
                    adaptorMeshes = [adaptorMesh]
                }
                return [line, arrowHelper, adaptorMeshes].flat()
            })
            .flat()
            .filter((d) => d != undefined)
    }

    createScene(container: HTMLDivElement) {
        const camera = new THREE.PerspectiveCamera(
            27,
            container.clientWidth / container.clientHeight,
            1,
            3500,
        )
        camera.position.z = 2750

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xaaaaaa)
        scene.fog = new THREE.Fog(0x050505, 2000, 3500)

        const meshes = this.createModules()
        meshes.forEach((mesh) => scene.add(mesh))

        this.createConnections().forEach((mesh) => scene.add(mesh))

        createLights(meshes).forEach((light) => {
            scene.add(light)
        })
        createGround(meshes).forEach((obj) => scene.add(obj))
        const controls = new TrackballControls(camera, container)
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.shadowMap.enabled = true
        renderer.setPixelRatio(window.devicePixelRatio)

        renderer.setSize(container.clientWidth, container.clientHeight)
        container.appendChild(renderer.domElement)

        const labelRenderer = new CSS2DRenderer()
        labelRenderer.domElement.style.position = 'absolute'
        labelRenderer.domElement.style.top = '0px'
        labelRenderer.domElement.classList.add('h-100', 'w-100')
        labelRenderer.setSize(container.clientWidth, container.clientHeight)
        container.appendChild(labelRenderer.domElement)

        return { scene, renderer, camera, labelRenderer, controls }
    }
}

function animate(scene) {
    scene.controls.update()
    requestAnimationFrame(() => animate(scene))
    render(scene)
}

function render({ scene, renderer, labelRenderer, camera }) {
    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)
}

function createLights(meshes: Object3D[]): Light[] {
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

function createGround(meshes: Object3D[]): Object3D[] {
    if (meshes.length == 0) {
        return [new GridHelper(10, 10)]
    }
    const bbox = getBoundingBox(meshes)
    const size = bbox.getSize()
    const maxSize = 1.25 * Math.max(size.x, size.y, size.z)
    const center = bbox.getCenter()
    const divisions = 100
    const helper = new GridHelper(maxSize, divisions)

    helper.material.opacity = 0.25
    helper.material.transparent = true
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
