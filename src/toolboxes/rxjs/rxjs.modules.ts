import { filter, map, mergeMap } from 'rxjs/operators'
import { Observable, of, timer } from 'rxjs'
import { Context } from '@youwol/logging'
import {
    IOs,
    ProcessingMessage,
    Configurations,
    OutputMessage,
} from '../../lib/modules'
import { noContract } from '../../lib/modules/IOs/contract'
import { Message } from '../../lib/connections'
import { Modules } from '../../lib'

type TSchema<TArg, TReturn> = {
    name: Configurations.Attributes.String
    function: Configurations.Attributes.JsCode<(d: TArg) => TReturn>
}
type TExtractedConfig = {
    function: (...args) => unknown
}
type TProcessingMessage = ProcessingMessage<unknown, TExtractedConfig>
const input$ = new IOs.Input({
    description: 'the input stream',
    contract: noContract,
})

type TSchemaOf = TSchema<void, unknown>

export class RxjsOf extends Modules.DefaultImplementation<TSchemaOf> {
    constructor(fwdParameters) {
        super(
            {
                configurationModel: new Configurations.Configuration({
                    model: {
                        name: new Configurations.Attributes.String({
                            value: 'Of',
                        }),
                        function: new Configurations.Attributes.JsCode({
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
                builderView: () => undefined,
            },
            fwdParameters,
        )
    }
}

type TSchemaFilter = TSchema<Message, boolean>

export class RxjsFilter extends Modules.DefaultImplementation<TSchemaFilter> {
    constructor(fwdParameters) {
        super(
            {
                configurationModel: new Configurations.Configuration({
                    model: {
                        name: new Configurations.Attributes.String({
                            value: 'Filter',
                        }),
                        function: new Configurations.Attributes.JsCode({
                            value: ({ data }) => data != undefined,
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
                builderView: () => undefined,
            },
            fwdParameters,
        )
    }
}

type TSchemaMap = TSchema<Message, Message>
export class RxjsMap extends Modules.DefaultImplementation<TSchemaMap> {
    constructor(fwdParameters) {
        super(
            {
                configurationModel: new Configurations.Configuration({
                    model: {
                        name: new Configurations.Attributes.String({
                            value: 'Map',
                        }),
                        function: new Configurations.Attributes.JsCode({
                            value: ({ data, context }) => ({ data, context }),
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
                builderView: () => undefined,
            },
            fwdParameters,
        )
    }
}

type TSchemaMergeMap = TSchema<Message, Observable<Message>>
export class RxjsMergeMap extends Modules.DefaultImplementation<TSchemaMergeMap> {
    constructor(fwdParameters) {
        super(
            {
                configurationModel: new Configurations.Configuration({
                    model: {
                        name: new Configurations.Attributes.String({
                            value: 'MergeMap',
                        }),
                        function: new Configurations.Attributes.JsCode({
                            value: ({ data, context }) => of({ data, context }),
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
                builderView: () => undefined,
            },
            fwdParameters,
        )
    }
}

type TSchemaTimer = {
    name: Configurations.Attributes.String
    delay: Configurations.Attributes.Integer
    period: Configurations.Attributes.Integer
}

export class RxjsTimer extends Modules.DefaultImplementation<TSchemaTimer> {
    constructor(fwdParameters) {
        super(
            {
                configurationModel: new Configurations.Configuration({
                    model: {
                        name: new Configurations.Attributes.String({
                            value: 'Timer',
                        }),
                        delay: new Configurations.Attributes.Integer({
                            value: 0,
                        }),
                        period: new Configurations.Attributes.Integer({
                            value: 1000,
                        }),
                    },
                }),
                inputs: {
                    input$,
                },
                outputs: ({ configuration, context }) => {
                    return {
                        output$: timer(
                            configuration.delay,
                            configuration.period,
                        ).pipe(
                            map((c) => {
                                return {
                                    data: c,
                                    context,
                                    configuration: {} as TExtractedConfig,
                                }
                            }),
                        ),
                    }
                },
                builderView: () => undefined,
            },
            fwdParameters,
        )
    }
}
