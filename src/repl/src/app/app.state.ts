import { Projects } from '../../../lib'
import { Environment } from './environment'
import { DockableTabs } from '@youwol/fv-tabs'
import { BehaviorSubject, combineLatest, from, ReplaySubject } from 'rxjs'
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
    processProjectUpdate,
} from './side-nav-tabs'
import { ImmutableTree } from '@youwol/fv-tree'
import {
    debounceTime,
    distinctUntilChanged,
    mergeMap,
    switchMap,
} from 'rxjs/operators'
import { HttpModels } from '.'
import { AssetsGateway } from '@youwol/http-clients'
import { Common } from '@youwol/fv-code-mirror-editors'

/**
 * @category State
 * @category Entry Point
 */
export class AppState {
    public readonly repl: Projects.Repl
    /**
     * Immutable Constants
     */
    public readonly assetId: string

    /**
     * @group Observable
     */
    public readonly cells$ = new BehaviorSubject<Common.IdeState[]>([])

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
        this.cells$.next(
            params.originalReplSource.cells.map((c) => {
                return new Common.IdeState({
                    files: [
                        {
                            path: './repl',
                            content: c.content,
                        },
                    ],
                    defaultFileSystem: Promise.resolve(
                        new Map<string, string>(),
                    ),
                })
            }),
        )
        this.cells$
            .pipe(
                switchMap((ideStates) =>
                    combineLatest(ideStates.map((s) => s.updates$['./repl'])),
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
            environment: new Environment({ toolboxes: [] }),
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

    execute(code: string) {
        new Function(code)()({ repl: this.repl })
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
        const ideState = new Common.IdeState({
            files: [
                {
                    path: './repl',
                    content:
                        'return async ({repl}) => {\n\tconsole.log("REPL", repl)\n}',
                },
            ],
            defaultFileSystem: Promise.resolve(new Map<string, string>()),
        })
        this.cells$.next([...cells, ideState])
    }
}
