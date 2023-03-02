import { DockableTabs } from '@youwol/fv-tabs'
import { Common } from '@youwol/fv-code-mirror-editors'
import {
    attr$,
    childrenFromStore$,
    childrenAppendOnly$,
    VirtualDOM,
} from '@youwol/flux-view'
import { AppState } from '../app.state'
import { map } from 'rxjs/operators'
import { combineLatest, Observable } from 'rxjs'
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
                                (cellState) => new ReplView({ cellState }),
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
 * @category State
 */
export class CellState {
    /**
     * @group States
     */
    public readonly ideState: Common.IdeState

    /**
     * @group States
     */
    public readonly appState: AppState

    /**
     *
     * @group Observables
     */
    public readonly isLastCell$: Observable<boolean>

    constructor(params: { appState: AppState; ideState: Common.IdeState }) {
        Object.assign(this, params)
        this.isLastCell$ = combineLatest([
            this.appState.cells$,
            this.appState.projectByCells$,
        ]).pipe(
            map(([cells, projectByCells]) => {
                const index = cells.indexOf(this)
                return projectByCells.has(cells[index + 1])
            }),
        )
    }
}
/**
 * @category View
 */
export class ReplView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly cellState: CellState

    /**
     * @group States
     */
    public readonly appState: AppState
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 mb-3'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group Immutable DOM Constants
     */
    onclick: (ev: MouseEvent) => void

    constructor(params: { cellState: CellState }) {
        Object.assign(this, params)
        this.appState = this.cellState.appState
        const ideView = new Common.CodeEditorView({
            ideState: this.cellState.ideState,
            path: './repl',
            language: 'javascript',
            config: {
                extraKeys: {
                    'Ctrl-Enter': () => {
                        this.appState.execute(this.cellState).subscribe()
                    },
                },
            },
        })
        this.children = [
            {
                style: attr$(this.appState.projectByCells$, (hist) => {
                    return hist.has(this.cellState)
                        ? { opacity: 1, borderWidth: '5px' }
                        : { opacity: 0.5 }
                }),
                class: attr$(
                    this.cellState.isLastCell$,
                    (isLast): string =>
                        isLast
                            ? 'fv-border-left-success border-3'
                            : 'w-100 h-100',
                    { wrapper: (d) => `${d} w-100 h-100` },
                ),
                children: [ideView],
            },
        ]
        this.onclick = () => this.appState.selectCell(this.cellState)
    }
}
