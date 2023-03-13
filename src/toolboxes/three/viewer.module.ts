import { IOs, ProcessingMessage } from '../../lib/modules'
import { Configuration, Attributes } from '../../lib/modules/configurations'
import {
    Color,
    Object3D,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    AmbientLight,
    HemisphereLight,
} from 'three'
import { Modules } from '../..'
import { TrackballControls } from '../../vs-flow-viewer/src/lib/controls/trackball.controls'
import { ReplaySubject, Subject } from 'rxjs'
import {
    fitSceneToContentIfNeeded,
    getSceneBoundingBox,
    initializeRenderer,
} from './utils'
import { Context } from '@youwol/logging'
import { VirtualDOM } from '@youwol/flux-view'

const configuration = new Configuration({
    schema: {
        name: new Attributes.String({ value: 'Viewer' }),
    },
})

const inputs = {
    input$: new IOs.Input<{ object: Object3D }>({
        description: 'The object to add.',
        contract: IOs.Contracts.contract({
            description: 'Be able to retrieve a Three.Object3D',
            requirements: {
                object: IOs.Contracts.expectInstanceOf({
                    typeName: 'Object3D',
                    Type: Object3D,
                    attNames: ['object', 'mesh'],
                }),
            },
        }),
    }),
}

export class PluginsGateway {
    scene$ = new ReplaySubject<Scene>(1)

    //fluxScene$ = new ReplaySubject<{ old: FluxScene<Object3D>, updated: FluxScene<Object3D> }>(1)

    /* Rendering div updated */
    renderingDiv$ = new ReplaySubject<HTMLDivElement>(1)

    /* Control updated */
    controls$ = new ReplaySubject<TrackballControls>(1)

    mouseDown$ = new Subject<MouseEvent>()
    mouseMove$ = new Subject<MouseEvent>()
    mouseUp$ = new Subject<MouseEvent>()
    click$ = new Subject<MouseEvent>()
}

export class ViewerModule extends Modules.DefaultImplementation<
    typeof configuration.schema,
    typeof inputs
> {
    public readonly pluginsGateway = new PluginsGateway()

    public readonly scene = new Scene()
    public camera: PerspectiveCamera
    public renderer: WebGLRenderer
    public controls: TrackballControls

    private registeredRenderLoopActions: {
        [key: string]: { action: (Module) => void; instance: unknown }
    } = {}

    constructor(fwdParameters) {
        super(
            {
                configuration,
                inputs,
                outputs: () => ({}),
                html: () => renderHtmlElement(this),
            },
            fwdParameters,
        )
        this.inputSlots.input$.preparedMessage$.subscribe((message) => {
            this.render(message.data.object, message.context)
        })

        this.scene.background = new Color(0xaaaaaa)
        const light = new AmbientLight(0x404040)
        this.scene.add(light)
    }
    setRenderingDiv(renderingDiv: HTMLDivElement) {
        this.init(renderingDiv)
        this.pluginsGateway.renderingDiv$.next(renderingDiv)
    }

    addRenderLoopAction(
        uid: string,
        instance: unknown,
        action: (Module) => void,
    ) {
        this.registeredRenderLoopActions[uid] = {
            action: action,
            instance: instance,
        }
    }

    removeRenderLoopAction(uid: string) {
        delete this.registeredRenderLoopActions[uid]
    }

    resize(renderingDiv: HTMLDivElement) {
        this.renderer.setSize(
            renderingDiv.clientWidth,
            renderingDiv.clientHeight,
        )
        this.camera.aspect =
            renderingDiv.clientWidth / renderingDiv.clientHeight
        this.camera.updateProjectionMatrix()
    }

    init(renderingDiv: HTMLDivElement) {
        this.camera = new PerspectiveCamera(
            70,
            renderingDiv.clientWidth / renderingDiv.clientHeight,
            0.01,
            1000,
        )
        this.camera.position.z = 10

        try {
            this.controls = new TrackballControls(this.camera, renderingDiv)

            this.pluginsGateway.controls$.next(this.controls)
            this.renderer = initializeRenderer({
                renderingDiv,
                scene: this.scene,
                camera: this.camera,
                controls: this.controls,
                registeredRenderLoopActions: this.registeredRenderLoopActions,
                viewerInstance: this,
            })
        } catch (e) {
            console.error('Creation of webGl context failed')
            this.renderer = undefined
        }
    }

    render(objects: Array<Object3D>, context: Context) {
        this.scene.clear()
        this.scene.add(objects)

        if (!this.renderer) {
            context.info('No renderer available', {
                scene: this.scene,
            })
            context.terminate()
            return
        }

        const fromBBox = this.scene && getSceneBoundingBox(this.scene)
        fitSceneToContentIfNeeded(
            fromBBox,
            this.scene,
            this.camera,
            this.controls,
        )
        const light = new HemisphereLight('#ffffff', '#000000', 0.7)
        light.position.set(0, 10, 10)

        this.scene.add(light)

        this.renderer.render(this.scene, this.camera)

        context.info('Scene updated', {
            scene: this.scene,
            renderer: this.renderer,
        })
        context.terminate()
    }
    /*
    html() {
        return renderHtmlElement(this)
    }*/
}

function renderHtmlElement(mdle: ViewerModule): VirtualDOM {
    return {
        class: 'h-100 v-100',
        children: [
            {
                class: 'h-100 v-100',
                connectedCallback: (div: HTMLDivElement) => {
                    div.addEventListener(
                        'mousedown',
                        (e) => mdle.pluginsGateway.mouseDown$.next(e),
                        false,
                    )
                    div.addEventListener(
                        'click',
                        (e) => mdle.pluginsGateway.click$.next(e),
                        false,
                    )
                    div.addEventListener(
                        'mousemove',
                        (e) => mdle.pluginsGateway.mouseMove$.next(e),
                        false,
                    )

                    div.addEventListener(
                        'mouseup',
                        (e) => mdle.pluginsGateway.mouseUp$.next(e),
                        false,
                    )
                    setTimeout(() => {
                        mdle.setRenderingDiv(div)
                        const observer = new window['ResizeObserver'](() =>
                            mdle.resize(div),
                        )
                        observer.observe(div)
                    }, 0)
                },
            },
        ],
    }
}
