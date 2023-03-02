import { Projects } from '../../../lib'
import { Environment } from './environment'
import { DockableTabs } from '@youwol/fv-tabs'
import {
    BehaviorSubject,
    combineLatest,
    from,
    Observable,
    of,
    ReplaySubject,
} from 'rxjs'
import { downloadZip } from 'client-zip'
import {
    ProjectTab,
    ReplTab,
    ToolboxesTab,
    ProjectNode,
    NodeProjectBase,
    ModuleInstance,
    createProjectRootNode,
    Workflow,
    View,
    CellState,
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
    take,
} from 'rxjs/operators'
import { HttpModels } from '.'
import { AssetsGateway } from '@youwol/http-clients'
import { Common } from '@youwol/fv-code-mirror-editors'
import { ProjectState } from '../../../lib/project'

import { Workflow as WfModel } from '../../../lib/workflows'

type ProjectByCells = Map<CellState, ProjectState>
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
    public readonly repl: Projects.Repl

    /**
     * Immutable Constants
     */
    public readonly assetId: string

    /**
     * @group Observable
     */
    public readonly cells$ = new BehaviorSubject<CellState[]>([])

    /**
     @group Observable
     */
    public readonly projectByCells$ = new BehaviorSubject(
        new Map<CellState, ProjectState>(),
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
    public readonly openTabs$ = new BehaviorSubject<string[]>([])

    /**
     * @group Observables
     */
    public readonly selectedTab$ = new BehaviorSubject<string>(undefined)

    /**
     *
     * @group States
     */
    public readonly projectExplorerState$: Observable<
        ImmutableTree.State<NodeProjectBase>
    >

    constructor(params: {
        assetId: string
        originalReplSource: HttpModels.ReplSource
    }) {
        Object.assign(this, params)
        const assetsGtwClient = new AssetsGateway.Client()
        const environment = new Environment({ toolboxes: [] })
        const emptyProject = new ProjectState({
            main: new WfModel(),
            macros: [],
            environment,
        })
        this.lastAvailableProject = emptyProject
        this.project$ = new BehaviorSubject(emptyProject)

        this.cells$.next(
            params.originalReplSource.cells.map((c, i) => {
                const cell = new CellState({
                    appState: this,
                    ideState: new Common.IdeState({
                        files: [
                            {
                                path: './repl',
                                content: c.content,
                            },
                        ],
                        defaultFileSystem: Promise.resolve(
                            new Map<string, string>(),
                        ),
                    }),
                })
                if (i == 0) {
                    const initialHistory = new Map([[cell, emptyProject]])
                    this.projectByCells$.next(initialHistory)
                }
                return cell
            }),
        )
        this.cells$
            .pipe(
                switchMap((cells) =>
                    combineLatest(
                        cells.map((cell) => cell.ideState.updates$['./repl']),
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

        this.repl = new Projects.Repl({
            environment,
            project$: this.project$,
        })
        this.projectExplorerState$ = this.project$.pipe(
            filter((p) => p != undefined),
            map((project) => {
                const rootNode = createProjectRootNode(project)
                return new ImmutableTree.State<NodeProjectBase>({
                    rootNode,
                })
            }),
            shareReplay({ bufferSize: 1, refCount: true }),
        )
        this.projectExplorerState$
            .pipe(switchMap((explorerState) => explorerState.selectedNode$))
            .subscribe((node) => {
                node instanceof ModuleInstance &&
                    this.selectedUid$.next(node.id)
                if (node instanceof Workflow) {
                    this.openTab(node.id)
                }
                if (node instanceof View) {
                    this.openTab(node.id)
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
    }

    execute(cell: CellState): Observable<{
        history: ProjectByCells
        project: ProjectState
    }> {
        const index = this.cells$.value.indexOf(cell)
        return this.projectByCells$.pipe(
            take(1),
            mergeMap((history) => {
                if (!history.has(cell)) {
                    const cell = this.cells$.value[index - 1]
                    return this.execute(cell)
                }
                return of(history.get(cell)).pipe(
                    map((project) => ({ history, project })),
                )
            }),
            mergeMap(({ project, history }) => {
                this.project$.next(project)
                return from(
                    new Function(ideState.updates$['./repl'].value.content)()({
                        repl: this.repl,
                    }),
                ).pipe(
                    mergeMap(() => this.project$),
                    take(1),
                    map((project) => ({ history, project })),
                )
            }),
            map(({ history, project }) => {
                this.lastAvailableProject = project
                if (index == this.cells$.value.length - 1) {
                    return
                }
                const newHistory = new Map()
                this.cells$.value.slice(0, index + 1).forEach((cell) => {
                    newHistory.set(cell, history.get(cell))
                })
                const next = this.cells$.value[index + 1]
                newHistory.set(next, project)
                this.projectByCells$.next(newHistory)
                return { history: newHistory, project }
            }),
        )
    }

    openTab(nodeId: string) {
        const opened = this.openTabs$.value
        if (!opened.includes(nodeId)) {
            this.openTabs$.next([...opened, nodeId])
        }
        this.selectedTab$.next(nodeId)
    }

    closeTab(node: ProjectNode) {
        const opened = this.openTabs$.value.filter((v) => v != node.id)
        if (opened.length != this.openTabs$.value.length) {
            this.openTabs$.next(opened)
        }
        if (this.selectedTab$.value == node.id) {
            this.selectedTab$.next(opened[0])
        }
    }

    newCell() {
        const cells = this.cells$.value
        const cell = new CellState({
            appState: this,
            ideState: new Common.IdeState({
                files: [
                    {
                        path: './repl',
                        content:
                            'return async ({repl}) => {\n\tconsole.log("REPL", repl)\n}',
                    },
                ],
                defaultFileSystem: Promise.resolve(new Map<string, string>()),
            }),
        })
        this.cells$.next([...cells, cell])
    }

    selectCell(cell: CellState) {
        const indexCell = this.cells$.value.indexOf(cell)
        const nextCell = this.cells$.value[indexCell + 1]
        const state = this.projectByCells$.value.get(nextCell)
        state != this.project$.value && this.project$.next(state)
    }
}
