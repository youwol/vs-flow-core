import { AppState, ClientInterface, Item } from '../app'
import { combineLatest, Observable, of } from 'rxjs'
import { Json } from '@youwol/http-primitives'
import { map, mergeMap, take, tap } from 'rxjs/operators'

export class MockClient implements ClientInterface {
    items: Item[] = []

    constructor(params: { items: Item[] }) {
        Object.assign(this, params)
    }

    getData$(): Observable<{ items: Item[] }> {
        return of({
            items: this.items,
        })
    }

    postData$({ body }: { body: Json }): Observable<Record<string, never>> {
        this.items = body['items']
        return of({})
    }
}

export async function extractActualProperties(state: AppState) {
    return new Promise<{ items; completed; remaining }>((resolve) => {
        return combineLatest([state.items$, state.completed$, state.remaining$])
            .pipe(take(1))
            .subscribe(([items, completed, remaining]) => {
                resolve({ items, completed, remaining })
            })
    })
}

export function makeAction<TContext extends { state: AppState }>({
    action,
    expect,
}: {
    action?: (TContext) => TContext
    expect: (p: {
        items: Item[]
        completed: boolean
        remaining: Item[]
    }) => void
}) {
    return (obs: Observable<TContext>): Observable<TContext> => {
        return obs.pipe(
            map((context) => {
                return action ? action(context) : context
            }),
            mergeMap((context: TContext) => {
                return combineLatest([
                    context.state.items$,
                    context.state.completed$,
                    context.state.remaining$,
                ]).pipe(
                    take(1),
                    tap(([items, completed, remaining]) => {
                        expect({ items, completed, remaining })
                    }),
                    map(() => context),
                )
            }),
        )
    }
}
