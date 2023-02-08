import { DockableTabs } from '@youwol/fv-tabs'
import { Common } from '@youwol/fv-code-mirror-editors'
import { VirtualDOM } from '@youwol/flux-view'
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
                    class: 'w-100',
                    style: {
                        height: '50vh',
                    },
                    children: [new ReplView({ state })],
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
    public readonly state: AppState
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 h-100'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { state: AppState }) {
        Object.assign(this, params)

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
        const ideView = new Common.CodeEditorView({
            ideState,
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
