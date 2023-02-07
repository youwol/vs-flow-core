import { Modules } from '../../index'
import { IOs, OutputMessage, ProcessingMessage } from '../../lib/modules'

import { filter, map, mergeMap } from 'rxjs/operators'
import { Observable, of } from 'rxjs'
import { Configuration, Attributes } from '../../lib/modules/configurations'
import { noContract } from '../../lib/modules/IOs/contract'
import { Context } from '@youwol/logging'

type TSchema = {
    function: Attributes.JsCode
}
type TExtractedConfig = {
    function: (...args) => unknown
}
type TProcessingMessage = ProcessingMessage<unknown, TExtractedConfig>
const input$ = new IOs.Input({
    description: 'the input stream',
    contract: noContract,
})

export class RxjsOf extends Modules.DefaultImplementation<TSchema> {
    constructor(fwdParameters) {
        super(
            {
                configurationModel: new Configuration<TSchema>({
                    model: {
                        function: new Attributes.JsCode({
                            value: () => ({ value: 42 }),
                        }),
                    },
                }),
                outputs: ({
                    configuration,
                    context,
                }: {
                    configuration: TExtractedConfig
                    context: Context
                }) => {
                    return {
                        output$: of({
                            data: configuration.function(),
                            context,
                            configuration: {} as TExtractedConfig,
                        }),
                    }
                },
                builderView: (_instance: Modules.Implementation<TSchema>) =>
                    undefined,
            },
            fwdParameters,
        )
    }
}

export class RxjsFilter extends Modules.DefaultImplementation<TSchema> {
    constructor(fwdParameters) {
        super(
            {
                configurationModel: new Configuration<TSchema>({
                    model: {
                        function: new Attributes.JsCode({
                            value: ({ data }) => {
                                return data != undefined
                            },
                        }),
                    },
                }),
                inputs: {
                    input$,
                },
                outputs: ({ inputs }) => {
                    return {
                        output$: inputs.input$.pipe(
                            filter((p: TProcessingMessage) => {
                                return p.configuration.function({
                                    data: p.data,
                                    context: p.context,
                                }) as boolean
                            }),
                        ),
                    }
                },
                builderView: (_instance: Modules.Implementation<TSchema>) =>
                    undefined,
            },
            fwdParameters,
        )
    }
}

export class RxjsMap extends Modules.DefaultImplementation<TSchema> {
    constructor(fwdParameters) {
        super(
            {
                configurationModel: new Configuration<TSchema>({
                    model: {
                        function: new Attributes.JsCode({
                            value: 'return ({data, context}) => { return {data, context} }',
                        }),
                    },
                }),
                inputs: {
                    input$,
                },
                outputs: ({ inputs }) => {
                    return {
                        output$: inputs.input$.pipe(
                            map(
                                (p: TProcessingMessage) =>
                                    p.configuration.function({
                                        data: p.data,
                                        context: p.context,
                                    }) as OutputMessage,
                            ),
                        ),
                    }
                },
                builderView: (_instance: Modules.Implementation<TSchema>) =>
                    undefined,
            },
            fwdParameters,
        )
    }
}

/**
 * For this kind of module requiring an 'innerObservable' we should be able to use macro of the project, e.g.:
 * ```js
 * return ({data, context}}) => {
 *     return context.project.getMacro("macro_id")({input$:data}).output$
 * }
 * ```
 */
export class RxjsMergeMap extends Modules.DefaultImplementation<TSchema> {
    constructor(fwdParameters) {
        super(
            {
                configurationModel: new Configuration<TSchema>({
                    model: {
                        function: new Attributes.JsCode({
                            value: 'return ({data, context}) => { return of({data, context}) }',
                        }),
                    },
                }),
                inputs: {
                    input$,
                },
                outputs: ({ inputs }) => {
                    return {
                        output$: inputs.input$.pipe(
                            mergeMap(
                                (p: TProcessingMessage) =>
                                    p.configuration.function({
                                        data: p.data,
                                        context: p.context,
                                    }) as Observable<OutputMessage>,
                            ),
                        ),
                    }
                },
                builderView: (_instance: Modules.Implementation<TSchema>) =>
                    undefined,
            },
            fwdParameters,
        )
    }
}
