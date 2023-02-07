import { AttributeTrait } from './attributes'
import { JsonMap } from '../../connections'
import { Context } from '@youwol/logging'
export * as Attributes from './attributes'

export interface Schema {
    [k: string]: Schema | Schema[] | AttributeTrait<unknown>
}

export class Configuration<TSchema extends Schema> {
    model: TSchema

    constructor(params: { model: TSchema }) {
        Object.assign(this, params)
    }

    extractWith({
        values,
        context,
    }: {
        values?: JsonMap
        context: Context
    }): JsonMap {
        return context.withChild('Attempt extractWith', (childContext) => {
            const rawExtracted = parseObject(this.model, values || {})
            childContext.info('extracted', rawExtracted)
            return rawExtracted
        })
    }
}

function parseObject<TSchema extends Schema>(model: TSchema, values) {
    return Object.entries(model).reduce((acc, [k, v]) => {
        const asAttribute = v as AttributeTrait<unknown>
        if (asAttribute.__value != undefined) {
            return {
                ...acc,
                [k]: values && values[k] ? values[k] : asAttribute.getValue(),
            }
        }
        return { ...acc, [k]: parseObject(v as Schema, values && values[k]) }
    }, {})
}
