import { Configuration, Attributes } from '../../lib/modules/configurations'
import { Modules } from '../..'
import { IOs, OutputMapper } from '../../lib/modules'
import { MeshStandardMaterial } from 'three'
import { map, tap } from 'rxjs/operators'

export function standardMaterialModule(fwdParams) {
    const configuration = new Configuration({
        schema: {
            name: new Attributes.String({ value: 'Material' }),
            color: new Attributes.Integer({ value: 0x3399ff }),
            wireframe: new Attributes.Boolean({ value: false }),
            wireframeLinewidth: new Attributes.Integer({ value: 1 }),
            shading: {
                emissive: new Attributes.Integer({
                    value: 0x3399ff,
                }),
                emissiveIntensity: new Attributes.Float({
                    value: 1,
                }),
                roughness: new Attributes.Float({ value: 0.2 }),
                metalness: new Attributes.Float({ value: 0.3 }),
                flatShading: new Attributes.Boolean({
                    value: false,
                }),
            },
            visibility: {
                visible: new Attributes.Boolean({ value: true }),
                opacity: new Attributes.Float({ value: 1 }),
            },
        },
    })

    const inputs = {
        input$: new IOs.Input<Record<string, never>>({}),
    }

    const outputs: OutputMapper<typeof inputs, typeof configuration.schema> = ({
        inputs,
    }) => ({
        output$: inputs.input$.pipe(
            map(({ configuration, context }) => {
                const material = new MeshStandardMaterial({
                    transparent: configuration.visibility.opacity < 1,
                    opacity: configuration.visibility.opacity,
                    visible: configuration.visibility.visible,
                    color: configuration.color,
                    emissive: configuration.shading.emissive,
                    emissiveIntensity: configuration.shading.emissiveIntensity,
                    roughness: configuration.shading.roughness,
                    metalness: configuration.shading.metalness,
                    flatShading: configuration.shading.flatShading,
                    wireframe: configuration.wireframe,
                    wireframeLinewidth: configuration.wireframeLinewidth,
                })
                return {
                    data: material,
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
