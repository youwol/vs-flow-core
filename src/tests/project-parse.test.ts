import { RxjsFilter } from '../toolboxes/rxjs'
import { Sphere } from './modules-implementation/sphere.module'
import { attr$ } from '@youwol/flux-view'
import { emptyProject } from './test.utils'

test('one module', async () => {
    let project = emptyProject()
    project = await project.parseDag(['filter'])
    const [modules, connections] = [
        project.main.modules,
        project.main.connections,
    ]
    expect(modules).toHaveLength(1)
    expect(modules[0]).toBeInstanceOf(RxjsFilter)
    expect(connections).toHaveLength(0)
})

test('only modules', async () => {
    let project = emptyProject()
    project = await project.parseDag(['filter', 'sphere'])
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

test('modules with IO', async () => {
    let project = emptyProject()
    project = await project.parseDag(['filter>0', '0>sphere>0'])
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
    let project = emptyProject()
    project = await project.parseDag(['filter>0', 'a0=0>sphere>0'], {
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
    let project = emptyProject()
    project = await project.parseDag([
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
    let project = emptyProject()
    project = await project.parseDag([
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
    let project = emptyProject()
    project = await project.parseDag([
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
    let project = emptyProject()
    project = await project.parseDag(['sphere({@c})'], {
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
    let project = emptyProject()
    project = await project.parseDag(['sphere(s0,{@c})'], {
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
    let project = emptyProject()
    project = await project.parseDag([
        ['filter(filter)', 'map(map)', 'mergeMap(m2)'],
        ['of(of)', '#m2'],
    ])
    project = project.organize([{ layerId: 'foo', uids: ['filter', 'map'] }])
    expect(project.main.rootLayer.moduleIds).toEqual(['m2', 'of'])
    expect(project.main.rootLayer.children).toHaveLength(1)
    expect(project.main.rootLayer.children[0].moduleIds).toEqual([
        'filter',
        'map',
    ])
    expect(project.main.rootLayer.children[0].children).toHaveLength(0)
})

test('repl with view', async () => {
    let project = emptyProject()
    project = await project.parseDag(
        ['timer(t0,{"name":"1s"})', 'filter(f0,{@f0})', 'map(m0)'],
        {
            configurations: {
                '@f0': {
                    function: ({ data }) => data % 2 == 0,
                },
            },
        },
    )
    project = project.addView({
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
    let project = emptyProject()
    project = await project.parseDag([
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
    let project = emptyProject()
    project = await project.parseDag([
        ['timer(t0,{"name":"1s"})', 'filter(f0)', 'map(m0)', 'mergeMap(m1)'],
    ])
    project = await project.parseDag(['of(of)'])
    project = await project.parseDag(['#of', '#m1'])
    const modules = project.main.modules
    expect(modules).toHaveLength(5)
    const connections = project.main.connections
    expect(connections).toHaveLength(4)
    expect(project.main.rootLayer.moduleIds).toHaveLength(5)
})

test('repl misc 1', async () => {
    let project = emptyProject()
    project = await project.parseDag(['filter>0', 'a0=>sphere>0'], {
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
