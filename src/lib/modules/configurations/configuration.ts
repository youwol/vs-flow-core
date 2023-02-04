import { Attribute } from './attributes'
export * as Attributes from './attributes'

export interface Schema {
    [k: string]: Schema | Schema[] | Attribute
}

export class Configuration<TSchema extends Schema> {
    model: TSchema

    constructor(params: { model: TSchema }) {
        Object.assign(this, params)
    }
}
