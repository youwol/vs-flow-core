import { Modules } from '..'
import { setup } from '../auto-generated'
import { IEnvironment, ToolBox } from '../lib/environment'
import * as SphereModule from './modules-implementation/sphere.module'

export class TestEnvironment implements IEnvironment {
    public readonly toolboxes: ToolBox[]

    constructor(params: { toolboxes: ToolBox[] }) {
        Object.assign(this, params)

        const auxModuleSphere = 'test-sphere-module'
        window[`${setup.name}/${auxModuleSphere}_API${setup.apiVersion}`] =
            SphereModule
    }

    async instantiateModule({ typeId }: { typeId: string }) {
        const module: Modules.Module<unknown> = this.toolboxes
            .reduce((acc, toolbox) => [...acc, ...toolbox.modules], [])
            .find((module: Modules.Module<unknown>) => {
                return module.declaration.typeId == typeId
            })
        return await module.getInstance({ fwdParams: {}, environment: this })
    }
}
