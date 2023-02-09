import { Configuration, Attributes } from '../../lib/modules/configurations'
import { Modules } from '../..'
import { IOs, ProcessingMessage } from '../../lib/modules'
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
    name: Attributes.String
    radius: Attributes.Float
    transform: Transform
}
type TData = { material: Material }

type TExtractedConfig = {
    radius: number
    transform: {
        translation: {
            x: number
            y: number
            z: number
        }
    }
}
type TMessage = ProcessingMessage<TData, TExtractedConfig>

export class Sphere extends Modules.DefaultImplementation<TSchema> {
    constructor(fwdParameters) {
        super(
            {
                configurationModel: new Configuration<TSchema>({
                    model: {
                        name: new Attributes.String({ value: 'Sphere' }),
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
                outputs: ({ inputs }) => {
                    return {
                        output$: inputs.input$.pipe(
                            map((m: TMessage) => {
                                const geometry = new SphereGeometry(
                                    m.configuration.radius,
                                    10,
                                    10,
                                )
                                // should apply the transformation
                                return {
                                    data: new Mesh(geometry, m.data.material),
                                    context: m.context,
                                }
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
