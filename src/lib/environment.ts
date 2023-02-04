import { Modules } from '.'

export class ToolBox {
    public readonly modules: Modules.Module<unknown>[]

    constructor(params: { modules: Modules.Module<unknown>[] }) {
        Object.assign(this, params)
    }
}

export interface IEnvironment {
    toolboxes: ToolBox[]
}
