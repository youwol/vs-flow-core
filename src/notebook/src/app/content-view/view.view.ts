import { VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../app.state'
import { ProjectState } from '../../../../lib/project'
import { View } from '../side-nav-tabs'

export class ViewTab implements VirtualDOM {
    public readonly state: AppState
    public readonly project: ProjectState
    public readonly node: View
    public readonly class = 'h-100 w-100'
    public readonly children: VirtualDOM[]

    constructor(params: {
        node: View
        state: AppState
        project: ProjectState
    }) {
        Object.assign(this, params)
        const view = this.project.views[this.node.id]
        this.children = [typeof view == 'function' ? view(this.project) : view]
    }
}
