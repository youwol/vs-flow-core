import * as Configurations from './configurations'
import * as IOs from './IOs'
import { InstallInputs } from '@youwol/cdn-client'
import { Observable } from 'rxjs'
import { ConfigInstance, Schema } from './configurations'
import { Connections, Modules } from '..'
import { JsonMap } from '../connections'
import {
    ConfigurableTrait,
    ApiTrait,
    ExecutionJournal,
    moduleConnectors,
    UidTrait,
    HtmlTrait,
    JournalTrait,
} from './traits'
import { Context, LogChannel } from '@youwol/logging'
import { IEnvironment } from '../environment'
import { VirtualDOM } from '@youwol/flux-view'
export * as IOs from './IOs'

export type Implementation<TSchema extends Schema = Schema> = ApiTrait &
    ConfigurableTrait<TSchema> &
    UidTrait &
    JournalTrait & {
        environment: IEnvironment
        builderView?: (Implementation) => VirtualDOM
    }

export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
            const r = (Math.random() * 16) | 0,
                v = c == 'x' ? r : (r & 0x3) | 0x8
            return v.toString(16)
        },
    )
}

export class ModuleViewBuilder {}
export class ModuleViewRenderer {
    wrapperAttributes: { [k: string]: string } = {}
    htmlElement: HTMLElement

    constructor(params: {
        wrapperAttributes?: { [k: string]: string }
        htmlElement: HTMLElement
    }) {
        Object.assign(this, params)
    }
}

export interface Declaration {
    typeId: string
    dependencies?: InstallInputs
    tags?: string[]
    description?:
        | string
        | { package: string; version: string; filePath: string }
}

export type InputMessage<TData = unknown> = Connections.Message<TData> & {
    configuration?: JsonMap
}
export type OutputMessage<TData = unknown> = {
    data: TData
    context: Context
}

export type ProcessingMessage<TData = unknown, TConfig = unknown> = {
    data: TData
    context: Context
    configuration: TConfig
}

export type TOutputGenerator<TInputs, TConfig = unknown> = ({
    inputs,
    context,
    configuration,
}: {
    inputs: {
        [Property in keyof TInputs]: Observable<
            ProcessingMessage<TInputs[Property], TConfig>
        >
    }
    context: Context
    configuration: TConfig
}) => { [k: string]: Observable<OutputMessage> }

export type UserArgs<TSchema extends Schema, TInputs> = {
    configuration: Configurations.Configuration<TSchema>
    inputs?: {
        [Property in keyof TInputs]: IOs.Input<TInputs[Property]>
    }
    outputs?: TOutputGenerator<TInputs, ConfigInstance<TSchema>>
    builderView?: (instance: Implementation<TSchema>) => ModuleViewBuilder
    renderView?: (instance: Implementation<TSchema>) => ModuleViewRenderer
}

type extractGeneric<Type> = Type extends IOs.Input<infer X> ? X : never

export type OutputMapper<TInputs, TConfigModel> = ({
    inputs,
    context,
    configuration,
}: {
    inputs: {
        [Property in keyof TInputs]: Observable<
            ProcessingMessage<
                extractGeneric<TInputs[Property]>,
                ConfigInstance<ConfigInstance<TConfigModel>>
            >
        >
    }
    context: Context
    configuration: ConfigInstance<TConfigModel>
}) => { [k: string]: Observable<OutputMessage> }

export type ForwardArgs = {
    uid?: string
    configurationInstance?: { [_k: string]: unknown }
    logsChannels?: LogChannel[]
    environment: IEnvironment
}

type TDefaultImplementation<TSchema extends Schema> = Implementation<TSchema> &
    HtmlTrait

export class DefaultImplementation<
    TSchema extends Schema,
    TInputs = { [k: string]: unknown },
> implements TDefaultImplementation<TSchema>
{
    public readonly uid: string = uuidv4()
    public readonly environment: IEnvironment
    public readonly configuration: Configurations.Configuration<TSchema>
    public readonly configurationInstance: ConfigInstance<TSchema>
    public readonly inputs: {
        [Property in keyof TInputs]: IOs.Input<TInputs[Property]>
    }
    public readonly outputs?: TOutputGenerator<TInputs> = () => ({})
    public readonly builderView: () => ModuleViewBuilder
    public readonly renderView?: () => ModuleViewRenderer

    public readonly inputSlots = new Array<IOs.InputSlot>()
    public readonly outputSlots = new Array<IOs.OutputSlot>()
    public readonly journal: ExecutionJournal

    constructor(
        params: UserArgs<TSchema, TInputs>,
        fwdParameters: ForwardArgs,
    ) {
        Object.assign(this, params, fwdParameters)

        this.uid = this.uid || uuidv4()
        this.journal = new ExecutionJournal({
            logsChannels: fwdParameters.logsChannels || [],
        })
        const constructorContext = this.journal.addPage({
            title: 'constructor',
        })

        this.configurationInstance = this.configuration.extractWith({
            values: fwdParameters.configurationInstance,
            context: constructorContext,
        })

        const { inputSlots, outputSlots } = moduleConnectors({
            moduleId: this.uid,
            inputs: this.inputs,
            outputs: this.outputs,
            executionJournal: this.journal,
            defaultConfiguration: this.configuration,
            staticConfiguration: fwdParameters.configurationInstance,
            context: constructorContext,
        })
        this.inputSlots = inputSlots
        this.outputSlots = outputSlots
        constructorContext.end()
    }
}

export class Module<TImplementation extends Modules.Implementation> {
    public readonly declaration: Declaration
    public readonly implementation: ({
        fwdParams,
        environment,
    }) => Promise<TImplementation> | TImplementation

    constructor(params: {
        declaration: Declaration
        implementation: ({
            fwdParams,
            environment,
        }) => Promise<TImplementation> | TImplementation
    }) {
        Object.assign(this, params)
    }

    async getInstance(params: {
        fwdParams: ForwardArgs
        environment: IEnvironment
    }) {
        const result = this.implementation(params)
        return result instanceof Promise ? await result : result
    }
}
