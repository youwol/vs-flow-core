import { Modules, IEnvironment, ToolBox } from '../../../../lib'
import { toolboxes } from '../../../../toolboxes'
import { BehaviorSubject, ReplaySubject } from 'rxjs'
import { ObjectJs } from '@youwol/fv-tree'
import * as FluxView from '@youwol/flux-view'
import { VirtualDOM } from '@youwol/flux-view'
import { ExecutionJournal } from '../../../../lib/modules/traits'
import {
    installJournalModule,
    Log,
    ErrorLog,
    LogChannel,
} from '@youwol/logging'
import * as cdnClient from '@youwol/cdn-client'

export class Environment implements IEnvironment {
    public readonly toolboxes$ = new BehaviorSubject<ToolBox[]>([])

    public readonly fv = FluxView
    public readonly viewsFactory = [
        {
            name: 'default',
            description: 'Raw view of data',
            isCompatible: () => true,
            view: (data) => {
                const state = new ObjectJs.State({
                    title: ' ',
                    data,
                })
                return new ObjectJs.View({ state }) as VirtualDOM
            },
        },
        {
            name: 'ExecutionJournal',
            description: 'ExecutionJournal view',
            isCompatible: (d) => d instanceof ExecutionJournal,
            view: (data: ExecutionJournal) => {
                return installJournalModule(cdnClient).then((module) => {
                    const state = new module.JournalState({
                        journal: {
                            title: "Module's Journal",
                            abstract: '',
                            pages: data.pages,
                        },
                    })
                    return new module.JournalView({ state })
                })
            },
        },
    ]
    public readonly errorChannel$ = new ReplaySubject<Log>()
    public readonly logsChannels: LogChannel[]

    constructor(params: { toolboxes: ToolBox[] }) {
        Object.assign(this, params)
        this.logsChannels = [
            new LogChannel({
                filter: (log) => log instanceof ErrorLog,
                pipes: [this.errorChannel$],
            }),
        ]
        this.errorChannel$.subscribe((log: ErrorLog<Error, unknown>) => {
            console.error(log.error)
            console.error(log.data)
        })
    }

    async import(toolbox: string): Promise<ToolBox> {
        /**
         * for now only standard toolboxes are supported
         */
        const actualToolboxes = this.toolboxes$.value
        this.toolboxes$.next([...actualToolboxes, toolboxes[toolbox]])
        return Promise.resolve(toolboxes[toolbox])
    }

    async instantiateModule<T>({
        typeId,
        moduleId,
        configuration,
    }: {
        typeId: string
        moduleId?: string
        configuration?: { [_k: string]: unknown }
    }): Promise<T & Modules.Implementation> {
        const module: Modules.Module<Modules.Implementation> =
            this.toolboxes$.value
                .reduce((acc, toolbox) => [...acc, ...toolbox.modules], [])
                .find((module: Modules.Module<Modules.Implementation>) => {
                    return module.declaration.typeId == typeId
                })
        return (await module.getInstance({
            fwdParams: {
                uid: moduleId,
                configurationInstance: configuration,
                environment: this,
                logsChannels: this.logsChannels,
            },
            environment: this,
        })) as T & Modules.Implementation
    }
}
