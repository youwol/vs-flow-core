import { AttributeTrait } from './attributes'
import { JsonMap } from '../../connections'
import { Context } from '@youwol/logging'
export * as Attributes from './attributes'

export interface Schema {
    name: Attributes.String
    [k: string]: SchemaInner | SchemaInner[] | AttributeTrait<unknown>
}

export interface SchemaInner {
    [k: string]: SchemaInner | SchemaInner[] | AttributeTrait<unknown>
}

export class Configuration<T> {
    model: T

    constructor(params: { model: T }) {
        Object.assign(this, params)
    }

    extractWith({
        values,
        context,
    }: {
        values?: { [_k: string]: unknown }
        context: Context
    }): JsonMap {
        return context.withChild('Attempt extractWith', (childContext) => {
            const rawExtracted = parseObject(
                this.model as unknown as Schema,
                values || {},
            )
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
                [k]: values && values[k] ? values[k] : asAttribute.__value,
            }
        }
        return { ...acc, [k]: parseObject(v as Schema, values && values[k]) }
    }, {})
}
