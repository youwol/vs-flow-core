import {
    attr$,
    child$,
    children$,
    childrenFromStore$,
    VirtualDOM,
} from '@youwol/flux-view'

import { ProjectNode } from '../side-nav-tabs'

import { AppState, TabIdentifier } from '../app.state'
import { ProjectState } from '../../../../lib/project'
import { ImmutableTree } from '@youwol/fv-tree'
import { WorkflowTab } from './workflow.tab'
import { filter, map, take } from 'rxjs/operators'
import { ViewTab } from './view.view'
import { combineLatest } from 'rxjs'

function viewFactory(nodeId: TabIdentifier, state: AppState) {
    if (nodeId.category == 'Workflow') {
        return new WorkflowTab({
            state,
        })
    }

    if (nodeId.category == 'View') {
        return child$(
            combineLatest([state.project$, state.projectExplorerState$]).pipe(
                map(([project, explorer]) => ({
                    node: explorer.getNode(nodeId.id),
                    project,
                })),
                filter(({ node }) => node != undefined),
            ),
            ({ project, node }) => {
                return new ViewTab({
                    project,
                    state,
                    node,
                })
            },
        )
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

    constructor(params: { state: AppState }) {
        Object.assign(this, params)

        this.children = [
            new FilesHeaderView({ appState: this.state }),
            {
                class: 'w-100 flex-grow-1',
                style: {
                    minHeight: '0px',
                },
                children: childrenFromStore$(
                    this.state.openTabs$,
                    (nodeId) => {
                        const view = viewFactory(nodeId, this.state)
                        return {
                            class: attr$(this.state.selectedTab$, (selected) =>
                                selected.id == nodeId.id
                                    ? 'w-100 h-100'
                                    : 'd-none',
                            ),
                            children: [view],
                        }
                    },
                    { comparisonOperator: (e0, e1) => e0.id == e1.id },
                ),
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
                            selected.id == tabId.id
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
                            innerText: tabId.name,
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
                        this.appState.projectExplorerState$
                            .pipe(take(1))
                            .subscribe((explorer) => {
                                const node = explorer.getNode(tabId.id)
                                this.appState.openTab(node)
                            })
                    },
                }
            })
        })
    }
}
