import { Projects } from '../../../lib'
import { Environment } from './environment'
import { DockableTabs } from '@youwol/fv-tabs'
import { BehaviorSubject, ReplaySubject } from 'rxjs'
import { ProjectTab, ReplTab, ToolboxesTab } from './side-nav-tabs'
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

    constructor(params = {}) {
        Object.assign(this, params)
        this.repl = new Projects.Repl({
            environment: new Environment({ toolboxes: [] }),
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
