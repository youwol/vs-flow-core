export type AnyFunction<A = any> = (...input: any[]) => A
export type AnyConstructor<A = object> = new (...input: any[]) => A

export type Mixin<T extends AnyFunction> = InstanceType<ReturnType<T>>
// This mixin adds a scale property, with getters and setters
// for changing it with an encapsulated private property:

function AttributeTrait<T, TBase extends AnyConstructor>(Base: TBase) {
    return class AttributeTrait extends Base {
        // Mixins may not declare private/protected properties
        // however, you can use ES2020 private fields
        __value: T
        constructor(...rest) {
            super(rest)
        }

        setValue(v: T) {
            this.__value = v
        }
        getValue() {
            return this.__value
        }
    }
}
export type AttributeTrait<_T> = Mixin<typeof AttributeTrait>

export class JsCode extends AttributeTrait<
    (...args) => unknown,
    AnyConstructor
>(Object) {
    value: (...args) => unknown

    constructor(params: { value: string | ((...args) => unknown) }) {
        super(params)
        this.setValue(
            typeof params.value == 'string'
                ? new Function(params.value)()
                : params.value,
        )
    }
}

export class Float extends AttributeTrait<number, AnyConstructor>(Object) {
    public readonly min?: number
    public readonly max?: number

    constructor(params: { value: number; min?: number; max?: number }) {
        super(params)
        this.setValue(params.value)
        Object.assign(this, params)
    }
}

export class String extends AttributeTrait<string, AnyConstructor>(Object) {
    constructor(params: { value: string }) {
        super(params)
        this.setValue(params.value)
        Object.assign(this, params)
    }
}
