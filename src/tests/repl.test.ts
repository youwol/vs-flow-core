import { Repl } from '../lib/project'
import { TestEnvironment } from './environment'
import { toolbox } from './toolbox'
import { Sphere } from './modules-implementation/sphere.module'
import { RxjsFilter } from '../toolboxes/rxjs'
import { attr$ } from '@youwol/flux-view'

test('repl import', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [] }),
    })
    await repl.import('rxjs')
    const { project } = await repl.__(['filter'])
    expect(project.main.modules).toHaveLength(1)
    expect(project.main.modules[0]).toBeInstanceOf(RxjsFilter)
})

test('repl one module', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    const { project } = await repl.__(['filter'])
    const [modules, connections] = [
        project.main.modules,
        project.main.connections,
    ]
    expect(modules).toHaveLength(1)
    expect(modules[0]).toBeInstanceOf(RxjsFilter)
    expect(connections).toHaveLength(0)
})

test('repl only modules', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    const { project } = await repl.__(['filter', 'sphere'])
    const [modules, connections] = [
        project.main.modules,
        project.main.connections,
    ]
    expect(modules).toHaveLength(2)
    expect(modules[0]).toBeInstanceOf(RxjsFilter)
    expect(modules[1]).toBeInstanceOf(Sphere)

    expect(connections).toHaveLength(1)
    expect(connections[0].start.slotId).toBe('output$')
    expect(connections[0].end.slotId).toBe('input$')
})

test('repl modules with IO', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    const { project } = await repl.__(['filter>0', '0>sphere>0'])
    const [modules, connections] = [
        project.main.modules,
        project.main.connections,
    ]
    expect(modules).toHaveLength(2)
    expect(modules[0]).toBeInstanceOf(RxjsFilter)
    expect(modules[1]).toBeInstanceOf(Sphere)
    expect(connections).toHaveLength(1)
})

test('repl modules with IO & adaptor', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    const { project } = await repl.__(['filter>0', 'a0=0>sphere>0'], {
        adaptors: {
            a0: ({ data }) => ({ data, configuration: {} }),
        },
    })
    const [modules, connections] = [
        project.main.modules,
        project.main.connections,
    ]
    expect(modules).toHaveLength(2)
    expect(modules[0]).toBeInstanceOf(RxjsFilter)
    expect(modules[1]).toBeInstanceOf(Sphere)

    expect(connections).toHaveLength(1)
    expect(connections[0].configuration.adaptor).toBeTruthy()
    const r = connections[0].adapt({ data: 5 })
    expect(r).toEqual({ data: 5, configuration: {} })
})

test('repl modules with IO & name', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    const { project } = await repl.__([
        ['filter>0', '0>sphere(s0)>0'],
        ['filter>0', '0>#s0'],
    ])
    const [modules, connections] = [
        project.main.modules,
        project.main.connections,
    ]
    expect(modules).toHaveLength(3)
    expect(modules[0]).toBeInstanceOf(RxjsFilter)
    expect(modules[1]).toBeInstanceOf(Sphere)
    expect(modules[1].uid).toBe('s0')
    expect(modules[2]).toBeInstanceOf(RxjsFilter)

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
    const { project } = await repl.__([
        'sphere(s0,{"transform":{"translation":{"x":4}}})',
    ])
    const modules = project.main.modules
    expect(modules).toHaveLength(1)
    expect(modules[0].configuration).toEqual({
        name: 'Sphere',
        radius: 0,
        transform: { translation: { x: 4, y: 0, z: 0 } },
    })
})

test('repl modules with config 2', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    const { project } = await repl.__([
        'sphere({"transform":{"translation":{"x":4}}})',
    ])
    const modules = project.main.modules
    expect(modules).toHaveLength(1)
    expect(modules[0].configuration).toEqual({
        name: 'Sphere',
        radius: 0,
        transform: { translation: { x: 4, y: 0, z: 0 } },
    })
})

test('repl modules with config 3', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    const { project } = await repl.__(['sphere({@c})'], {
        configurations: {
            '@c': { transform: { translation: { x: 4 } } },
        },
    })
    const modules = project.main.modules
    expect(modules).toHaveLength(1)
    expect(modules[0].configuration).toEqual({
        name: 'Sphere',
        radius: 0,
        transform: { translation: { x: 4, y: 0, z: 0 } },
    })
})

test('repl modules with config 4', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    const { project } = await repl.__(['sphere(s0,{@c})'], {
        configurations: {
            '@c': { transform: { translation: { x: 4 } } },
        },
    })
    const modules = project.main.modules
    expect(modules).toHaveLength(1)
    expect(modules[0].configuration).toEqual({
        name: 'Sphere',
        radius: 0,
        transform: { translation: { x: 4, y: 0, z: 0 } },
    })
})

test('repl organize', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    await repl.__([
        ['filter(filter)', 'map(map)', 'mergeMap(m2)'],
        ['of(of)', '#m2'],
    ])
    const { project } = repl.organize([
        { layerId: 'foo', uids: ['filter', 'map'] },
    ])
    expect(project.main.rootLayer.moduleIds).toEqual(['m2', 'of'])
    expect(project.main.rootLayer.children).toHaveLength(1)
    expect(project.main.rootLayer.children[0].moduleIds).toEqual([
        'filter',
        'map',
    ])
    expect(project.main.rootLayer.children[0].children).toHaveLength(0)
})

test('repl with view', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    await repl.__(['timer(t0,{"name":"1s"})', 'filter(f0,{@f0})', 'map(m0)'], {
        configurations: {
            '@f0': {
                function: ({ data }) => data % 2 == 0,
            },
        },
    })
    const { project } = repl.addView({
        viewId: 'Test',
        implementation: (project) => {
            const obs = project.getObservable({
                moduleId: 'm0',
                slotId: 'output$',
            })

            return {
                innerText: attr$(obs, () => new Date().toTimeString()),
            }
        },
    })
    expect(project.views.Test).toBeTruthy()
})

test('repl misc 0', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    const { project } = await repl.__([
        ['filter(filter)', 'map(map)', 'mergeMap(m2)'],
        ['of(of)', '#m2'],
    ])

    const [modules, connections] = [
        project.main.modules,
        project.main.connections,
    ]
    expect(modules).toHaveLength(4)
    expect(connections).toHaveLength(3)
})

test('multiple steps', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    await repl.__([
        ['timer(t0,{"name":"1s"})', 'filter(f0)', 'map(m0)', 'mergeMap(m1)'],
    ])
    await repl.__(['of(of)'])
    const { project } = await repl.__(['#of', '#m1'])
    const modules = project.main.modules
    expect(modules).toHaveLength(5)
    const connections = project.main.connections
    expect(connections).toHaveLength(4)
    expect(project.main.rootLayer.moduleIds).toHaveLength(5)
})

test('repl misc 1', async () => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })
    expect(repl).toBeTruthy()
    const { project } = await repl.__(['filter>0', 'a0=>sphere>0'], {
        adaptors: {
            a0: ({ data }) => ({ data, configuration: {} }),
        },
    })
    const connections = project.main.connections
    expect(connections).toHaveLength(1)
    expect(connections[0].configuration.adaptor).toBeTruthy()
    const r = connections[0].adapt({ data: 5 })
    expect(r).toEqual({ data: 5, configuration: {} })
})
