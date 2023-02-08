import { DockableTabs } from '@youwol/fv-tabs'
import { child$, VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../app.state'
import { ImmutableTree } from '@youwol/fv-tree'
import { ProjectState } from '../../../../lib/project'

/**
 * @category View
 */
export class ProjectTab extends DockableTabs.Tab {
    constructor({ state }: { state: AppState }) {
        super({
            id: 'Project',
            title: 'Project',
            icon: '',
            content: () => {
                return {
                    style: {
                        width: '300px',
                    },
                    children: [new ProjectView({ state })],
                }
            },
        })
    }
}

/**
 * @category View
 */
export class ProjectView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly state: AppState
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { state: AppState }) {
        Object.assign(this, params)
        this.children = [
            child$(this.state.repl.project$, (project) => {
                const rootNode = createRootNode(project)
                const state = new ImmutableTree.State<NodeProjectBase>({
                    rootNode,
                })
                return new ImmutableTree.View({
                    state,
                    headerView: (state, node: NodeProjectBase) => {
                        return new NodeView({ state, node })
                    },
                })
            }),
        ]
    }
}

type NodeProjectCategory =
    | 'Node'
    | 'Project'
    | 'ModuleInstance'
    | 'Layer'
    | 'Workflow'
    | 'Macros'

/**
 * @category Nodes
 */
export abstract class NodeProjectBase extends ImmutableTree.Node {
    /**
     * @group Immutable Constants
     */
    public readonly name: string

    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'Node'

    protected constructor({
        id,
        name,
        children,
    }: {
        id: string
        name: string
        children?: NodeProjectBase[]
    }) {
        super({ id, children })
        this.name = name
    }
}

/**
 * @category Nodes
 */
export class ProjectNode extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'Project'

    constructor(params: { id: string; name: string; children }) {
        super({
            id: params.id,
            name: params.name,
            children: params.children,
        })
        Object.assign(this, params)
    }
}
/**
 * @category Nodes
 */
export class ModuleInstance extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'ModuleInstance'

    constructor(params: { id: string; name: string }) {
        super({
            id: params.id,
            name: params.name,
        })
        Object.assign(this, params)
    }
}

/**
 * @category Nodes
 */
export class Workflow extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'Workflow'

    constructor(params: { id: string; name: string; children }) {
        super({
            id: params.id,
            name: params.name,
            children: params.children,
        })
        Object.assign(this, params)
    }
}

/**
 * @category Nodes
 */
export class Macros extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'Macros'

    constructor(params: { id: string; name: string; children }) {
        super({
            id: params.id,
            name: params.name,
            children: params.children,
        })
        Object.assign(this, params)
    }
}

function createRootNode(project: ProjectState) {
    return new ProjectNode({
        id: 'Project',
        name: 'Project',
        children: [
            new Workflow({
                id: 'main',
                name: 'main',
                children: project.main.modules.map((module) => {
                    return new ModuleInstance({
                        name: module.uid,
                        id: module.uid,
                    })
                }),
            }),
            new Macros({
                id: 'macros',
                name: 'macros',
                children: project.macros.map((macro) => {
                    return new Workflow({
                        id: macro.uid,
                        name: macro.uid,
                        children: macro.modules.map((module) => {
                            return new ModuleInstance({
                                name: module.uid,
                                id: module.uid,
                            })
                        }),
                    })
                }),
            }),
        ],
    })
}

/**
 * @category View
 */
class NodeView implements VirtualDOM {
    /**
     * @group Factories
     */
    static NodeTypeFactory: Record<NodeProjectCategory, string> = {
        Node: '',
        Project: 'fas fa-rocket-launch',
        Workflow: 'fas fa-sitemap',
        ModuleInstance: 'fas fa-cube',
        Layer: 'fas fa-object-group',
        Macros: 'fas fa-play',
    }

    /**
     * @group Immutable Constants
     */
    public readonly node: NodeProjectBase

    /**
     * @group Immutable DOM Constants
     */
    public readonly class: string =
        'w-100 d-flex align-items-center my-1 fv-pointer'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: {
        state: ImmutableTree.State<NodeProjectBase>
        node: NodeProjectBase
    }) {
        Object.assign(this, params)
        this.children = [
            { class: `${NodeView.NodeTypeFactory[this.node.category]} mx-1` },
            { innerText: this.node.name },
        ]
    }
}
