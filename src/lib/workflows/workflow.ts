import { Modules, Connections } from './..'
import { UidTrait } from '../modules/traits'
import { uuidv4 } from '../modules'

export class Layer implements UidTrait {
    public readonly uid: string
    public readonly moduleIds: string[] = []
    public readonly children: Layer[] = []

    constructor(
        params: { uid?: string; moduleIds?: string[]; children?: Layer[] } = {},
    ) {
        Object.assign(this, params)
        this.uid = this.uid || uuidv4()
    }

    reduce<TRes>(fct: (acc: TRes, e: Layer) => TRes, v0: TRes): TRes {
        return this.children.reduce((acc, e) => {
            return e.reduce(fct, acc)
        }, fct(v0, this))
    }

    map(fct: (l: Layer) => Layer): Layer {
        const { uid, moduleIds, children } = fct(this)
        const newChildren = children.map((c) => c.map(fct))
        return new Layer({ uid, moduleIds, children: newChildren })
    }

    filter(fct: (l: Layer) => boolean): Layer[] {
        const l = fct(this) ? this : undefined
        const c = this.children.map((l) => l.filter(fct)).flat()
        return [l, ...c].filter((l) => l != undefined)
    }

    flat(): Layer[] {
        return this.reduce((acc, e) => [...acc, e], [])
    }

    merge({ include, at }: { include: Layer; at?: string }) {
        return merge({ from: this, include, at })
    }
}

function merge({
    from,
    include,
    at,
}: {
    from: Layer
    include: Layer
    at?: string
}) {
    at = at || from.uid
    const allIncludedIds: string[] = include.reduce(
        (acc, l) => [...acc, ...l.moduleIds, ...l.children.map((l) => l.uid)],
        [],
    )

    const base = from.map((l) => {
        return new Layer({
            uid: l.uid,
            moduleIds: l.moduleIds.filter(
                (uid) => !allIncludedIds.includes(uid),
            ),
            children: l.children.filter(
                ({ uid }) => !allIncludedIds.includes(uid),
            ),
        })
    })
    return base.map((l) => {
        return l.uid == at
            ? new Layer({ ...l, children: [...l.children, include] })
            : l
    })
}

export class Workflow implements UidTrait {
    public readonly uid: string
    public readonly modules: Modules.Implementation[] = []
    public readonly connections: Connections.Connection[] = []

    public readonly rootLayer: Layer = new Layer()

    constructor(
        params: {
            modules?: Modules.Implementation[]
            connections?: Connections.Connection[]
            rootLayer?: Layer
        } = {},
    ) {
        Object.assign(this, params)
    }

    getModule(uid: string): Modules.Implementation | undefined {
        return this.modules.find((m) => m.uid == uid)
    }
}
