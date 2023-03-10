import { Environment } from './environments'
import { DockableTabs } from '@youwol/fv-tabs'
import {
    BehaviorSubject,
    combineLatest,
    from,
    Observable,
    ReplaySubject,
} from 'rxjs'
import { downloadZip } from 'client-zip'
import {
    ProjectTab,
    ReplTab,
    ToolboxesTab,
    NodeProjectBase,
    ModuleInstance,
    createProjectRootNode,
    Workflow,
    View,
    CellCodeState,
    NotebookCellTrait,
    factoryCellState,
} from './side-nav-tabs'
import { ImmutableTree } from '@youwol/fv-tree'
import {
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    mergeMap,
    shareReplay,
    switchMap,
    tap,
} from 'rxjs/operators'
import { HttpModels } from '.'
import { AssetsGateway } from '@youwol/http-clients'
import { ProjectState, BatchCells } from '../../../lib/project'

import { Workflow as WfModel } from '../../../lib/workflows'

type ProjectByCells = Map<NotebookCellTrait, ProjectState>

export type TabIdentifier = {
    category: string
    id: string
    name: string
}
/**
 * @category State
 * @category Entry Point
 */
export class AppState {
    /**
     * @group Observable
     */
    public readonly project$: BehaviorSubject<ProjectState>

    /**
     * Immutable Constants
     */
    public readonly assetId: string

    /**
     * @group Observable
     */
    public readonly cells$ = new BehaviorSubject<NotebookCellTrait[]>([])

    /**
     @group Observable
     */
    public readonly projectByCells$ = new BehaviorSubject(
        new Map<NotebookCellTrait, ProjectState>(),
    )

    /**
     * @group MutableVariable
     * @private
     */
    public lastAvailableProject: ProjectState

    /**
     * @group States
     */
    public readonly bottomSideNavState: DockableTabs.State
    /**
     * @group States
     */
    public readonly leftSideNavState: DockableTabs.State

    /**
     * @group Observable
     */
    public readonly selectedUid$ = new ReplaySubject<string>(1)

    /**
     * @group Observable
     */
    public readonly openTabs$ = new BehaviorSubject<TabIdentifier[]>([])

    /**
     * @group Observables
     */
    public readonly selectedTab$ = new BehaviorSubject<TabIdentifier>(undefined)

    /**
     *
     * @group States
     */
    public readonly projectExplorerState$: Observable<
        ImmutableTree.State<NodeProjectBase>
    >

    public readonly emptyProject: ProjectState
    public readonly environment: Environment = new Environment({
        toolboxes: [],
    })

    constructor(params: {
        assetId: string
        originalReplSource: HttpModels.ReplSource
    }) {
        Object.assign(this, params)
        const assetsGtwClient = new AssetsGateway.Client()
        this.emptyProject = new ProjectState({
            main: new WfModel(),
            macros: [],
            environment: this.environment,
        })
        this.lastAvailableProject = this.emptyProject
        this.project$ = new BehaviorSubject(this.emptyProject)
        let prev = undefined
        const history = new Map()
        this.cells$.next(
            params.originalReplSource.cells.map((c, i) => {
                const cell = factoryCellState(c.mode, this, c.content)
                if (i == 0) {
                    history.set(cell, this.emptyProject)
                }
                if (i > 0 && prev && history.get(prev)) {
                    history.set(cell, history.get(prev))
                }
                if (c.mode == 'markdown') {
                    prev = cell
                } else {
                    prev = undefined
                }
                return cell
            }),
        )
        this.projectByCells$.next(history)
        this.cells$
            .pipe(
                switchMap((cells) =>
                    combineLatest(
                        cells.map((cell) =>
                            cell.ideState.updates$['./repl'].pipe(
                                map((file) => ({
                                    mode: cell.mode,
                                    content: file.content,
                                })),
                            ),
                        ),
                    ),
                ),
                debounceTime(2000),
                mergeMap((cells) => {
                    const source = {
                        name: 'source.json',
                        lastModified: new Date(),
                        input: JSON.stringify({ cells }),
                    }
                    return from(downloadZip([source]).blob())
                }),
                mergeMap((blob) => {
                    return assetsGtwClient.assets.addZipFiles$({
                        assetId: this.assetId,
                        body: { content: blob },
                    })
                }),
            )
            .subscribe((v) => {
                console.log('Saved', v)
            })

        this.projectExplorerState$ = this.project$.pipe(
            filter((p) => p != undefined),
            map((project) => {
                const rootNode = createProjectRootNode(project)
                return {
                    explorer: new ImmutableTree.State<NodeProjectBase>({
                        rootNode,
                        expandedNodes: [rootNode.id, rootNode.children[0].id],
                    }),
                    rootNode,
                }
            }),
            tap(({ explorer, rootNode }) => {
                explorer.selectedNode$.next(rootNode.children[0])
                this.openTabs$.value.forEach((tab) => {
                    if (!explorer.getNode(tab.id)) {
                        this.closeTab(tab)
                    }
                })
            }),
            map(({ explorer }) => explorer),
            shareReplay({ bufferSize: 1, refCount: true }),
        )
        this.projectExplorerState$
            .pipe(switchMap((explorerState) => explorerState.selectedNode$))
            .subscribe((node) => {
                node instanceof ModuleInstance &&
                    this.selectedUid$.next(node.id)
                if (node instanceof Workflow) {
                    this.openTab(node)
                }
                if (node instanceof View) {
                    this.openTab(node)
                }
            })
        combineLatest([
            this.selectedUid$.pipe(distinctUntilChanged()),
            this.projectExplorerState$,
        ]).subscribe(([uid, explorer]) => {
            explorer.selectedNode$.next(explorer.getNode(uid))
        })

        this.bottomSideNavState = new DockableTabs.State({
            disposition: 'bottom',
            viewState$: new BehaviorSubject<DockableTabs.DisplayMode>('pined'),
            tabs$: new BehaviorSubject([new ReplTab({ state: this })]),
            selected$: new BehaviorSubject<string>('REPL'),
            persistTabsView: true,
        })
        this.leftSideNavState = new DockableTabs.State({
            disposition: 'left',
            viewState$: new BehaviorSubject<DockableTabs.DisplayMode>('pined'),
            tabs$: new BehaviorSubject([
                new ProjectTab({ state: this }),
                new ToolboxesTab({ state: this }),
            ]),
            selected$: new BehaviorSubject<string>('Project'),
        })
        if (params.originalReplSource.cells.length == 0) {
            this.newCell(undefined, 'before')
        }
    }

