import { Configuration, Attributes } from '../../lib/modules/configurations'
import { Modules } from '../..'
import { InputMessage, IOs } from '../../lib/modules'
import { Material, SphereGeometry, Mesh } from 'three'
import { map } from 'rxjs/operators'

type Transform = {
    translation: {
        x: Attributes.Float
        y: Attributes.Float
        z: Attributes.Float
    }
}

type TSchema = {
    radius: Attributes.Float
    transform: Transform
}
type TData = { material: Material }
type TMessage = InputMessage<TData, TSchema>

export class Sphere extends Modules.Implementation<TSchema> {
    constructor(fwdParameters) {
        super(
            {
                configuration: new Configuration<TSchema>({
                    model: {
                        radius: new Attributes.Float({ value: 0, min: 0 }),
                        transform: {
                            translation: {
                                x: new Attributes.Float({ value: 0 }),
                                y: new Attributes.Float({ value: 0 }),
                                z: new Attributes.Float({ value: 0 }),
                            },
                        },
                    },
                }),
                inputs: {
                    input$: new IOs.Input({
                        description: 'Material',
                        contract: IOs.Contracts.contract({
                            description: 'Be able to retrieve a Three.Material',
                            requirements: {
                                material: IOs.Contracts.expectInstanceOf({
                                    typeName: 'Three.Material',
                                    Type: Material,
                                }),
                            },
                        }),
                    }),
                },
                outputs: (inputs) => {
                    return {
                        output$: inputs.input$.pipe(
                            map((message: TMessage) => {
                                const { configuration } = message
                                const geometry = new SphereGeometry(
                                    configuration.radius,
                                    10,
                                    10,
                                )
                                // should apply the transformation
                                return new Mesh(geometry, message.data.material)
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
