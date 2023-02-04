import * as Configurations from './configurations'
import * as IOs from './IOs'
import { InstallInputs } from '@youwol/cdn-client'
import { Observable, Subject } from 'rxjs'
import { Schema } from './configurations'
import { Connections } from '..'
import { tap } from 'rxjs/operators'
import { JsonMap } from '../connections'
export * as IOs from './IOs'

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
    wrapperStyle: { [k: string]: string }
    htmlElement: HTMLElement
}

export interface Declaration {
    typeId: string
    dependencies?: InstallInputs
    tags?: string[]
    description?:
        | string
        | { package: string; version: string; filePath: string }
}

export type InputMessage<
    TData = unknown,
    TConfig = unknown,
> = Connections.Message<TData> & {
    configuration: TConfig
}
type TOutputGenerator<TSchema> = (
    inputs: {
        [k: string]: Observable<InputMessage>
    },
    config: TSchema,
) => { [k: string]: Observable<Connections.Message> }

export class Implementation<TSchema extends Schema> {
    public readonly moduleId: string
    public readonly configuration: Configurations.Configuration<TSchema>
    public readonly inputs: { [k: string]: IOs.Input }
    public readonly outputs: TOutputGenerator<TSchema>
    public readonly builderView: (
        instance: Implementation<TSchema>,
    ) => ModuleViewBuilder
    public readonly renderView?: (
        instance: Implementation<TSchema>,
    ) => ModuleViewRenderer

    public readonly inputSlots = new Array<IOs.InputSlot>()
    public readonly outputSlots = new Array<IOs.OutputSlot>()
    public readonly persistedConfiguration: JsonMap
    constructor(
        params: {
            moduleId?: string
            configuration: Configurations.Configuration<TSchema>
            inputs: { [k: string]: IOs.Input }
            outputs: TOutputGenerator<TSchema>
            builderView: (
                instance: Implementation<TSchema>,
            ) => ModuleViewBuilder
            renderView?: (
                instance: Implementation<TSchema>,
            ) => ModuleViewRenderer
        },
        fwdParameters: {
            persistedConfiguration
        },
    ) {
        Object.assign(this, params, fwdParameters)

        this.moduleId = this.moduleId || uuidv4()

        this.inputSlots = Object.entries(params.inputs).map(([id, input]) => {
            return new IOs.InputSlot({
                slotId: id,
                moduleId: this.moduleId,
                description: input.description,
                contract: input.contract,
                subject: new Subject(),
            })
        })

        const observers = this.inputSlots.reduce(
            (acc, e) => ({ ...acc, [e.slotId]: e.subject }),
            {},
        )
        // need to override configuration default with persistedConfiguration values

        this.outputSlots = Object.entries(
            params.outputs(observers, this.configuration.model),
        ).map(([id, observable$]) => {
            return new IOs.OutputSlot<unknown>({
                slotId: id,
                moduleId: this.moduleId,
                observable$: observable$.pipe(
                    tap(({ data, context }) => {
                        console.log('emit output', { data, context })
                        //context && context.info && context.info('emit output', data)
                    }),
                ),
            })
        })
        // no op
    }
}

export class Module<TImplementation> {
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

    async getInstance(params: { fwdParams; environment }) {
        return this.implementation instanceof Promise
            ? await this.implementation(params)
            : this.implementation(params)
    }
}
