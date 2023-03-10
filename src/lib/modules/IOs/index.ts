import { Contract, IExpectation } from './contract'
export * as Contracts from './contract'
export * from './slot'

export class Input<TData = unknown> {
    public readonly description?: string
    public readonly contract?: Contract | IExpectation<TData>

    constructor(params: {
        description?: string
        contract?: Contract | IExpectation<unknown>
    }) {
        Object.assign(this, params)
    }
}
