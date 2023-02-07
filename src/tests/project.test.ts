import { TestEnvironment } from './environment'
import { toolbox } from './toolbox'
import { FlowNode, ProjectState } from '../lib/project/project'
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
