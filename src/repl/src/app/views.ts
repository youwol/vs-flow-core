/**
 * @category View
 * @category Entry Point
 */
import { VirtualDOM } from '@youwol/flux-view'
import { AppState } from './app.state'

export class AppView implements VirtualDOM {
    static ClassName = 'app-view'
    public readonly state: AppState
    constructor(params: { state: AppState }) {
        Object.assign(this, params)
    }
}
