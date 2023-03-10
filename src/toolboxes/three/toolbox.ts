import { Modules, ToolBox } from '../../lib'
import { standardMaterialModule } from './material.modules'
import { sphereModule } from './sphere.module'
import { ViewerModule } from './viewer.module'

export function toolbox() {
    return new ToolBox({
        name: 'three',
        uid: '@youwol/vs-flow-core/three',
        modules: [
            new Modules.Module({
                declaration: {
                    typeId: 'sphere',
                },
                implementation: ({ fwdParams }) => {
                    return sphereModule(fwdParams)
                },
            }),
            new Modules.Module({
                declaration: {
                    typeId: 'standardMaterial',
                },
                implementation: ({ fwdParams }) => {
                    return standardMaterialModule(fwdParams)
                },
            }),
            new Modules.Module({
                declaration: {
                    typeId: 'viewer',
                },
                implementation: ({ fwdParams }) => {
                    return new ViewerModule(fwdParams)
                },
            }),
        ],
    })
}
