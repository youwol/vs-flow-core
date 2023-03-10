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
    CanvasTrait,
} from './traits'
import { Context, LogChannel } from '@youwol/logging'
import { IEnvironment } from '../environment'
import { VirtualDOM } from '@youwol/flux-view'
export * as IOs from './IOs'

export type Implementation<TSchema extends Schema = Schema> = ApiTrait &
    ConfigurableTrait<TSchema> &
    UidTrait &
    JournalTrait &
    Partial<HtmlTrait> &
    Partial<CanvasTrait> & {
        environment: IEnvironment
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

export type OutputGenerator<TInputs, TConfig = unknown> = ({
    inputs,
    context,
    configuration,
}: {
    inputs: {
        [Property in keyof TInputs]: Observable<
            ProcessingMessage<extractGeneric<TInputs[Property]>, TConfig>
        >
    }
    context: Context
    configuration: TConfig
}) => { [k: string]: Observable<OutputMessage> }

export type UserArgs<TSchema extends Schema, TInputs> = {
    configuration: Configurations.Configuration<TSchema>
    inputs?: {
        [Property in keyof TInputs]: TInputs[Property]
    }
    outputs?: (
        arg: OutputMapperArg<TSchema, TInputs>,
    ) => Record<string, Observable<OutputMessage>>
    canvas?: (config?) => VirtualDOM
    html?: (config?) => VirtualDOM
}

export type extractGeneric<Type> = Type extends IOs.Input<infer X> ? X : never
export type extractGenericObs<Type> = Type extends Observable<infer X>
    ? X
    : never

export type OutputMapperArg<TConfigModel, TInputs> = {
    inputs: {
        [Property in keyof TInputs]: Observable<
            ProcessingMessage<
                extractGeneric<TInputs[Property]>,
                ConfigInstance<TConfigModel>
            >
        >
    }
    context: Context
    configuration: ConfigInstance<TConfigModel>
}

export type ForwardArgs = {
    uid?: string
    configurationInstance?: { [_k: string]: unknown }
    logsChannels?: LogChannel[]
    environment: IEnvironment
}

export class DefaultImplementation<
    TSchema extends Schema,
    TInputs = { [k: string]: IOs.Input<unknown> },
    TOutputs extends (...args) => {
        [k: string]: Observable<unknown>
    } = OutputGenerator<TInputs, ConfigInstance<TSchema>>,
> implements Implementation<TSchema>
{
    public readonly uid: string = uuidv4()
    public readonly environment: IEnvironment
    public readonly configuration: Configurations.Configuration<TSchema>
    public readonly configurationInstance: ConfigInstance<TSchema>
    public readonly inputs: {
        [Property in keyof TInputs]: TInputs[Property]
    }
    public readonly outputs?: OutputGenerator<TInputs> = () => ({})

    public readonly inputSlots: {
        [Property in keyof TInputs]: IOs.InputSlot<
            extractGeneric<TInputs[Property]>
        >
    }

    public readonly outputSlots: {
        [Property in keyof ReturnType<TOutputs>]: IOs.OutputSlot<
            extractGenericObs<ReturnType<TOutputs>[Property]>
        >
    }
    public readonly journal: ExecutionJournal

    public readonly canvas?: (config?) => VirtualDOM
    public readonly html?: (config?) => VirtualDOM

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

        const { inputSlots, outputSlots } = moduleConnectors<
            TSchema,
            TInputs,
            TOutputs
        >({
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
