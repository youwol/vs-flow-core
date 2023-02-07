import { Modules } from '../../index'
import { IOs, ModuleViewRenderer } from '../../lib/modules'

import { Configuration, Attributes } from '../../lib/modules/configurations'
import { noContract } from '../../lib/modules/IOs/contract'

type TSchema = {
    circles: { x: Attributes.Float; y: Attributes.Float }[]
}
const input$ = new IOs.Input({
    description: 'the input stream',
    contract: noContract,
})

export class PlotModule extends Modules.DefaultImplementation {
    constructor(fwdParameters) {
        super(
            {
                configurationModel: new Configuration<TSchema>({
                    model: {
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
                renderView: () => {
                    return new ModuleViewRenderer({
                        htmlElement: document.createElement('div'),
                    })
                },
            },
            fwdParameters,
        )
    }
}
