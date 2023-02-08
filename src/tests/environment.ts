import { Modules } from '..'
import { setup } from '../auto-generated'
import { IEnvironment, ToolBox } from '../lib'
import * as SphereModule from './modules-implementation/sphere.module'
import { Implementation } from '../lib/modules'
import { JsonMap } from '../lib/connections'
import { toolboxes } from '../toolboxes'
import { BehaviorSubject } from 'rxjs'

export class TestEnvironment implements IEnvironment {
    public readonly toolboxes$ = new BehaviorSubject<ToolBox[]>([])

    constructor(params: { toolboxes: ToolBox[] }) {
        Object.assign(this, params)
        this.toolboxes$.next(params.toolboxes)
        const auxModuleSphere = 'test-sphere-module'
        window[`${setup.name}/${auxModuleSphere}_API${setup.apiVersion}`] =
            SphereModule
    }

    async import(toolbox: string) {
        const actualToolboxes = this.toolboxes$.value
        this.toolboxes$.next([...actualToolboxes, toolboxes[toolbox]])
        return Promise.resolve(toolboxes[toolbox])
    }

    async instantiateModule<T>({
        typeId,
        moduleId,
        configuration,
    }: {
        typeId: string
        moduleId?: string
        configuration?: JsonMap
    }): Promise<T & Modules.Implementation> {
        const module: Modules.Module<Implementation> = this.toolboxes$.value
            .reduce((acc, toolbox) => [...acc, ...toolbox.modules], [])
            .find((module: Modules.Module<Implementation>) => {
                return module.declaration.typeId == typeId
            })
        return (await module.getInstance({
            fwdParams: { uid: moduleId, configuration },
            environment: this,
        })) as T & Modules.Implementation
    }
}
