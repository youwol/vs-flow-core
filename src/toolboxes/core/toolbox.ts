import { Modules, ToolBox } from '../../lib'
import { BuilderView, Console } from './core.modules'

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
                    return new BuilderView(fwdParams)
                },
            }),
            new Modules.Module({
                declaration: {
                    typeId: 'console',
                },
                implementation: ({ fwdParams }) => {
                    return new Console(fwdParams)
                },
            }),
        ],
    })
}
