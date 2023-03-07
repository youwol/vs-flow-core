import { DockableTabs } from '@youwol/fv-tabs'
import { Common } from '@youwol/fv-code-mirror-editors'
import {
    attr$,
    child$,
    childrenFromStore$,
    VirtualDOM,
} from '@youwol/flux-view'
import { AppState } from '../app.state'
import { map, scan, withLatestFrom } from 'rxjs/operators'
import { BehaviorSubject, combineLatest, Observable, ReplaySubject } from 'rxjs'
import {
    CellFunction,
    CellTrait,
    ProjectCell,
    ProjectState,
} from '../../../../lib/project'
import { JsCode } from '../../../../lib/modules/configurations/attributes'

function cellCodeView(state: AppState, cellState: CellCodeState) {
    const child = (ideView) => ({
        style: attr$(state.projectByCells$, (hist) => {
            return hist.has(cellState)
                ? {
                      opacity: 1,
                      borderWidth: '5px',
                  }
                : {
                      opacity: 0.5,
                  }
        }),
        class: attr$(
            cellState.isLastCell$,
            (isLast): string =>
                isLast ? 'fv-border-left-success border-3' : 'w-100 h-100',
            { wrapper: (d) => `${d} w-100 h-100` },
        ),
        children: [
            ideView,
            new ReplOutput({
                cellState: cellState,
            }),
        ],
    })
    return new CellWrapperView({
        cellState,
        onExe: () => {
            state.execute(cellState) //.subscribe()
        },
        language: 'javascript',
        child,
    })
}

export function cellMarkdownView(
    state: AppState,
    cellState: NotebookCellTrait,
) {
    const editionMode$ = new BehaviorSubject<'view' | 'edit'>('view')
    const child = (ideView) =>
        child$(
            editionMode$.pipe(
                withLatestFrom(cellState.ideState.updates$['./repl']),
            ),
            ([mode, file]) => {
                return mode == 'edit'
                    ? {
                          children: [ideView],
                      }
                    : {
                          innerHTML: window['marked'].parse(file.content),
                          ondblclick: () => {
                              editionMode$.next('edit')
                          },
                      }
            },
        )
    return new CellWrapperView({
        cellState,
        onExe: () => {
            editionMode$.next('view')
        },
        language: 'markdown',
        child,
    })
}
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
                    class: 'w-100 p-2 overflow-auto mx-auto',
                    style: {
                        height: '50vh',
                    },
                    children: [
                        {
                            class: 'h-100 w-75 mx-auto',
                            children: childrenFromStore$(
                                state.cells$,
                                (cellState) => {
                                    return cellState.mode == 'code'
                                        ? cellCodeView(
                                              state,
                                              cellState as CellCodeState,
                                          )
                                        : cellMarkdownView(state, cellState)
                                },
                                {
                                    orderOperator: (a, b) =>
                                        state.cells$.value.indexOf(a) -
                                        state.cells$.value.indexOf(b),
                                },
                            ),
                        },
                    ],
                }
            },
        })
    }
}

export interface NotebookCellTrait extends CellTrait {
    mode: 'code' | 'markdown'

    execute: (ProjectState) => Promise<ProjectState>

    ideState: Common.IdeState
}

export function factoryCellState(
    mode: 'markdown' | 'code',
    appState: AppState,
    content: string,
) {
    return mode == 'markdown'
        ? new CellMarkdownState({
              appState,
              content,
          })
        : new CellCodeState({
              appState,
              content,
          })
}

/**
 * @category State
 */
export class CellCodeState implements NotebookCellTrait {
    /**
     * @group ImmutableConstant
     */
    public readonly mode = 'code'

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
    public readonly output$ = new ReplaySubject<VirtualDOM | 'clear'>()

    /**
     * @group Observables
     */
    public readonly outputs$ = new Observable<VirtualDOM[]>()

    constructor(params: { appState: AppState; content: string }) {
        Object.assign(this, params)
        this.ideState = new Common.IdeState({
            files: [
                {
                    path: './repl',
                    content: params.content,
                },
            ],
            defaultFileSystem: Promise.resolve(new Map<string, string>()),
        })
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
            scan((acc, e) => (e != 'clear' ? [...acc, e] : []), []),
        )
    }

    execute(project: ProjectState): Promise<ProjectState> {
        const attrCode = new JsCode<CellFunction>({
            value: this.ideState.updates$['./repl'].value.content,
        })
        const executor = new ProjectCell({
            source: attrCode,
            environment: this.appState.environment,
        })
        this.output$.next('clear')
        executor.outputs$.subscribe((view) => {
            this.output$.next(view)
        })
        return executor.execute(project)
    }
}

