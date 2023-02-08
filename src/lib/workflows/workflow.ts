import { Modules, Connections } from './..'
import { UidTrait } from '../modules/traits'

export class Layer {
    public readonly moduleIds: string[] = []
    public readonly children: Array<Layer> = []
}
export class Organizer {
    public readonly root: Layer = new Layer()
}

export class Workflow implements UidTrait {
    public readonly uid: string
    public readonly modules: Modules.Implementation[] = []
    public readonly connections: Connections.Connection[] = []

    public readonly organizer: Organizer = new Organizer()

    constructor(
        params: {
            modules?: Modules.Implementation[]
            connections?: Connections.Connection[]
            organizer?: Organizer
        } = {},
    ) {
        Object.assign(this, params)
    }
}
