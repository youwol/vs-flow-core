import * as Configurations from './configurations'
import * as IOs from './IOs'
import { InstallInputs } from '@youwol/cdn-client'
import { Observable } from 'rxjs'
import { Schema } from './configurations'
import { Connections } from '..'
import { JsonMap } from '../connections'
import {
    ConfigurableTrait,
    ApiTrait,
    ExecutionJournal,
    moduleConnectors,
    UidTrait,
    RenderingTrait,
    JournalTrait,
} from './traits'
import { Context, LogChannel } from '@youwol/logging'
import { IEnvironment } from '../environment'
export * as IOs from './IOs'

export type Implementation<TSchema extends Schema = Schema> = ApiTrait &
    ConfigurableTrait<TSchema> &
    UidTrait &
    JournalTrait

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

export type TOutputGenerator = ({
    inputs,
    context,
    configuration,
}: {
    inputs: {
        [k: string]: Observable<ProcessingMessage>
    }
    context: Context
    // The following 'any' is because I did not find out yet how to generate proper type from 'TSchema'
    configuration: any
}) => { [k: string]: Observable<OutputMessage> }

export type UserArgs<TSchema extends Schema> = {
    configurationModel: Configurations.Configuration<TSchema>
    inputs?: { [k: string]: IOs.Input }
    outputs?: TOutputGenerator
    builderView: (instance: Implementation<TSchema>) => ModuleViewBuilder
    renderView?: (instance: Implementation<TSchema>) => ModuleViewRenderer
}

export type ForwardArgs = {
    uid?: string
    configuration?: JsonMap
    logsChannels?: LogChannel[]
}

export class DefaultImplementation<TSchema extends Schema = Schema>
    implements
        ApiTrait,
        ConfigurableTrait<TSchema>,
        JournalTrait,
        UidTrait,
        RenderingTrait
{
    public readonly uid: string = uuidv4()
    public readonly configurationModel: Configurations.Configuration<TSchema>
    public readonly configuration: JsonMap
    public readonly inputs: { [k: string]: IOs.Input }
    public readonly outputs?: TOutputGenerator = () => ({})
    public readonly builderView: () => ModuleViewBuilder
    public readonly renderView?: () => ModuleViewRenderer

    public readonly inputSlots = new Array<IOs.InputSlot>()
    public readonly outputSlots = new Array<IOs.OutputSlot>()
    public readonly journal: ExecutionJournal

    constructor(params: UserArgs<TSchema>, fwdParameters: ForwardArgs) {
        Object.assign(this, params, fwdParameters)

        this.uid = this.uid || uuidv4()

        this.journal = new ExecutionJournal({
            logsChannels: fwdParameters.logsChannels || [],
        })
        const constructorContext = this.journal.addJournal({
            title: 'constructor',
        })

        const { inputSlots, outputSlots } = moduleConnectors({
            moduleId: this.uid,
            inputs: this.inputs,
            outputs: this.outputs,
            executionJournal: this.journal,
            defaultConfiguration: this.configurationModel,
            staticConfiguration: fwdParameters.configuration,
            context: constructorContext,
        })
        this.inputSlots = inputSlots
        this.outputSlots = outputSlots
    }
}

export class Module<TImplementation extends Implementation> {
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
        return this.implementation instanceof Promise
            ? await this.implementation(params)
            : this.implementation(params)
    }
}
