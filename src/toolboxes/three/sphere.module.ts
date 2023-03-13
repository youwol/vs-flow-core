import { Configuration, Attributes } from '../../lib/modules/configurations'
import { Modules } from '../..'
import { IOs, OutputMapperArg } from '../../lib/modules'
import { Material, SphereGeometry, Mesh } from 'three'
import { map, tap } from 'rxjs/operators'
import { applyTransformation } from './utils'

export function sphereModule(fwdParams) {
    const configuration = new Configuration({
        schema: {
            name: new Attributes.String({ value: 'Sphere' }),
            radius: new Attributes.Float({ value: 1, min: 0 }),
            widthSegments: new Attributes.Integer({ value: 8 }),
            heightSegments: new Attributes.Integer({ value: 6 }),
            phiStart: new Attributes.Float({
                value: 0,
                min: 0,
                max: 2 * Math.PI,
            }),
            phiLength: new Attributes.Float({
                value: 2 * Math.PI,
                min: 0,
                max: 2 * Math.PI,
            }),
            thetaStart: new Attributes.Float({
                value: 0,
                min: 0,
                max: Math.PI,
            }),
            thetaLength: new Attributes.Float({
                value: Math.PI,
                min: 0,
                max: Math.PI,
            }),
            transform: {
                translation: {
                    x: new Attributes.Float({ value: 0 }),
                    y: new Attributes.Float({ value: 0 }),
                    z: new Attributes.Float({ value: 0 }),
                },
                rotation: {
                    x: new Attributes.Float({ value: 0 }),
                    y: new Attributes.Float({ value: 0 }),
                    z: new Attributes.Float({ value: 0 }),
                },
                scaling: {
                    x: new Attributes.Float({ value: 1 }),
                    y: new Attributes.Float({ value: 1 }),
                    z: new Attributes.Float({ value: 1 }),
                },
            },
        },
    })

    const inputs = {
        input$: new IOs.Input<{ material: Material }>({
            description: 'The material to use to "paint" the object.',
            contract: IOs.Contracts.contract({
                description: 'Be able to retrieve a Three.Material',
                requirements: {
                    material: IOs.Contracts.expectInstanceOf({
                        typeName: 'Material',
                        Type: Material,
                        attNames: ['mat', 'material'],
                    }),
                },
            }),
        }),
    }

    const outputs = (
        arg: OutputMapperArg<typeof configuration.schema, typeof inputs>,
    ) => ({
        output$: arg.inputs.input$.pipe(
            map(({ data, configuration, context }) => {
                const geometry = new SphereGeometry(
                    configuration.radius,
                    configuration.widthSegments,
                    configuration.heightSegments,
                    configuration.phiStart,
                    configuration.phiLength,
                    configuration.thetaStart,
                    configuration.thetaLength,
                )
                const mesh = new Mesh(geometry, data.material)
                applyTransformation(mesh, configuration.transform)
                return {
                    data: mesh,
                    context,
                }
            }),
            tap(({ context }) => context.end()),
        ),
    })

    return new Modules.DefaultImplementation(
        {
            configuration,
            inputs,
            outputs,
        },
        fwdParams,
    )
}
