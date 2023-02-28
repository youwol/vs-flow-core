import { DockableTabs } from '@youwol/fv-tabs'
import { Common } from '@youwol/fv-code-mirror-editors'
import { childrenFromStore$, VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../app.state'
/**
 * @category View
 */
export class ReplTab extends DockableTabs.Tab {
    constructor({ state }: { state: AppState }) {
        super({
            id: 'REPL',
            title: 'REPL',
            icon: '',
            content: () => {
                return {
                    class: 'w-100 p-2 overflow-auto',
                    style: {
                        height: '50vh',
                    },
                    children: [
                        {
                            children: childrenFromStore$(
                                state.cells$,
                                (ideState) => new ReplView({ state, ideState }),
                            ),
                        },
                        {
                            class: 'my-3',
                        },
                        {
                            class: 'border rounded fv-bg-secondary fv-hover-xx-lighter fv-pointer p-1 ',
                            style: { width: 'fit-content' },
                            innerText: 'New cell',
                            onclick: () => state.newCell(),
                        },
                    ],
                }
            },
        })
    }
}

/**
 * @category View
 */
export class ReplView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly ideState: Common.IdeState

    /**
     * @group States
     */
    public readonly state: AppState
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 mb-3'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { state: AppState; ideState: Common.IdeState }) {
        Object.assign(this, params)

        const ideView = new Common.CodeEditorView({
            ideState: this.ideState,
            path: './repl',
            language: 'javascript',
            config: {
                extraKeys: {
                    'Ctrl-Enter': (cm) => {
                        this.state.execute(cm.getValue())
                    },
                },
            },
        })
        this.children = [ideView]
    }
}
