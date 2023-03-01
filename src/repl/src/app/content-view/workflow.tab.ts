import { VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../app.state'
import { ProjectState } from '../../../../lib/project'

import { Renderer3DView } from '../../../../vs-flow-viewer/src'

export class WorkflowTab implements VirtualDOM {
    public readonly class = 'h-100 w-100'
    public readonly state: AppState
    public readonly project: ProjectState
    public readonly children: VirtualDOM
    public readonly style = {}

    constructor(params: { state: AppState; project: ProjectState }) {
        Object.assign(this, params)
        this.style = this.project ? { opacity: 1 } : { opacity: 0.3 }
        this.children = [
            new Renderer3DView({
                project: this.project || this.state.lastAvailableProject,
                uidSelected: this.state.selectedUid$,
            }),
        ]
    }
}
