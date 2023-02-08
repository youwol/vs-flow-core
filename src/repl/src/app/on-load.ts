import { AppState } from './app.state'
import { AppView } from './app.view'
import { render } from '@youwol/flux-view'

const vDOM = new AppView({
    state: new AppState(),
})
document.body.appendChild(render(vDOM))

export {}
