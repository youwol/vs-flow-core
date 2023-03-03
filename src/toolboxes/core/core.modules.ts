import { Configurations, InputMessage, IOs } from '../../lib/modules'
import { Modules } from '../../lib'
import { noContract } from '../../lib/modules/IOs/contract'
import { child$, VirtualDOM } from '@youwol/flux-view'
import { Context } from '@youwol/logging'

const input$ = new IOs.Input({
    description: 'the input stream',
    contract: noContract,
})

type TSchemaOf = {
    name: Configurations.Attributes.String
    vDom: Configurations.Attributes.JsCode<(d: InputMessage) => VirtualDOM>
}
type TExtractedConfig = {
    name: string
    vDom: (d: InputMessage) => VirtualDOM
}
export class CoreBuilderView extends Modules.DefaultImplementation<TSchemaOf> {
    constructor(fwdParameters) {
        super(
            {
                configurationModel: new Configurations.Configuration({
                    model: {
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
                    input$,
                },
                outputs: ({ inputs }) => ({ output$: inputs.input$ }),
                builderView: (mdle) => {
                    return {
                        children: [
                            child$(mdle.inputSlots[0].subject, (message) => {
                                const context = new Context('', {})
                                const conf =
                                    mdle.configurationModel.extractWith({
                                        values: mdle.configuration,
                                        context,
                                    }) as unknown as TExtractedConfig
                                return conf.vDom(message)
                            }),
                        ],
                    }
                },
            },
            fwdParameters,
        )
    }
}
