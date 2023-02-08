import {
    AppState,
    AppView,
    FooterView,
    ItemsView,
    ItemView,
    NewItemView,
} from '../app'
import { extractActualProperties, MockClient } from './common'
import { render } from '@youwol/flux-view'

beforeEach(() => {
    document.body.textContent = ''
})

test('on-load does insert the view in the DOM', async () => {
    await import('../app/on-load')
    const appView: AppView & HTMLElement = document.querySelector(
        `.${AppView.ClassName}`,
    )
    expect(appView).toBeTruthy()
})

test('views with a complete scenario', async () => {
    const client = new MockClient({
        items: [
            { id: 0, name: 'test-item-0', done: false },
            { id: 1, name: 'test-item-1', done: true },
        ],
    })

    const state = new AppState({ client })
    const view = new AppView({ state })

    //----------------
    // Make sure the root view (AppView) is displayed
    //----------------

    const div = render(view)
    document.body.appendChild(div)
    const appView: AppView & HTMLElement = document.querySelector(
        `.${AppView.ClassName}`,
    )

    expect(appView).toBeTruthy()
    expect(appView.filterMode$.value).toBe('All')

    //----------------
    // Test the view of items container
    //----------------

    const itemsViewContainer: ItemsView & HTMLElement = document.querySelector(
        `.${ItemsView.ClassName}`,
    )

    expect(itemsViewContainer).toBeTruthy()
    expect([...itemsViewContainer.children]).toHaveLength(2)

    let itemsView: NodeListOf<ItemView & HTMLElement> =
        document.querySelectorAll(`.${ItemView.ClassName}`)
    expect([...itemsView]).toHaveLength(2)
    expect(itemsView[0].item).toEqual({
        id: 0,
        name: 'test-item-0',
        done: false,
    })

    //----------------
    // Test toggle on first item using the state
    //----------------

    state.toggleItem(0)
    itemsView = document.querySelectorAll(`.${ItemView.ClassName}`)
    expect([...itemsView]).toHaveLength(2)
    expect(itemsView[0].item.done).toBeTruthy()

    //----------------
    // Test renaming the first item
    //----------------

    const item = itemsView[0]
    const innerItemView = item.querySelector('.presentation-view')
    expect(innerItemView).toBeTruthy()
    innerItemView.dispatchEvent(new Event('dblclick', { bubbles: true }))
    const editionView = item.querySelector('input')
    expect(editionView).toBeTruthy()
    editionView.dispatchEvent(new Event('click', { bubbles: true }))
    editionView.dispatchEvent(new KeyboardEvent('keypress', { key: 'f' }))
    editionView.dispatchEvent(new KeyboardEvent('keypress', { key: 'o' }))
    editionView.dispatchEvent(new KeyboardEvent('keypress', { key: 'o' }))
    editionView.value = 'foo'
    editionView.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }))

    const s0 = await extractActualProperties(state)
    expect(s0.items[0].name).toBe('foo')

    //----------------
    // Test toggle on first item using the view
    //----------------

    const toggleFirstItemView = item.querySelector('.item-view-toggle')
    expect(toggleFirstItemView).toBeTruthy()
    toggleFirstItemView.dispatchEvent(new Event('click', { bubbles: true }))
    const s1 = await extractActualProperties(state)
    expect(s1.items.done).toBeFalsy()

    //----------------
    // Test delete the first item
    //----------------

    const deleteFirstItemView = item.querySelector('.item-view-remove')
    deleteFirstItemView.dispatchEvent(new Event('click', { bubbles: true }))
    itemsView = document.querySelectorAll(`.${ItemView.ClassName}`)
    expect([...itemsView]).toHaveLength(1)

    //----------------
    // Test create a new item
    //----------------

    const newItemView: NewItemView & HTMLElement = document.querySelector(
        `.${NewItemView.ClassName}`,
    )
    expect(newItemView).toBeTruthy()
    const editionNewItem = newItemView.querySelector('input')
    expect(editionNewItem).toBeTruthy()
    editionNewItem.dispatchEvent(new KeyboardEvent('keypress', { key: 'b' }))
    editionNewItem.dispatchEvent(new KeyboardEvent('keypress', { key: 'a' }))
    editionNewItem.dispatchEvent(new KeyboardEvent('keypress', { key: 'r' }))
    editionNewItem.value = 'bar'
    editionNewItem.dispatchEvent(
        new KeyboardEvent('keypress', { key: 'Enter' }),
    )

    const s2 = await extractActualProperties(state)
    expect(s2.items).toHaveLength(2)
    expect(s2.items[1].name).toBe('bar')

    //----------------
    // Test the footer view & its various display modes
    //----------------

    const footerView: FooterView & HTMLElement = document.querySelector(
        `.${FooterView.ClassName}`,
    )
    expect(footerView).toBeTruthy()

    const displayCompletedToggleView = footerView.querySelector(`.Completed`)
    displayCompletedToggleView.dispatchEvent(
        new Event('click', { bubbles: true }),
    )
    itemsView = document.querySelectorAll(`.${ItemView.ClassName}`)
    expect([...itemsView]).toHaveLength(1)

    const displayActiveToggleView = document.querySelector(`.Active`)
    displayActiveToggleView.dispatchEvent(new Event('click', { bubbles: true }))
    itemsView = document.querySelectorAll(`.${ItemView.ClassName}`)
    expect([...itemsView]).toHaveLength(1)

    const displayAllToggleView = document.querySelector(`.All`)
    displayAllToggleView.dispatchEvent(new Event('click', { bubbles: true }))
    itemsView = document.querySelectorAll(`.${ItemView.ClassName}`)
    expect([...itemsView]).toHaveLength(2)

    //----------------
    // Test toggle all button
    //----------------

    const toggleAll = document.querySelector('.new-item-view-toggle-all')
    toggleAll.dispatchEvent(new Event('click', { bubbles: true }))
    displayActiveToggleView.dispatchEvent(new Event('click', { bubbles: true }))
    itemsView = document.querySelectorAll(`.${ItemView.ClassName}`)
    expect([...itemsView]).toHaveLength(0)
})
