import { BehaviorSubject, Observable } from 'rxjs'
import { map, mergeMap, skip } from 'rxjs/operators'
import { CdnSessionsStorage } from '@youwol/http-clients'
import {
    Json,
    raiseHTTPErrors,
    CallerRequestOptions,
} from '@youwol/http-primitives'
import { setup } from '../auto-generated'

/**
 * @category Interface
 */
export interface Item {
    id: number
    name: string
    done: boolean
}

/**
 * @category HTTP
 */
export interface ClientInterface {
    getData$({
        packageName,
        dataName,
        callerOptions,
    }: {
        packageName: string
        dataName: string
        callerOptions?: CallerRequestOptions
    }): Observable<{ items: Item[] }>

    postData$({
        packageName,
        dataName,
        body,
    }: {
        packageName: string
        dataName: string
        body: Json
    }): Observable<Record<string, never>>
}

/**
 * @category State
 * @category Entry Point
 */
export class AppState {
    /**
     * @group Immutable Static Constants
     */
    static STORAGE_KEY = 'todos'

    /**
     * @group HTTP
     */
    public readonly client = new CdnSessionsStorage.Client()

    /**
     * @group Observables
     */
    public readonly items$: Observable<Item[]>

    /**
     * @group Observables
     */
    public readonly completed$: Observable<boolean>

    /**
     * @group Observables
     */
    public readonly remaining$: Observable<Item[]>

    private readonly __items$ = new BehaviorSubject<Item[]>([])

    constructor(params: { client?: ClientInterface } = {}) {
        Object.assign(this, params)
        this.items$ = this.__items$.asObservable()
        this.client
            .getData$({
                packageName: setup.name,
                dataName: AppState.STORAGE_KEY,
            })
            .pipe(
                raiseHTTPErrors(),
                map((d) => d as unknown as { items: Item[] }),
            )
            .subscribe((d) => {
                this.__items$.next(d.items ? d.items : [])
            })

        this.__items$
            .pipe(
                skip(1),
                mergeMap((items) =>
                    this.client.postData$({
                        packageName: setup.name,
                        dataName: AppState.STORAGE_KEY,
                        body: { items } as unknown as Json,
                    }),
                ),
            )
            .subscribe()

        this.__items$.subscribe((items) => {
            localStorage.setItem(AppState.STORAGE_KEY, JSON.stringify(items))
        })
        this.completed$ = this.__items$.pipe(
            map((items) => items.reduce((acc, item) => acc && item.done, true)),
        )
        this.remaining$ = this.__items$.pipe(
            map((items) => items.filter((item) => !item.done)),
        )
    }

    toggleAll() {
        const completed = this.getItems().reduce(
            (acc, item) => acc && item.done,
            true,
        )
        this.__items$.next(
            this.getItems().map((item) => ({
                id: item.id,
                name: item.name,
                done: !completed,
            })),
        )
    }

    addItem(name) {
        const item = { id: Date.now(), name, done: false }
        this.__items$.next([...this.getItems(), item])
        return item
    }

    deleteItem(id) {
        this.__items$.next(this.getItems().filter((item) => item.id != id))
    }

    toggleItem(id) {
        const items = this.getItems().map((item) =>
            item.id == id
                ? { id: item.id, name: item.name, done: !item.done }
                : item,
        )
        this.__items$.next(items)
    }

    setName(id, name) {
        const items = this.getItems().map((item) =>
            item.id == id ? { id: item.id, name, done: item.done } : item,
        )
        this.__items$.next(items)
    }

    private getItems() {
        return this.__items$.getValue()
    }
}
