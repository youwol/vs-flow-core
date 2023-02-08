import { DockableTabs } from '@youwol/fv-tabs'
import { VirtualDOM, child$ } from '@youwol/flux-view'
import { AppState } from '../app.state'
import { ImmutableTree } from '@youwol/fv-tree'
import { ToolBox } from '../../../../lib'

/**
 * @category View
 */
export class ToolboxesTab extends DockableTabs.Tab {
    constructor({ state }: { state: AppState }) {
        super({
            id: 'Toolboxes',
            title: 'Toolboxes',
            icon: '',
            content: () => {
                return {
                    style: {
                        width: '300px',
                    },
                    children: [new ToolboxesView({ state: state })],
                }
            },
        })
    }
}

/**
 * @category View
 */
export class ToolboxesView implements VirtualDOM {
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
            child$(this.state.repl.environment.toolboxes$, (toolboxes) => {
                const rootNode = createRootNode(toolboxes)
                const state = new ImmutableTree.State<NodeToolboxesBase>({
                    rootNode,
                })
                return new ImmutableTree.View({
                    state,
                    headerView: (state, node: NodeToolboxesBase) => {
                        return new NodeView({ state, node })
                    },
                })
            }),
        ]
    }
}

export type NodeToolboxesCategory = 'Node' | 'Toolboxes' | 'Toolbox' | 'Module'

/**
 * @category Nodes
 */
export abstract class NodeToolboxesBase extends ImmutableTree.Node {
    /**
     * @group Immutable Constants
     */
    public readonly name: string

    /**
     * @group Immutable Constants
     */
    public readonly category: NodeToolboxesCategory = 'Node'

    protected constructor({
        id,
        name,
        children,
    }: {
        id: string
        name: string
        children?: NodeToolboxesBase[]
    }) {
        super({ id, children })
        this.name = name
    }
}

/**
 * @category Nodes
 */
export class ToolboxesNode extends NodeToolboxesBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeToolboxesCategory = 'Toolboxes'

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
export class ToolboxNode extends NodeToolboxesBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeToolboxesCategory = 'Toolbox'

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
export class ModuleNode extends NodeToolboxesBase {
    /**
     * @group Immutable Constants
     */
    public readonly category: NodeToolboxesCategory = 'Module'

    constructor(params: { id: string; name: string }) {
        super({
            id: params.id,
            name: params.name,
        })
        Object.assign(this, params)
    }
}

export function createRootNode(toolboxes: ToolBox[]) {
    return new ToolboxesNode({
        id: 'toolboxes',
        name: 'toolboxes',
        children: toolboxes.map((toolbox) => {
            return new ToolboxNode({
                name: toolbox.name,
                id: toolbox.uid,
                children: toolbox.modules.map((module) => {
                    return new ModuleNode({
                        name: module.declaration.typeId,
                        id: module.declaration.typeId,
                    })
                }),
            })
        }),
    })
}

/**
 * @category View
 */
export class NodeView implements VirtualDOM {
    /**
     * @group Factories
     */
    static NodeTypeFactory: Record<NodeToolboxesCategory, string> = {
        Node: '',
        Toolboxes: 'fas fa-shapes',
        Toolbox: 'fas fa-cubes',
        Module: 'fas fa-cube',
    }

    /**
     * @group Immutable Constants
     */
    public readonly node: NodeToolboxesBase

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
        state: ImmutableTree.State<NodeToolboxesBase>
        node: NodeToolboxesBase
    }) {
        Object.assign(this, params)
        this.children = [
            { class: `${NodeView.NodeTypeFactory[this.node.category]} mx-1` },
            { innerText: this.node.name },
        ]
    }
}
