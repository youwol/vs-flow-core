import { AppState, Item } from '../app'
import { of } from 'rxjs'
import { extractActualProperties, makeAction, MockClient } from './common'

test('scenario add & toggle items', async () => {
    /**
     * Testing state exposing only observables requires at some point
     * to retrieve the actual values of properties.
     *
     * In this example, an 'extractProperties' promise is used, it serves as 'synchronization point'.
     */
    const client = new MockClient({
        items: [{ id: 0, name: 'test-item-0', done: false }],
    })

    const state = new AppState({ client })
    const s0 = await extractActualProperties(state)

    expect(s0.items).toHaveLength(1)
    expect(s0.completed).toBeFalsy()
    expect(s0.remaining).toHaveLength(1)

    const item = state.addItem('item 2')
    const s1 = await extractActualProperties(state)

    expect(s1.items).toHaveLength(2)
    expect(s1.completed).toBeFalsy()
    expect(s1.remaining).toHaveLength(2)

    state.toggleItem(item.id)
    const s2 = await extractActualProperties(state)

    expect(s2.completed).toBeFalsy()
    expect(s2.remaining).toHaveLength(1)

    state.toggleItem(0)
    const s3 = await extractActualProperties(state)

    expect(s3.completed).toBeTruthy()
    expect(s3.remaining).toHaveLength(0)

    state.toggleAll()
    const s4 = await extractActualProperties(state)
    expect(s4.completed).toBeFalsy()
    expect(s4.remaining).toHaveLength(2)
})

// eslint-disable-next-line jest/no-done-callback -- more readable that way
test('scenario rename & delete items', (done) => {
    /**
     * This test illustrates how to use a rxjs pipeline to describe the multiple steps of the scenario.
     */

    /**
     * This class is used to store data as the test of the scenario proceed
     */
    class TestContext {
        state: AppState
        item?: Item
        constructor(params: { state: AppState; item?: Item }) {
            Object.assign(this, params)
        }
    }

    const client = new MockClient({
        items: [{ id: 0, name: 'test-item-0', done: false }],
    })

    const state = new AppState({ client })

    of(new TestContext({ state }))
        .pipe(
            makeAction({
                action: (context) => {
                    const item = state.addItem('test-item-1')
                    return new TestContext({ ...context, item })
                },
                expect: ({ items, completed, remaining }) => {
                    expect(items).toHaveLength(2)
                    expect(completed).toBeFalsy()
                    expect(remaining).toHaveLength(2)
                },
            }),
            makeAction({
                action: (context) => {
                    state.deleteItem(context.item.id)
                    return context
                },
                expect: ({ items, completed, remaining }) => {
                    expect(items).toHaveLength(1)
                    expect(completed).toBeFalsy()
                    expect(remaining).toHaveLength(1)
                },
            }),
            makeAction({
                action: (context) => {
                    state.setName(0, 'test-item-0-renamed')
                    return context
                },
                expect: ({ items }) => {
                    expect(items).toHaveLength(1)
                    expect(items[0].name).toBe('test-item-0-renamed')
                },
            }),
            makeAction({
                action: (context) => {
                    state.deleteItem(0)
                    return context
                },
                expect: ({ items, completed, remaining }) => {
                    expect(items).toHaveLength(0)
                    expect(completed).toBeTruthy()
                    expect(remaining).toHaveLength(0)
                },
            }),
        )
        .subscribe(() => done())
})
