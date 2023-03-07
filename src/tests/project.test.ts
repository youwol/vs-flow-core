import { FlowNode } from '../lib/project'
import { RxjsFilter } from '../toolboxes/rxjs'
import { emptyProject } from './test.utils'

test('project', async () => {
    let project = emptyProject()
    const environment = project.environment
    expect(project).toBeTruthy()
    const module = await environment.instantiateModule({
        typeId: 'sphere',
    })

    project = project.addFlows([
        [new FlowNode({ module, input: 'input$', output: 'output$' })],
    ])
    expect(project.main.modules).toHaveLength(1)
})

test('project2', async () => {
    let project = emptyProject()
    const environment = project.environment
    expect(project).toBeTruthy()
    const sphere = await environment.instantiateModule({
        typeId: 'sphere',
    })
    const filter = await environment.instantiateModule({
        typeId: 'filter',
    })

    project = project.addFlows([
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
    expect(project.main.modules).toHaveLength(2)
    expect(project.main.connections).toHaveLength(1)
})

test('project layer simple', async () => {
    let project = emptyProject()
    const environment = project.environment
    expect(project).toBeTruthy()
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

    project = project.addFlows([
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
    expect(project.main.modules).toHaveLength(4)
    expect(project.main.connections).toHaveLength(3)
    expect(project.main.rootLayer.moduleIds).toHaveLength(4)
    expect(project.main.rootLayer.children).toHaveLength(0)
    project = project.addLayer({
        layerId: 'foo',
        uids: ['m1', 'm2', 'm3'],
    })
    expect(project.main.rootLayer.moduleIds).toHaveLength(1)
    expect(project.main.rootLayer.children).toHaveLength(1)
    expect(project.main.rootLayer.children[0].uid).toBe('foo')
    expect(project.main.rootLayer.children[0].moduleIds).toHaveLength(3)
    expect(project.main.rootLayer.children[0].children).toHaveLength(0)

    project = project.addLayer({
        parentLayerId: 'foo',
        layerId: 'bar',
        uids: ['m2', 'm3'],
    })
    expect(project.main.rootLayer.moduleIds).toHaveLength(1)
    expect(project.main.rootLayer.children).toHaveLength(1)
    expect(project.main.rootLayer.children[0].uid).toBe('foo')
    expect(project.main.rootLayer.children[0].moduleIds).toHaveLength(1)
    expect(project.main.rootLayer.children[0].children).toHaveLength(1)

    expect(project.main.rootLayer.children[0].children[0].uid).toBe('bar')
    expect(
        project.main.rootLayer.children[0].children[0].moduleIds,
    ).toHaveLength(2)
    expect(
        project.main.rootLayer.children[0].children[0].children,
    ).toHaveLength(0)
})

test('import', async () => {
    let project = emptyProject()
    project = await project.import('rxjs')
    project = await project.parseDag(['filter'], {})
    expect(project.main.modules).toHaveLength(1)
    expect(project.main.modules[0]).toBeInstanceOf(RxjsFilter)
})
