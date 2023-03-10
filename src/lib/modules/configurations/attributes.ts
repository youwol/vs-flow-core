export interface AttributeTrait<TValue> {
    __value: TValue
}

export class JsCode<TFct extends (...d: unknown[]) => unknown>
    implements AttributeTrait<TFct>
{
    public readonly __value: TFct

    constructor(params: { value?: string | TFct }) {
        this.__value =
            typeof params.value == 'string'
                ? new Function(params.value)()
                : params.value
    }

    execute(...args: Parameters<TFct>): ReturnType<TFct> {
        return this.__value(...args) as ReturnType<TFct>
    }
}

export class Float implements AttributeTrait<number> {
    public readonly __value: number
    public readonly min?: number
    public readonly max?: number

    constructor(params: { value?: number; min?: number; max?: number }) {
        Object.assign(this, params)
        this.__value = params.value && params.value
    }
}

export class String implements AttributeTrait<string> {
    public readonly __value: string
    constructor(params: { value: string }) {
        Object.assign(this, params)
        this.__value = params.value && params.value
    }
}

export class Integer implements AttributeTrait<number> {
    public readonly __value: number
    public readonly min?: number
    public readonly max?: number
    constructor(params: { value: number; min?: number; max?: number }) {
        Object.assign(this, params)
        this.__value = params.value && params.value
    }
}

export class Boolean implements AttributeTrait<boolean> {
    public readonly __value: boolean

    constructor(params: { value: boolean }) {
        Object.assign(this, params)
        this.__value = params.value && params.value
    }
}
