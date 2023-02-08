import { Modules, IEnvironment, ToolBox } from '../../../lib'
import { toolboxes } from '../../../toolboxes'
import { BehaviorSubject } from 'rxjs'

export class Environment implements IEnvironment {
    public readonly toolboxes$ = new BehaviorSubject<ToolBox[]>([])

    constructor(params: { toolboxes: ToolBox[] }) {
        Object.assign(this, params)
    }

    async import(toolbox: string): Promise<ToolBox> {
        /**
         * for now only standard toolboxes are supported
         */
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
        configuration?: { [_k: string]: unknown }
    }): Promise<T & Modules.Implementation> {
        const module: Modules.Module<Modules.Implementation> =
            this.toolboxes$.value
                .reduce((acc, toolbox) => [...acc, ...toolbox.modules], [])
                .find((module: Modules.Module<Modules.Implementation>) => {
                    return module.declaration.typeId == typeId
                })
        return (await module.getInstance({
            fwdParams: { uid: moduleId, configuration },
            environment: this,
        })) as T & Modules.Implementation
    }
}
