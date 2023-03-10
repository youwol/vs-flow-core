import { AttributeTrait } from './attributes'
import * as Attributes from './attributes'
import { Context } from '@youwol/logging'
export * as Attributes from './attributes'

export interface Schema {
    name: Attributes.String
    [k: string]: SchemaInner | SchemaInner[] | AttributeTrait<unknown>
}

export interface SchemaInner {
    [k: string]: SchemaInner | SchemaInner[] | AttributeTrait<unknown>
}

export type ConfigInstance<TTarget> = {
    [Property in keyof TTarget]: TTarget[Property] extends AttributeTrait<unknown>
        ? TTarget[Property]['__value']
        : ConfigInstance<TTarget[Property]>
}

export class Configuration<T> {
    schema: T

    constructor(params: { schema: T }) {
        Object.assign(this, params)
    }

    extractWith({
        values,
        context,
    }: {
        values?: { [_k: string]: unknown }
        context: Context
    }): ConfigInstance<T> {
        return context.withChild('Attempt extractWith', (childContext) => {
            const rawExtracted = parseObject(
                this.schema as unknown as Schema,
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
        if ('__value' in asAttribute) {
            return {
                ...acc,
                [k]: values && values[k] ? values[k] : asAttribute.__value,
            }
        }
        return { ...acc, [k]: parseObject(v as Schema, values && values[k]) }
    }, {})
}
