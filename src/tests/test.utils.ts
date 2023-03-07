import { TestEnvironment } from './environment'
import { toolbox } from './toolbox'
import { ProjectState } from '../lib/project'
import { Workflow } from '../lib/workflows'

export function emptyProject() {
    const environment = new TestEnvironment({ toolboxes: [toolbox] })
    return new ProjectState({
        main: new Workflow(),
        macros: [],
        environment,
    })
}
