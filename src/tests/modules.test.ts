import { toolbox } from './toolbox'
import { TestEnvironment } from './environment'
import { Modules } from '..'

test('filter module', async () => {
    const env = new TestEnvironment({ toolboxes: [toolbox] })
    const module = await env.instantiateModule({
        typeId: 'filter',
    })
    expect(module).toBeTruthy()
})

test('mergeMap module', async () => {
    const env = new TestEnvironment({ toolboxes: [toolbox] })
    const module = await env.instantiateModule({
        typeId: 'mergeMap',
    })
    expect(module).toBeTruthy()
})

test('sphere module', async () => {
    const env = new TestEnvironment({ toolboxes: [toolbox] })
    const module = await env.instantiateModule({
        typeId: 'sphere',
    })
    expect(module).toBeTruthy()
})

test('plot module', async () => {
    const env = new TestEnvironment({ toolboxes: [toolbox] })

    const module = await env.instantiateModule<Modules.Traits.HtmlTrait>({
        typeId: 'plot',
    })
    expect(module).toBeTruthy()
    expect(module.html).toBeDefined()
    const view = module.html()
    expect(view).toBeTruthy()
})
