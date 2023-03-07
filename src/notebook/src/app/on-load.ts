import { AppState } from './app.state'
import { AppView } from './app.view'
import { render } from '@youwol/flux-view'
import { load$ } from './load'
import { Client } from '@youwol/cdn-client'

const assetId = new URLSearchParams(window.location.search).get('id')
load$(assetId, Client['initialLoadingScreen']).subscribe((data) => {
    const vDOM = new AppView({
        state: new AppState({ assetId, originalReplSource: data.content }),
    })
    document.body.appendChild(render(vDOM))
})

export {}
