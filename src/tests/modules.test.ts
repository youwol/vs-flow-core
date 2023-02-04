import { toolbox } from './toolbox'
import { TestEnvironment } from './environment'

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
