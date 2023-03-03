import { Modules, ToolBox } from '../../lib'
import { CoreBuilderView } from './core.modules'

export function toolbox() {
    return new ToolBox({
        name: 'core',
        uid: '@youwol/vs-flow-core/core',
        modules: [
            new Modules.Module({
                declaration: {
                    typeId: 'builderView',
                },
                implementation: ({ fwdParams }) => {
                    return new CoreBuilderView(fwdParams)
                },
            }),
        ],
    })
}
