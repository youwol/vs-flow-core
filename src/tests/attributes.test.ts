import { Configurations } from '../lib/modules'

test('JScode attribute', () => {
    const att = new Configurations.Attributes.JsCode({
        value: (a: number) => 2 * a,
    })
    expect(att.__value(5)).toBe(10)
})

test('JScode attribute from string', () => {
    const att = new Configurations.Attributes.JsCode<(a: number) => number>({
        value: 'return (a) => 2 * a',
    })
    expect(att.__value(5)).toBe(10)
})
