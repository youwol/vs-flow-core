import { Modules } from '../../index'
import { IOs } from '../../lib/modules'

import { filter, map, mergeMap } from 'rxjs/operators'
import { Observable } from 'rxjs'
import { UserContext } from '../../lib/connections'
import { Configuration, Attributes } from '../../lib/modules/configurations'
import { noContract } from '../../lib/modules/IOs/contract'

type TSchema = {
    function: Attributes.JsCode
}
const input$ = new IOs.Input({
    description: 'the input stream',
    contract: noContract,
})

export class RxjsFilter extends Modules.Implementation<TSchema> {
    constructor(fwdParameters) {
        super(
            {
                configuration: new Configuration<TSchema>({
                    model: {
                        function: new Attributes.JsCode({
                            content:
                                'return ({data, context}) => { return data != undefined }',
                        }),
                    },
                }),
                inputs: {
                    input$,
                },
                outputs: (inputs, config: TSchema) => {
                    return {
                        output$: inputs.input$.pipe(
                            filter(({ data, context }) =>
                                config.function.eval<unknown, boolean>({
                                    data,
                                    context,
                                }),
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

export class RxjsMap extends Modules.Implementation<TSchema> {
    constructor(fwdParameters) {
        super(
            {
                configuration: new Configuration<TSchema>({
                    model: {
                        function: new Attributes.JsCode({
                            content:
                                'return ({data, context}) => { return {data, context} }',
                        }),
                    },
                }),
                inputs: {
                    input$,
                },
                outputs: (inputs, config: TSchema) => {
                    return {
                        output$: inputs.input$.pipe(
                            map(({ data, context }) =>
                                config.function.eval({
                                    data,
                                    context,
                                }),
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
export class RxjsMergeMap extends Modules.Implementation<TSchema> {
    constructor(fwdParameters) {
        super(
            {
                configuration: new Configuration<TSchema>({
                    model: {
                        function: new Attributes.JsCode({
                            content:
                                'return ({data, context}) => { return of({data, context}) }',
                        }),
                    },
                }),
                inputs: {
                    input$,
                },
                outputs: (inputs, config: TSchema) => {
                    return {
                        output$: inputs.input$.pipe(
                            mergeMap(({ data, context }) =>
                                config.function.eval<
                                    unknown,
                                    Observable<{
                                        data: unknown
                                        context: UserContext
                                    }>
                                >({
                                    data,
                                    context,
                                }),
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
