import { IEnvironment } from '../environment'
import { Layer, Workflow } from '../workflows'
import { Modules } from '..'
import { ApiTrait } from '../modules/traits'
import { InputMessage } from '../modules'
import { VirtualDOM } from '@youwol/flux-view'
import { parseDag } from './parsing-utils'

export type Macro = Workflow & ApiTrait

export class FlowNode {
    public readonly module: Modules.Implementation
    public readonly input: string
    public readonly output: string
    public readonly adaptor?: ({ data, context }) => InputMessage

    constructor(params: {
        module: Modules.Implementation
        input: string
        output: string
        adaptor?: ({ data, context }) => InputMessage
    }) {
        Object.assign(this, params)
    }
}

type TView = (project: ProjectState) => VirtualDOM

type ViewsStore = { [k: string]: TView }

type Uid = string

export interface Delta {
    addedElements: Set<Uid>
    removeElements: Set<Uid>
}

export interface ProjectDelta {
    modules: Delta
    connections: Delta
    layers: Delta
    views: Delta
}

export interface UpgradedProject {
    project: ProjectState
    delta: ProjectDelta
}

export const identityDelta = {
    modules: {
        addedElements: new Set<Uid>(),
        removeElements: new Set<Uid>(),
    },
    connections: {
        addedElements: new Set<Uid>(),
        removeElements: new Set<Uid>(),
    },
    layers: {
        addedElements: new Set<Uid>(),
        removeElements: new Set<Uid>(),
    },
    views: {
        addedElements: new Set<Uid>(),
        removeElements: new Set<Uid>(),
    },
}

export class ProjectState {
    public readonly main: Workflow
    public readonly macros: Macro[]
    public readonly views: ViewsStore = {}
    public readonly wfViews: unknown[] = []
    public readonly environment: IEnvironment

    constructor(params: {
        main: Workflow
        macros: Macro[]
        views?: ViewsStore
        environment: IEnvironment
    }) {
        Object.assign(this, params)
        this.main.connections
            .filter((c) => !c.isConnected())
            .forEach((c) => {
                c.connect({ apiFinder: (uid) => this.main.getModule(uid) })
            })
    }

    import(...toolboxes: string[]) {
        return Promise.all(
            toolboxes.map((t) => this.environment.import(t)),
        ).then(() => this)
    }

    getModule(moduleId) {
        return this.main.modules.find((m) => m.uid == moduleId)
    }

    getObservable({ moduleId, slotId }: { moduleId: string; slotId: string }) {
        return this.main.modules.find((m) => m.uid == moduleId).outputSlots[
            slotId
        ].observable$
    }

    getConnection(connectionId: string) {
        return this.main.connections.find((c) => c.uid == connectionId)
    }

    async parseDag(
        flows: string | string[],
        options: { [k: string]: unknown } = {},
    ) {
        const { modules, connections } = await parseDag(
            this.main.modules,
            this.environment,
            flows,
            options,
        )
        const modulesSet = new Set([...this.main.modules, ...modules])
        const root = this.main.rootLayer
        const rootModuleIds = new Set([
            ...root.moduleIds,
            ...modules.map((m) => m.uid),
        ])
        return new ProjectState({
            ...this,
            main: new Workflow({
                modules: [...modulesSet],
                connections: [...this.main.connections, ...connections],
                rootLayer: new Layer({
                    uid: this.main.rootLayer.uid,
                    children: this.main.rootLayer.children,
                    moduleIds: [...rootModuleIds],
                }),
            }),
        })
    }

    addLayer({
        parentLayerId,
        layerId,
        // either module ids or layer ids
        uids,
    }: {
        parentLayerId?: string
        layerId?: string
        uids: string[]
    }): ProjectState {
        const moduleIds = uids.filter((uid) =>
            this.main.modules.find((m) => m.uid == uid),
        )
        const layers = this.main.rootLayer.filter((l) => uids.includes(l.uid))

        const layer = new Layer({
            uid: layerId,
            moduleIds: moduleIds,
            children: layers,
        })
        const rootLayer = this.main.rootLayer.merge({
            include: layer,
            at: parentLayerId,
        })
        return new ProjectState({
            ...this,
            main: new Workflow({
                modules: this.main.modules,
                connections: this.main.connections,
                rootLayer,
            }),
            macros: this.macros,
            environment: this.environment,
        })
    }

    organize(
        data: [{ layerId: string; parentLayerId?: string; uids: string[] }],
    ): ProjectState {
        return data.reduce((acc, e) => {
            return acc.addLayer(e)
        }, this)
    }

    addView(
        viewId: string,
        vDOM: VirtualDOM | ((project: ProjectState) => VirtualDOM),
    ): ProjectState {
        return new ProjectState({
            ...this,
            views: {
                ...this.views,
                [viewId]: vDOM,
            },
        })
    }

    display(view: unknown): ProjectState {
        return new ProjectState({
            ...this,
            wfViews: [...this.wfViews, view],
        })
    }
}

export function computeDelta(p0: ProjectState, p1: ProjectState): ProjectDelta {
    const addedModules = p1.main.modules
        .filter((m) => !p0.main.modules.includes(m))
        .map((m) => m.uid)
    const removedModules = p0.main.modules
        .filter((m) => !p1.main.modules.includes(m))
        .map((m) => m.uid)
    const addedConnections = p1.main.connections
        .filter((c) => !p0.main.connections.includes(c))
        .map((m) => m.uid)
    const removedConnections = p0.main.connections
        .filter((c) => !p1.main.connections.includes(c))
        .map((m) => m.uid)
    const addedLayers = p1.main.rootLayer
        .flat()
        .map((l) => l.uid)
        .filter(
            (uid) =>
                !p0.main.rootLayer
                    .flat()
                    .map((l0) => l0.uid)
                    .includes(uid),
        )
    const removedLayers = p1.main.rootLayer
        .flat()
        .map((l) => l.uid)
        .filter(
            (uid) =>
                !p0.main.rootLayer
                    .flat()
                    .map((l0) => l0.uid)
                    .includes(uid),
        )
    const addedViews = Object.keys(p1.views).filter(
        (k) => !Object.keys(p0.views).includes(k),
    )
    const removedViews = Object.keys(p0.views).filter(
        (k) => !Object.keys(p1.views).includes(k),
    )
    return {
        modules: {
            addedElements: new Set(addedModules),
            removeElements: new Set(removedModules),
        },
        connections: {
            addedElements: new Set(addedConnections),
            removeElements: new Set(removedConnections),
        },
        layers: {
            addedElements: new Set(addedLayers),
            removeElements: new Set(removedLayers),
        },
        views: {
            addedElements: new Set(addedViews),
            removeElements: new Set(removedViews),
        },
    }
}
