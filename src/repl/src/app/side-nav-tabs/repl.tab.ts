import { DockableTabs } from '@youwol/fv-tabs'
import { Common } from '@youwol/fv-code-mirror-editors'
import { attr$, childrenFromStore$, VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../app.state'
import { map, scan, tap } from 'rxjs/operators'
import { combineLatest, forkJoin, Observable, ReplaySubject } from 'rxjs'
import { ExecutionCell } from '../../../../lib/project'
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
     * @group Observables
     */
    public readonly isLastCell$: Observable<boolean>

    /**
     * @group Observables
     */
    public readonly output$ = new ReplaySubject<VirtualDOM | false>()

    /**
     * @group Observables
     */
    public readonly outputs$ = new Observable<VirtualDOM[]>()

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
        this.outputs$ = this.output$.pipe(
            scan((acc, e) => (e ? [...acc, e] : []), []),
        )
    }

    execute(): Observable<VirtualDOM> {
        const executor = new ExecutionCell({
            source: this.ideState.updates$['./repl'].value.content,
            repl: this.appState.repl,
        })
        const out$ = executor.execute()
        this.output$.next(false)
        return forkJoin([
            out$.pipe(
                tap((view) => {
                    this.output$.next(view)
                }),
            ),
        ])
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
                children: [
                    ideView,
                    new ReplOutput({ cellState: this.cellState }),
                ],
            },
        ]
        this.onclick = () => this.appState.selectCell(this.cellState)
    }
}
/**
 * @category View
 */
export class ReplOutput {
    /**
     * @group States
     */
    public readonly cellState: CellState
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 p-1'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { cellState: CellState }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'pre',
                class: 'w-100 fv-text-primary',
                style: {
                    marginBottom: '0px',
                },
                children: childrenFromStore$(
                    this.cellState.outputs$.pipe(map((vDom) => vDom)),
                    (vDom) => vDom,
                ),
            },
        ]
    }
}
