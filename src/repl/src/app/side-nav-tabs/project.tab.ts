import { DockableTabs } from '@youwol/fv-tabs'
import { VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../app.state'
import { ImmutableTree } from '@youwol/fv-tree'
import { ProjectDelta, ProjectState } from '../../../../lib/project'

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
            new ImmutableTree.View({
                state: this.state.projectExplorerState,
                headerView: (state, node: NodeProjectBase) => {
                    return new NodeView({ state, node })
                },
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
    | 'Views'
    | 'View'

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
export class Layer extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'Layer'

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

/**
 * @category Nodes
 */
export class Views extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'Views'

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
export class View extends NodeProjectBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeProjectCategory = 'View'

    constructor(params: { id: string; name: string }) {
        super({
            id: params.id,
            name: params.name,
        })
        Object.assign(this, params)
    }
}
export function createLayerNode(layer) {
    return new Layer({
        id: layer.uid,
        name: layer.uid,
        children: [
            ...layer.moduleIds.map(
                (moduleId) =>
                    new ModuleInstance({
                        name: moduleId,
                        id: moduleId,
                    }),
            ),
            ...layer.children.map((l) => createLayerNode(l)),
        ],
    })
}
export function createProjectRootNode(project: ProjectState) {
    return new ProjectNode({
        id: 'Project',
        name: 'Project',
        children: [
            new Workflow({
                id: 'main',
                name: 'main',
                children: [
                    ...project.main.rootLayer.moduleIds.map(
                        (moduleId) =>
                            new ModuleInstance({
                                name: moduleId,
                                id: moduleId,
                            }),
                    ),
                    ...project.main.rootLayer.children.map((l) =>
                        createLayerNode(l),
                    ),
                ],
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
            new Views({
                id: 'views',
                name: 'views',
                children: Object.entries(project.views).map(([k]) => {
                    return new View({ id: k, name: k })
                }),
            }),
        ],
    })
}

export function processProjectUpdate({
    explorerState,
    project,
    delta,
}: {
    explorerState: ImmutableTree.State<NodeProjectBase>
    project: ProjectState
    delta: ProjectDelta
}) {
    console.log('New state', {
        explorer: explorerState,
        project,
        delta,
    })
    delta.layers.addedElements.forEach((layerId) => {
        const layer = project.main.rootLayer
            .flat()
            .find((l) => l.uid == layerId)
        const parentLayer = project.main.rootLayer.filter(
            (l) =>
                l.children.find((childLayer) => childLayer.uid == layerId) !=
                undefined,
        )

        layer.moduleIds.forEach((mid) => {
            explorerState.removeNode(mid)
        })
        explorerState.addChild(
            parentLayer[0].uid == project.main.rootLayer.uid
                ? 'main'
                : layer[0].uid,
            createLayerNode(layer),
        )
    })
    Array.from(delta.modules.addedElements)
        .filter((mdlId) => {
            return explorerState.getNode(mdlId) == undefined
        })
        .forEach((mdlUid: string) => {
            const layer = project.main.rootLayer.filter((l) =>
                l.moduleIds.includes(mdlUid),
            )
            explorerState.addChild(
                layer[0].uid == project.main.rootLayer.uid
                    ? 'main'
                    : layer[0].uid,
                new ModuleInstance({ id: mdlUid, name: mdlUid }),
            )
        })

    Array.from(delta.views.addedElements).forEach((viewId) => {
        explorerState.addChild('views', new View({ id: viewId, name: viewId }))
    })

    console.log(explorerState)
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
        Views: 'fas fa-code',
        View: 'fas fa-code',
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
