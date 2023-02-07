import { Repl } from '../lib/project/repl'
import { TestEnvironment } from './environment'
import { toolbox } from './toolbox'
import { RxjsFilter } from './modules-implementation/rxjs.modules'
import { Sphere } from './modules-implementation/sphere.module'

test('repl one module', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    await repl.__(['filter'])
    expect(repl.modules()).toHaveLength(1)
    expect(repl.modules()[0]).toBeInstanceOf(RxjsFilter)
    expect(repl.connections()).toHaveLength(0)
})

test('repl only modules', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    await repl.__(['filter', 'sphere'])
    expect(repl.modules()).toHaveLength(2)
    expect(repl.modules()[0]).toBeInstanceOf(RxjsFilter)
    expect(repl.modules()[1]).toBeInstanceOf(Sphere)
    const connections = repl.connections()
    expect(connections).toHaveLength(1)
    expect(connections[0].start.slotId).toBe('output$')
    expect(connections[0].end.slotId).toBe('input$')
})

test('repl modules with IO', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    await repl.__(['filter>0', '0>sphere>0'])
    expect(repl.modules()).toHaveLength(2)
    expect(repl.modules()[0]).toBeInstanceOf(RxjsFilter)
    expect(repl.modules()[1]).toBeInstanceOf(Sphere)
    expect(repl.connections()).toHaveLength(1)
})

test('repl modules with IO & adaptor', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    await repl.__(['filter>0', 'a0=0>sphere>0'], {
        adaptors: {
            a0: ({ data }) => ({ data, configuration: {} }),
        },
    })
    expect(repl.modules()).toHaveLength(2)
    expect(repl.modules()[0]).toBeInstanceOf(RxjsFilter)
    expect(repl.modules()[1]).toBeInstanceOf(Sphere)
    const connections = repl.connections()
    expect(connections).toHaveLength(1)
    expect(connections[0].adaptor).toBeTruthy()
    const r = connections[0].adaptor({ data: 5 })
    expect(r).toEqual({ data: 5, configuration: {} })
})

test('repl modules with IO & name', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    await repl.__([
        ['filter>0', '0>sphere(s0)>0'],
        ['filter>0', '0>#s0'],
    ])
    const modules = repl.modules()
    expect(modules).toHaveLength(4)
    expect(modules[0]).toBeInstanceOf(RxjsFilter)
    expect(modules[1]).toBeInstanceOf(Sphere)
    expect(modules[1].uid).toBe('s0')
    expect(modules[2]).toBeInstanceOf(RxjsFilter)
    expect(modules[3]).toBeInstanceOf(Sphere)

    const connections = repl.connections()
    expect(connections).toHaveLength(2)
    expect(connections[0].end.moduleId).toBe('s0')
    expect(connections[0].end.slotId).toBe('input$')
    expect(connections[1].end).toEqual(connections[0].end)
})

test('repl modules with config', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    await repl.__(['sphere(s0,{"translation":{"x":4}})'])
    const modules = repl.modules()
    expect(modules).toHaveLength(1)
    expect(modules[0].configuration).toEqual({ translation: { x: 4 } })
})

test('repl modules with config 2', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    await repl.__(['sphere({"translation":{"x":4}})'])
    const modules = repl.modules()
    expect(modules).toHaveLength(1)
    expect(modules[0].configuration).toEqual({ translation: { x: 4 } })
})
