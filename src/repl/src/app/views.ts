import {
    attr$,
    child$,
    children$,
    Stream$,
    VirtualDOM,
} from '@youwol/flux-view'
import { BehaviorSubject, combineLatest, Observable, timer } from 'rxjs'
import { map } from 'rxjs/operators'
import { AppState, Item } from './app.state'

type FilterMode = 'All' | 'Active' | 'Completed'

/**
 * @category View
 */
export class TitleView implements VirtualDOM {
    static ClassName = 'title-view'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = `${TitleView.ClassName} text-center w-100 border rounded p-2 my-3`

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group Observable
     */
    public readonly date$ = timer(0, 1000).pipe(map(() => new Date()))

    constructor() {
        this.children = [
            {
                tag: 'h1',
                class: 'fv-text-focus',
                innerText: 'Todo',
            },
            {
                class: 'fas fa-clock',
                innerText: attr$(
                    this.date$,
                    (date) => `${date.toTimeString()}`,
                ),
            },
        ]
    }
}

/**
 * @category View
 */
export class ItemView implements VirtualDOM {
    /**
     * @group Immutable Static Constants
     */
    static ClassName = 'item-view'
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'span'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = `${ItemView.ClassName} d-flex align-items-center my-1 justify-content-between fv-pointer`
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]
    /**
     * @group States
     */
    public readonly state: AppState
    /**
     * @group Immutable Constants
     */
    public readonly item: Item
    /**
     * @group Observables
     */
    private readonly editing$ = new BehaviorSubject<boolean>(false)

    constructor(
        item: { id: number; name: string; done: boolean },
        state: AppState,
    ) {
        Object.assign(this, { item, state })

        const baseClass =
            'item-view-toggle fv-color-primary fv-hover-color-focus p-2 rounded-circle fv-text-success'
        this.children = [
            {
                class: baseClass + (item.done ? ' fas fa-check' : ''),
                style: { width: '35px', height: '35px' },
                onclick: () => state.toggleItem(item.id),
            },
            child$(
                this.editing$,
                (editing: boolean) =>
                    editing ? this.editionView() : this.presentationView(),
                {
                    sideEffects: (
                        _,
                        elem: HTMLSpanElement | HTMLInputElement,
                    ) => elem.focus(),
                },
            ),
            {
                class: 'item-view-remove fas fa-times fv-text-error mx-2 p-1 fv-hover-opacity',
                onclick: () => state.deleteItem(item.id),
            },
        ]
    }

    presentationView(): VirtualDOM {
        return {
            tag: 'span',
            class: `presentation-view px-2 user-select-none ${
                this.item.done ? 'fv-text-disabled' : 'fv-text-focus'
            }`,
            style: { 'text-decoration': this.item.done ? 'line-through' : '' },
            innerText: this.item.name,
            ondblclick: () => this.editing$.next(true),
        }
    }

    editionView(): VirtualDOM {
        return {
            tag: 'input',
            type: 'text',
            class: 'edition-view',
            value: this.item.name,
            onclick: (ev) => ev.stopPropagation(),

            onkeypress: (ev) => {
                if (ev.key == 'Enter') {
                    this.state.setName(this.item.id, ev.target.value)
                }
            },
            onblur: (ev) => this.state.setName(this.item.id, ev.target.value),
        }
    }
}

/**
 * @category View
 */
export class ItemsView implements VirtualDOM {
    /**
     * @group Immutable Static Constants
     */
    static ClassName = 'items-view'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = `${ItemsView.ClassName} border rounded p-2 m-2 flex-grow-1 overflow-auto`
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        'min-height': '200px',
    }
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: Stream$<Item[], VirtualDOM[]>

    private filters: Record<FilterMode, (item: Item) => boolean> = {
        All: () => true,
        Active: (item) => !item.done,
        Completed: (item) => item.done,
    }

    constructor(state: AppState, filterMode$: Observable<FilterMode>) {
        const selectedItems$ = combineLatest([state.items$, filterMode$]).pipe(
            map(([items, mode]) =>
                items.filter((item) => this.filters[mode](item)),
            ),
        )

        this.children = children$(selectedItems$, (items) =>
            items.map((item) => new ItemView(item, state)),
        )
    }
}

/**
 * @category View
 */
export class NewItemView implements VirtualDOM {
    static ClassName = 'new-item-view'
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'header'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = `${NewItemView.ClassName} d-flex align-items-center my-3 justify-content-around`

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        fontSize: 'x-large',
    }

    constructor(state: AppState) {
        this.children = [
            {
                tag: 'i',
                class: attr$(
                    state.completed$,
                    (completed): string =>
                        completed ? 'fv-text-disable' : 'fv-text-focus',
                    {
                        wrapper: (d) =>
                            `${d} new-item-view-toggle-all fas fa-chevron-down p-2 fv-pointer fv-color-primary rounded-circle`,
                    },
                ),
                onclick: () => state.toggleAll(),
            },
            {
                tag: 'input',
                autofocus: 'autofocus',
                autocomplete: 'off',
                placeholder: 'What needs to be done?',
                class: 'new-todo px-2',
                onkeypress: (ev) => {
                    ev.key == 'Enter' &&
                        state.addItem(ev.target.value) &&
                        (ev.target.value = '')
                },
            },
        ]
    }
}

/**
 * @category View
 */
export class FooterView implements VirtualDOM {
    /**
     * @group Immutable Static Constants
     */
    static ClassName = 'footer-item-view'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = `${FooterView.ClassName} d-flex align-items-center px-3 border-top py-2 text-secondary`

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(state: AppState, filterMode$: BehaviorSubject<FilterMode>) {
        const class$ = (target) =>
            attr$(
                filterMode$,
                (mode): string =>
                    mode == target
                        ? 'fv-text-focus fv-color-primary rounded px-1'
                        : 'fv-text-disabled',
                {
                    wrapper: (d) =>
                        `${target} ${d} fv-pointer mx-2 fv-hover-text-enabled`,
                },
            )

        this.children = [
            {
                tag: 'span',
                innerText: attr$(
                    state.remaining$,
                    (items: Item[]): string => `${items.length}`,
                    {
                        wrapper: (d) => `${d} items left`,
                    },
                ),
            },
            {
                class: 'd-flex align-items-center mx-auto',
                children: [
                    {
                        tag: 'i',
                        class: 'fas fa-filter px-2',
                    },
                    {
                        tag: 'i',
                        innerText: 'All',
                        class: class$('All'),
                        onclick: () => filterMode$.next('All'),
                    },
                    {
                        tag: 'i',
                        innerText: 'Active',
                        class: class$('Active'),
                        onclick: () => filterMode$.next('Active'),
                    },
                    {
                        tag: 'i',
                        innerText: 'Completed',
                        class: class$('Completed'),
                        onclick: () => filterMode$.next('Completed'),
                    },
                ],
            },
        ]
    }
}

/**
 * @category View
 * @category Entry Point
 */
export class AppView implements VirtualDOM {
    static ClassName = 'app-view'
    public readonly class = `${AppView.ClassName} p-3 w-100 h-100 fv-bg-background fv-text-primary d-flex flex-column rounded`
    public readonly children: VirtualDOM[]
    public readonly filterMode$ = new BehaviorSubject<FilterMode>('All')
    public readonly state: AppState
    constructor(params: { state: AppState }) {
        Object.assign(this, params)
        this.children = [
            new TitleView(),
            new NewItemView(this.state),
            new ItemsView(this.state, this.filterMode$),
            new FooterView(this.state, this.filterMode$),
        ]
    }
}
