import { VirtualDOM } from '@youwol/flux-view'
import { AppState } from '../app.state'
import { ProjectState } from '../../../../lib/project'

import { Renderer3DView } from '../../../../vs-flow-viewer/src'

export class WorkflowTab implements VirtualDOM {
    public readonly class = 'h-100 w-100'
    public readonly state: AppState
    public readonly project: ProjectState
    public readonly children: VirtualDOM

    constructor(params: { state: AppState; project: ProjectState }) {
        Object.assign(this, params)
        console.log('Workflow Tab')
        this.children = [
            new Renderer3DView({
                project: this.project,
                uidSelected: this.state.selectedUid$,
            }),
        ]
    }
}
