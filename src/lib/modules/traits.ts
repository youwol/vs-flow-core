import {
    InputMessage,
    IOs,
    ModuleViewRenderer,
    ProcessingMessage,
    TOutputGenerator,
} from './module'
import { Observable, ReplaySubject } from 'rxjs'
import { filter, map, tap } from 'rxjs/operators'
import * as Configurations from './configurations'
import { ConfigInstance, Schema } from './configurations'
import { Context, Journal, LogChannel } from '@youwol/logging'

export interface UidTrait {
    uid: string
}
export interface ApiTrait {
    inputSlots: Array<IOs.InputSlot>
    outputSlots: Array<IOs.OutputSlot>
}

export function moduleConnectors<
    TSchema extends Schema,
    TInputs = { [k: string]: unknown },
>(params: {
    moduleId: string
    inputs?: {
        [Property in keyof TInputs]: IOs.Input<TInputs[Property]>
    }
    outputs?: TOutputGenerator<TInputs>
    defaultConfiguration: Configurations.Configuration<TSchema>
    staticConfiguration: { [_k: string]: unknown }
    executionJournal: ExecutionJournal
    context: Context
}): {
    inputSlots: Array<IOs.InputSlot>
    outputSlots: Array<IOs.OutputSlot>
} {
    const inputSlots = Object.entries(params.inputs || {}).map(
        ([slotId, input]: [string, IOs.Input<unknown>]) => {
            return new IOs.InputSlot({
                slotId: slotId,
                moduleId: params.moduleId,
                description: input.description,
                contract: input.contract,
                subject: new ReplaySubject<InputMessage>(1),
            })
        },
    )
    const observers = inputSlots.reduce(
        (acc, e) => ({
            ...acc,
            [e.slotId]: e.subject.pipe(
                map((message: InputMessage<unknown>) => {
                    const ctx = params.executionJournal.addPage({
                        title: `Enter slot ${e.slotId}`,
                        userData: message.context,
                    })
                    return { ...message, context: ctx }
                }),
                filter((message) => {
                    if (!e.contract) {
                        message.context.info('No contract defined')
                        return true
                    }
                    const resolution = e.contract.resolve(
                        message.data,
                        message.context,
                    )
                    if (!resolution.succeeded) {
                        message.context.error(
                            Error('Contract resolution failed'),
                            { contract: e.contract, resolution },
                        )
                    }
                    return resolution.succeeded
                }),
                map((message) => {
                    return {
                        data: message.data,
                        configuration: params.defaultConfiguration.extractWith({
                            values: {
                                ...params.staticConfiguration,
                                ...message.configuration,
                            },
                            context: message.context,
                        }),
                        context: message.context,
                    }
                }),
            ),
        }),
        {},
    ) as {
        [Property in keyof TInputs]: Observable<
            ProcessingMessage<TInputs[Property], ConfigInstance<TSchema>>
        >
    }
    const outputSlots = Object.entries(
        params.outputs({
            inputs: observers,
            context: params.context,
            configuration: params.defaultConfiguration.extractWith({
                values: {
                    ...params.staticConfiguration,
                },
                context: params.context,
            }),
        }),
    ).map(([id, observable$]: [string, Observable<ProcessingMessage>]) => {
        return new IOs.OutputSlot<unknown>({
            slotId: id,
            moduleId: params.moduleId,
            observable$: observable$.pipe(
                tap(({ data, context }) => {
                    context && context.info && context.info('emit output', data)
                }),
                map(({ data, context }) => {
                    return { data, context: context['userContext'] }
                }),
            ),
        })
    })
    return {
        inputSlots,
        outputSlots,
    }
}
export interface ConfigurableTrait<TSchema extends Schema> {
    configuration: Configurations.Configuration<TSchema>
    configurationInstance: { [k: string]: unknown }
}

export class ExecutionJournal implements Journal.Journal {
    public readonly title = 'Execution Journal'
    public readonly abstract = ''

    public pages: Journal.Page[] = []
    public readonly logsChannels: LogChannel[] = []

    constructor(params: { logsChannels?: LogChannel[] }) {
        Object.assign(this, params)
    }

    addPage({
        title,
        abstract,
        userData,
    }: {
        title: string
        userData?: { [_key: string]: unknown }
        abstract?: string
    }) {
        const context = new Context(title, userData, this.logsChannels)

        this.pages = this.pages
            .filter((j) => j.title != title)
            .concat([{ title, abstract, entryPoint: context }])
        return context
    }
}

export interface JournalTrait {
    journal: ExecutionJournal
}

export interface SideEffectsTrait {
    apply()

    dispose()
}

export interface RenderingTrait {
    renderView?: () => ModuleViewRenderer
}

export interface PluginTrait {
    parentModuleId: string
}

export interface StatusTrait<TStatus> {
    status$: Observable<TStatus>
}
