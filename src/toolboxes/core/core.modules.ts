import { Configurations, IOs, ProcessingMessage } from '../../lib/modules'
import { Modules } from '../../lib'
import { noContract } from '../../lib/modules/IOs/contract'
import { child$, VirtualDOM } from '@youwol/flux-view'
import { Context } from '@youwol/logging'

const freeInput$ = new IOs.Input({
    description: 'the input stream',
    contract: noContract,
})

type TSchema = {
    name: Configurations.Attributes.String
    vDom: Configurations.Attributes.JsCode<(d: ProcessingMessage) => VirtualDOM>
}

export class BuilderView extends Modules.DefaultImplementation<TSchema> {
    constructor(fwdParameters) {
        super(
            {
                configuration: new Configurations.Configuration({
                    schema: {
                        name: new Configurations.Attributes.String({
                            value: 'BuilderView',
                        }),
                        vDom: new Configurations.Attributes.JsCode({
                            value: (message) => {
                                return {
                                    tag: 'pre',
                                    innerText: JSON.stringify(message, null, 4),
                                }
                            },
                        }),
                    },
                }),
                inputs: {
                    input$: freeInput$,
                },
                outputs: ({ inputs }) => ({ output$: inputs.input$ }),
                canvas: () => {
                    return {
                        children: [
                            child$(
                                this.inputSlots[0].preparedMessage$,
                                (message) => {
                                    const context = new Context('', {})
                                    const conf = this.configuration.extractWith(
                                        {
                                            values: this.configurationInstance,
                                            context,
                                        },
                                    )
                                    return conf.vDom(message)
                                },
                            ),
                        ],
                    }
                },
            },
            fwdParameters,
        )
    }
}

const consoleConfig = {
    name: new Configurations.Attributes.String({
        value: 'Console',
    }),
    prefix: new Configurations.Attributes.String({
        value: 'Console',
    }),
}
export class Console extends Modules.DefaultImplementation<
    typeof consoleConfig,
    {
        input$: unknown
    }
> {
    constructor(fwdParameters) {
        super(
            {
                configuration: new Configurations.Configuration({
                    schema: consoleConfig,
                }),
                inputs: {
                    input$: freeInput$,
                },
                outputs: () => ({}),
            },
            fwdParameters,
        )
        this.inputSlots[0].preparedMessage$.subscribe((d) => {
            console.log(this.configurationInstance.prefix, d)
        })
    }
}
