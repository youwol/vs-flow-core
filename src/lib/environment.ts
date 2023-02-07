import { Modules } from '.'
import { Implementation } from './modules'
import { JsonMap } from './connections'

export class ToolBox {
    public readonly modules: Modules.Module<Implementation>[]

    constructor(params: { modules: Modules.Module<Implementation>[] }) {
        Object.assign(this, params)
    }
}

export interface IEnvironment {
    toolboxes: ToolBox[]

    instantiateModule<T>({
        typeId,
        moduleId,
        configuration,
    }: {
        typeId: string
        moduleId?: string
        configuration?: JsonMap
    }): Promise<T & Modules.Implementation>
}
