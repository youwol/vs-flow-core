import { Contract, IExpectation } from './contract'
export * as Contracts from './contract'
export * from './slot'

export class Input {
    public readonly description?: string
    public readonly contract?: Contract | IExpectation<unknown>

    constructor(params: {
        description?: string
        contract?: Contract | IExpectation<unknown>
    }) {
        Object.assign(this, params)
    }
}
