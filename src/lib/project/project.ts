import { IEnvironment } from '../environment'
import { connect, Connection } from '../connections'
import { Workflow } from '../workflows'
import { Modules } from '..'
import { ApiTrait } from '../modules/traits'
import { Subscription } from 'rxjs'
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
    public readonly subscriptionsStore: { [k: string]: Subscription } = {}

    constructor(params: {
        main: Workflow
        macros: Macro[]
        subscriptions?: { [k: string]: Subscription }
        environment: IEnvironment
    }) {
        Object.assign(this, params)
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
                            adaptor: end.adaptor,
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
        const subscriptions = connections.reduce((acc, connection) => {
            const startModule = [...this.main.modules, ...modules].find(
                (m) => m.uid == connection.start.moduleId,
            )
            const endModule = [...this.main.modules, ...modules].find(
                (m) => m.uid == connection.end.moduleId,
            )
            return {
                ...acc,
                [connection.uid]: connect({
                    start: {
                        slotId: connection.start.slotId,
                        module: startModule,
                    },
                    end: { slotId: connection.end.slotId, module: endModule },
                    adaptor: connection.adaptor,
                }),
            }
        }, {})
        return new ProjectState({
            main: new Workflow({
                modules: [...this.main.modules, ...modules],
                connections: [...this.main.connections, ...connections],
                organizer: this.main.organizer,
            }),
            macros: this.macros,
            environment: this.environment,
            subscriptions: { ...this.subscriptionsStore, ...subscriptions },
        })
    }
}