/**
 * @category State
 */
export class CellMarkdownState implements NotebookCellTrait {
    /**
     * @group ImmutableConstant
     */
    public readonly mode = 'markdown'

    /**
     * @group States
     */
    public readonly ideState: Common.IdeState

    /**
     * @group States
     */
    public readonly appState: AppState

    constructor(params: { appState: AppState; content: string }) {
        Object.assign(this, params)
        this.ideState = new Common.IdeState({
            files: [
                {
                    path: './repl',
                    content: params.content,
                },
            ],
            defaultFileSystem: Promise.resolve(new Map<string, string>()),
        })
    }

    execute(project: ProjectState): Promise<ProjectState> {
        return Promise.resolve(project)
    }
}

export class CellWrapperView {
    /**
     * @group States
     */
    public readonly cellState: CellCodeState

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
     * @group Observables
     */
    public readonly hovered$: BehaviorSubject<boolean> = new BehaviorSubject(
        false,
    )

    /**
     * @group Immutable DOM Constants
     */
    public readonly onclick: (ev: MouseEvent) => void

    /**
     * @group Immutable DOM Constants
     */
    public readonly onmouseenter: (ev: MouseEvent) => void

    /**
     * @group Immutable DOM Constants
     */
    public readonly onmouseleave: (ev: MouseEvent) => void

    constructor(params: {
        cellState: NotebookCellTrait
        onExe
        language
        child
    }) {
        Object.assign(this, params)
        this.appState = this.cellState.appState
        const ideView = new Common.CodeEditorView({
            ideState: this.cellState.ideState,
            path: './repl',
            language: params.language,
            config: {
                extraKeys: {
                    'Ctrl-Enter': () => {
                        params.onExe()
                    },
                },
            },
        })
        this.children = [
            child$(this.hovered$, (hovered) => {
                return hovered
                    ? new ReplTopMenuView({
                          cellState: this.cellState,
                          appState: this.appState,
                      })
                    : { innerHTML: '&#8205; ' }
            }),
            params.child(ideView),
        ]
        this.onclick = () => this.appState.selectCell(this.cellState)
        this.onmouseenter = () => this.hovered$.next(true)
        this.onmouseleave = () => this.hovered$.next(false)
    }
}

/**
 * @category View
 */
export class ReplOutput {
    /**
     * @group States
     */
    public readonly cellState: CellCodeState
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 p-1'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { cellState: CellCodeState }) {
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
/**
 * @category View
 */
export class ReplTopMenuView {
    /**
     * @group States
     */
    public readonly appState: AppState

    /**
     * @group States
     */
    public readonly cellState: NotebookCellTrait

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 d-flex align-items-center'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { cellState: NotebookCellTrait; appState: AppState }) {
        Object.assign(this, params)
        const classIcon =
            'd-flex align-items-center rounded p-1 fv-hover-bg-background-alt fv-pointer'
        this.children = [
            {
                tag: 'select',
                children: [
                    {
                        tag: 'option',
                        innerText: 'code',
                        value: 'code',
                        selected: this.cellState.mode == 'code',
                    },
                    {
                        tag: 'option',
                        innerText: 'markdown',
                        value: 'markdown',
                        selected: this.cellState.mode == 'markdown',
                    },
                ],
                onchange: (ev) => {
                    this.appState.changeCellMode(
                        this.cellState,
                        ev.target.value,
                    )
                },
            },
            { class: 'flex-grow-1' },
            {
                class: classIcon,
                children: [
                    {
                        class: 'fas fa-plus',
                    },
                    {
                        class: 'fas fa-chevron-down',
                    },
                ],
                onclick: () => this.appState.newCell(this.cellState, 'before'),
            },
            { class: 'mx-2' },
            {
                class: classIcon,
                children: [
                    {
                        class: 'fas fa-plus',
                    },
                    {
                        class: 'fas fa-chevron-up',
                    },
                ],
                onclick: () => this.appState.newCell(this.cellState, 'after'),
            },
            { class: 'mx-2' },
            {
                class: classIcon,
                children: [
                    {
                        class: 'fas fa-trash',
                    },
                ],
                onclick: () => this.appState.deleteCell(this.cellState),
            },
        ]
    }
}
