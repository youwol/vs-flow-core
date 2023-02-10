import { IEnvironment } from '../environment'
import { Connection } from '../connections'
import { Layer, Workflow } from '../workflows'
import { Modules } from '..'
import { ApiTrait } from '../modules/traits'
import { InputMessage } from '../modules'

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

export class ProjectState {
    public readonly main: Workflow
    public readonly macros: Macro[]
    public readonly environment: IEnvironment

    constructor(params: {
        main: Workflow
        macros: Macro[]
        environment: IEnvironment
    }) {
        Object.assign(this, params)
        this.main.connections
            .filter((c) => !c.isConnected())
            .forEach((c) => {
                c.connect({ apiFinder: (uid) => this.main.getModule(uid) })
            })
    }

    getObservable({ moduleId, slotId }: { moduleId: string; slotId: string }) {
        return this.main.modules
            .find((m) => m.uid == moduleId)
            .outputSlots.find((s) => s.slotId == slotId).observable$
    }

    addFlows(flows: FlowNode[][]) {
        const {
            modules,
            connections,
        }: { modules: Modules.Implementation[]; connections: Connection[] } =
            flows
                .map((flow) => {
                    const starts = flow.slice(0, -1)
                    const ends = flow.slice(1)
                    const modules = flow.map(({ module }) => module)
                    const connections = starts.map((start, i) => {
                        const end = ends[i]
                        return new Connection({
                            start: {
                                moduleId: start.module.uid,
                                slotId: start.output,
                            },
                            end: {
                                moduleId: end.module.uid,
                                slotId: end.input,
                            },
                            configuration: { adaptor: end.adaptor },
                        })
                    })
                    return { modules, connections }
                })
                .reduce(
                    (acc, e) => {
                        return {
                            modules: [...acc.modules, ...e.modules],
                            connections: [...acc.connections, ...e.connections],
                        }
                    },
                    { modules: [], connections: [] },
                )
        const modulesSet = new Set([...this.main.modules, ...modules])
        const root = this.main.rootLayer
        return new ProjectState({
            main: new Workflow({
                modules: [...modulesSet],
                connections: [...this.main.connections, ...connections],
                rootLayer: new Layer({
                    uid: root.uid,
                    children: root.children,
                    moduleIds: [
                        ...root.moduleIds,
                        ...[...modulesSet].map((m) => m.uid),
                    ],
                }),
            }),
            macros: this.macros,
            environment: this.environment,
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
    }) {
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
            main: new Workflow({
                modules: this.main.modules,
                connections: this.main.connections,
                rootLayer,
            }),
            macros: this.macros,
            environment: this.environment,
        })
    }
}
