import { Modules } from '../../index'
import { Configurations, IOs, ModuleViewRenderer } from '../../lib/modules'

import { Configuration, Attributes } from '../../lib/modules/configurations'
import { noContract } from '../../lib/modules/IOs/contract'

type TSchema = {
    name: Configurations.Attributes.String
    circles: { x: Attributes.Float; y: Attributes.Float }[]
}
const input$ = new IOs.Input({
    description: 'the input stream',
    contract: noContract,
})

export class PlotModule extends Modules.DefaultImplementation<
    TSchema,
    { input$: unknown }
> {
    constructor(fwdParameters) {
        super(
            {
                configuration: new Configuration<TSchema>({
                    schema: {
                        name: new Configurations.Attributes.String({
                            value: 'Plot',
                        }),
                        circles: [
                            {
                                x: new Attributes.Float({ value: 50 }),
                                y: new Attributes.Float({ value: 50 }),
                            },
                        ],
                    },
                }),
                inputs: {
                    input$,
                },
                builderView: () => undefined,
            },
            fwdParameters,
        )
    }
    html() {
        return new ModuleViewRenderer({
            htmlElement: document.createElement('div'),
        })
    }
}
