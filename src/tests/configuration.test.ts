import { Attributes, Configuration } from '../lib/modules/configurations'
import { Context } from '@youwol/logging'

test('configuration', async () => {
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
    const context = new Context('conf-test', {})
    const conf = new Configuration<TSchema>({
        schema: {
            name: new Attributes.String({ value: 'test-conf' }),
            radius: new Attributes.Float({ value: 0, min: 0 }),
            transform: {
                translation: {
                    x: new Attributes.Float({ value: 0 }),
                    y: new Attributes.Float({ value: 0 }),
                    z: new Attributes.Float({ value: 0 }),
                },
            },
        },
    })
    expect(conf).toBeTruthy()
    const values = conf.extractWith({
        values: { radius: 1, transform: { translation: { x: 1 } } },
        context,
    })
    expect(values).toEqual({
        name: 'test-conf',
        radius: 1,
        transform: {
            translation: {
                x: 1,
                y: 0,
                z: 0,
            },
        },
    })
})
