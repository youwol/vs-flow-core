export interface AttributeTrait<TValue> {
    __value: TValue
}

export class JsCode<TFct> implements AttributeTrait<TFct> {
    public readonly __value: TFct

    constructor(params: { value?: string | TFct }) {
        this.__value =
            typeof params.value == 'string'
                ? new Function(params.value)()
                : params.value
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
    constructor(params: { value: number; min?: number; max?: number }) {
        Object.assign(this, params)
        this.__value = params.value && params.value
    }
}
