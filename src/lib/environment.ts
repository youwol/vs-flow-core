import { Modules } from '.'
import { Implementation } from './modules'
import { UidTrait } from './modules/traits'
import { JsonMap } from './connections'
import { BehaviorSubject } from 'rxjs'

export class ToolBox implements UidTrait {
    public readonly modules: Modules.Module<Implementation>[]
    public readonly name: string
    public readonly uid: string

    constructor(params: {
        name: string
        uid: string
        modules: Modules.Module<Implementation>[]
    }) {
        Object.assign(this, params)
    }
}

export interface IEnvironment {
    toolboxes$: BehaviorSubject<ToolBox[]>

    instantiateModule<T>({
        typeId,
        moduleId,
        configuration,
    }: {
        typeId: string
        moduleId?: string
        configuration?: JsonMap
    }): Promise<T & Modules.Implementation>

    import(toolbox: string): Promise<ToolBox>
}
