import { TestEnvironment } from './environment'
import { toolbox } from './toolbox'
import { FlowNode, ProjectState } from '../lib/project'
import { Workflow } from '../lib/workflows'

test('project', async () => {
    const environment = new TestEnvironment({ toolboxes: [toolbox] })
    let state = new ProjectState({
        main: new Workflow(),
        macros: [],
        environment,
    })
    expect(state).toBeTruthy()
    const module = await environment.instantiateModule({
        typeId: 'sphere',
    })

    state = state.addFlows([
        [new FlowNode({ module, input: 'input$', output: 'output$' })],
    ])
    expect(state.main.modules).toHaveLength(1)
})

test('project2', async () => {
    const environment = new TestEnvironment({ toolboxes: [toolbox] })
    let state = new ProjectState({
        main: new Workflow(),
        macros: [],
        environment,
    })
    expect(state).toBeTruthy()
    const sphere = await environment.instantiateModule({
        typeId: 'sphere',
    })
    const filter = await environment.instantiateModule({
        typeId: 'filter',
    })

    state = state.addFlows([
        [
            new FlowNode({
                module: filter,
                input: 'input$',
                output: 'output$',
            }),
            new FlowNode({
                module: sphere,
                input: 'input$',
                output: 'output$',
            }),
        ],
    ])
    expect(state.main.modules).toHaveLength(2)
    expect(state.main.connections).toHaveLength(1)
})

test('project layer simple', async () => {
    const environment = new TestEnvironment({ toolboxes: [toolbox] })
    let state = new ProjectState({
        main: new Workflow(),
        macros: [],
        environment,
    })
    expect(state).toBeTruthy()
    const m0 = await environment.instantiateModule({
        moduleId: 'm0',
        typeId: 'timer',
    })
    const m1 = await environment.instantiateModule({
        moduleId: 'm1',
        typeId: 'filter',
    })
    const m2 = await environment.instantiateModule({
        moduleId: 'm2',
        typeId: 'map',
    })
    const m3 = await environment.instantiateModule({
        moduleId: 'm3',
        typeId: 'sphere',
    })

    state = state.addFlows([
        [
            new FlowNode({
                module: m0,
                input: 'input$',
                output: 'output$',
            }),
            new FlowNode({
                module: m1,
                input: 'input$',
                output: 'output$',
            }),
            new FlowNode({
                module: m2,
                input: 'input$',
                output: 'output$',
            }),
            new FlowNode({
                module: m3,
                input: 'input$',
                output: 'output$',
            }),
        ],
    ])
    expect(state.main.modules).toHaveLength(4)
    expect(state.main.connections).toHaveLength(3)
    expect(state.main.rootLayer.moduleIds).toHaveLength(4)
    expect(state.main.rootLayer.children).toHaveLength(0)
    state = state.addLayer({ layerId: 'foo', uids: ['m1', 'm2', 'm3'] })
    expect(state.main.rootLayer.moduleIds).toHaveLength(1)
    expect(state.main.rootLayer.children).toHaveLength(1)
    expect(state.main.rootLayer.children[0].uid).toBe('foo')
    expect(state.main.rootLayer.children[0].moduleIds).toHaveLength(3)
    expect(state.main.rootLayer.children[0].children).toHaveLength(0)

    state = state.addLayer({
        parentLayerId: 'foo',
        layerId: 'bar',
        uids: ['m2', 'm3'],
    })
    expect(state.main.rootLayer.moduleIds).toHaveLength(1)
    expect(state.main.rootLayer.children).toHaveLength(1)
    expect(state.main.rootLayer.children[0].uid).toBe('foo')
    expect(state.main.rootLayer.children[0].moduleIds).toHaveLength(1)
    expect(state.main.rootLayer.children[0].children).toHaveLength(1)

    expect(state.main.rootLayer.children[0].children[0].uid).toBe('bar')
    expect(state.main.rootLayer.children[0].children[0].moduleIds).toHaveLength(
        2,
    )
    expect(state.main.rootLayer.children[0].children[0].children).toHaveLength(
        0,
    )
})
