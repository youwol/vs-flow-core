import { child$, VirtualDOM } from '@youwol/flux-view'
import { AppState } from './app.state'
import { TopBannerView } from './top-banner'
import { DockableTabs } from '@youwol/fv-tabs'
import { ContentView } from './content-view/content.view'
import { map, withLatestFrom } from 'rxjs/operators'
/**
 * @category View
 * @Category Entry Point
 */
export class AppView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'h-100 w-100 d-flex flex-column fv-text-primary fv-bg-background'
    /**
     * @group Immutable DOM Constants
     */
    children: VirtualDOM[]
    /**
     * @group States
     */
    public readonly state: AppState

    constructor(params: { state: AppState }) {
        Object.assign(this, params)
        this.children = [
            new TopBannerView(),
            {
                class: 'w-100 flex-grow-1',
                style: {
                    minHeight: '0px',
                },
                children: [new MainContentView({ state: this.state })],
            },
        ]
    }
}

/**
 * @category View
 */
export class MainContentView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'h-100 w-100 d-flex'
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minHeight: '0px',
        position: 'relative',
    }
    /**
     * @group Immutable DOM Constants
     */
    children: VirtualDOM[]
    /**
     * @group States
     */
    public readonly state: AppState

    constructor(params: { state: AppState }) {
        Object.assign(this, params)
        const leftSideNavView = new DockableTabs.View({
            state: this.state.leftSideNavState,
            styleOptions: {
                initialPanelSize: '300px',
            },
        })
        const bottomSideNavView = new DockableTabs.View({
            state: this.state.bottomSideNavState,
            styleOptions: {
                initialPanelSize: '300px',
            },
        })

        this.children = [
            leftSideNavView,
            {
                class: 'flex-grow-1 h-100 d-flex flex-column',
                style: {
                    position: 'relative',
                    minWidth: '0px',
                },
                children: [
                    {
                        class: 'flex-grow-1',
                        style: {
                            minHeight: '0px',
                        },
                        children: [
                            child$(
                                this.state.project$.pipe(
                                    map((project) => project),
                                    withLatestFrom(
                                        this.state.projectExplorerState$,
                                    ),
                                ),
                                ([project, explorer]) =>
                                    new ContentView({
                                        state: this.state,
                                        project,
                                        explorer,
                                    }),
                            ),
                        ],
                    },
                    bottomSideNavView,
                ],
            },
        ]
    }
}