    execute(cell: NotebookCellTrait): Promise<{
        history: ProjectByCells
        project: ProjectState
    }> {
        const index = this.cells$.value.indexOf(cell)
        const executingCells = this.cells$.value.slice(0, index + 1)
        const remainingCells = this.cells$.value.slice(index + 1)

        const batch = new BatchCells({
            cells: executingCells,
            projectsStore$: this.projectByCells$,
        })
        return batch.execute(this.emptyProject).then((project) => {
            this.project$.next(project)
            const newHistory = new Map(this.projectByCells$.value)
            remainingCells.forEach((cell) => {
                newHistory.delete(cell)
            })
            if (index < this.cells$.value.length - 1) {
                newHistory.set(this.cells$.value[index + 1], project)
            }
            this.projectByCells$.next(newHistory)
            return {
                history: this.projectByCells$.value,
                project,
            }
        })
    }

    openTab(node: NodeProjectBase) {
        const opened = this.openTabs$.value
        const nodeId = {
            id: node.id,
            category: node.category,
            name: node.name,
        }
        if (!opened.find((n) => n.id == nodeId.id)) {
            this.openTabs$.next([...opened, nodeId])
        }
        this.selectedTab$.next(nodeId)
    }

    closeTab(node: TabIdentifier) {
        const opened = this.openTabs$.value.filter(({ id }) => id != node.id)
        if (opened.length != this.openTabs$.value.length) {
            this.openTabs$.next(opened)
        }
        if (this.selectedTab$.value.id == node.id) {
            this.selectedTab$.next(opened[0])
        }
    }

    newCell(cellRef: NotebookCellTrait, where: 'after' | 'before') {
        const cells = this.cells$.value
        const newCell = new CellCodeState({
            appState: this,
            content:
                'return async ({repl, cell, env, env3d}) => {\n\tconsole.log("REPL", repl)\n}',
        })
        const indexInsert =
            where == 'after'
                ? cells.indexOf(cellRef)
                : cells.indexOf(cellRef) + 1
        const newCells = [...cells]
        newCells.splice(indexInsert, 0, newCell)
        const newMaps = new Map(this.projectByCells$.value)
        newMaps.set(newCell, newMaps.get(cells[indexInsert]))
        newMaps.delete(cells[indexInsert])
        this.projectByCells$.next(newMaps)
        this.cells$.next(newCells)
    }

    deleteCell(cell?: NotebookCellTrait) {
        const cells = this.cells$.value
        const newCells = cells.filter((c) => c != cell)

        this.cells$.next(newCells)
        const projectByCells = this.projectByCells$.value
        if (projectByCells.has(cell)) {
            const newMaps = new Map(this.projectByCells$.value)
            newMaps.delete(cell)
            this.projectByCells$.next(newMaps)
        }
    }

    selectCell(cell: NotebookCellTrait) {
        const indexCell = this.cells$.value.indexOf(cell)
        const nextCell = this.cells$.value[indexCell + 1]
        const state = this.projectByCells$.value.get(nextCell)
        state != this.project$.value && this.project$.next(state)
    }

    changeCellMode(cell: NotebookCellTrait, mode: 'code' | 'markdown') {
        const newCell = factoryCellState(
            mode,
            this,
            cell.ideState.updates$['./repl'].value.content,
        )
        const newCells = this.cells$.value.map((c) => (c == cell ? newCell : c))
        this.cells$.next(newCells)
        const projectByCells = this.projectByCells$.value
        if (projectByCells.has(cell)) {
            const newMaps = new Map(this.projectByCells$.value)
            newMaps.set(newCell, newMaps.get(cell))
            newMaps.delete(cell)
            this.projectByCells$.next(newMaps)
        }
    }
}
