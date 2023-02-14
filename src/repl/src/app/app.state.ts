import { Projects } from '../../../lib'
import { Environment } from './environment'
import { DockableTabs } from '@youwol/fv-tabs'
import { BehaviorSubject, ReplaySubject } from 'rxjs'
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
import { distinctUntilChanged } from 'rxjs/operators'
/**
 * @category State
 * @category Entry Point
 */
export class AppState {
    public readonly repl: Projects.Repl

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
     *
     * @group States
     */
    public readonly projectExplorerState: ImmutableTree.State<NodeProjectBase>

    constructor(params = {}) {
        Object.assign(this, params)
        this.repl = new Projects.Repl({
            environment: new Environment({ toolboxes: [] }),
        })
        const rootNode = createProjectRootNode(this.repl.project$.value.project)
        this.projectExplorerState = new ImmutableTree.State<NodeProjectBase>({
            rootNode,
        })
        this.repl.project$.subscribe(({ project, delta }) => {
            processProjectUpdate({
                explorerState: this.projectExplorerState,
                project,
                delta,
            })
        })
        this.projectExplorerState.selectedNode$.subscribe((node) => {
            node instanceof ModuleInstance && this.selectedUid$.next(node.id)
            if (node instanceof Workflow) {
                this.openTab(node)
            }
            if (node instanceof View) {
                this.openTab(node)
            }
        })
        this.selectedUid$.pipe(distinctUntilChanged()).subscribe((uid) => {
            this.projectExplorerState.selectedNode$.next(
                this.projectExplorerState.getNode(uid),
            )
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
}
