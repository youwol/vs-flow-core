import {
    attr$,
    children$,
    childrenFromStore$,
    VirtualDOM,
} from '@youwol/flux-view'

import { Workflow, ProjectNode, View } from '../side-nav-tabs'

import { AppState } from '../app.state'
import { WorkflowTab } from './workflow.tab'
import { ProjectState } from '../../../../lib/project'
import { ViewTab } from './view.view'
import { ImmutableTree } from '@youwol/fv-tree'

function viewFactory(
    node: ProjectNode,
    state: AppState,
    project: ProjectState,
) {
    if (node instanceof Workflow) {
        return new WorkflowTab({
            project,
            state,
        })
    }
    if (node instanceof View) {
        return new ViewTab({
            project,
            state,
            node,
        })
    }
}
/**
 * @category View
 */
export class ContentView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly state: AppState

    /**
     * @group States
     */
    public readonly project: ProjectState

    /**
     * @group States
     */
    public readonly explorer: ImmutableTree.State<ProjectNode>

    /**
     * @group Immutable DOM constants
     */
    public readonly class =
        'main-content-view w-100 h-100 d-flex flex-column fv-bg-background'

    /**
     * @group Immutable DOM constants
     */
    public readonly children

    constructor(params: {
        state: AppState
        project: ProjectState
        explorer: ImmutableTree.State<ProjectNode>
    }) {
        Object.assign(this, params)

        this.children = [
            new FilesHeaderView({ appState: this.state }),
            {
                class: 'w-100 flex-grow-1',
                style: {
                    minHeight: '0px',
                },
                children: childrenFromStore$(this.state.openTabs$, (nodeId) => {
                    const node = this.explorer.getNode(nodeId)
                    const view = viewFactory(node, this.state, this.project)
                    return {
                        class: attr$(this.state.selectedTab$, (selected) =>
                            selected == nodeId ? 'w-100 h-100' : 'd-none',
                        ),
                        children: [view],
                    }
                }),
            },
        ]
    }
}

export class FilesHeaderView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly appState: AppState

    /**
     * @group Immutable DOM constants
     */
    public readonly class: string = 'd-flex align-items-center w-100'

    /**
     * @group Immutable DOM constants
     */
    public readonly children

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
        this.children = children$(this.appState.openTabs$, (tabs) => {
            return tabs.map((tabId) => {
                return {
                    class: attr$(
                        this.appState.selectedTab$,
                        (selected): string =>
                            selected == tabId
                                ? 'fv-text-focus fv-bg-background'
                                : 'fv-text-primary fv-bg-background-alt',
                        {
                            wrapper: (d) =>
                                `${d} border px-1 d-flex align-items-center px-2 fv-pointer fv-hover-xx-lighter`,
                        },
                    ),
                    children: [
                        /*{
                            class: ProjectNodeView.NodeTypeFactory[tab.category],
                        },*/
                        { class: 'mx-1' },
                        {
                            innerText: `${tabId}`,
                        },
                        { class: 'mx-1' },
                        /*{
                            class: 'fas fa-times fv-bg-background-alt rounded p-1 fv-hover-xx-lighter',
                            onclick: (ev: MouseEvent) => {
                                this.appState.closeTab(tab)
                                ev.stopPropagation()
                            },
                        },*/
                    ],
                    onclick: () => {
                        this.appState.openTab(tabId)
                    },
                }
            })
        })
    }
}
