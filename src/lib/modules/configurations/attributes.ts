export class Attribute {}
export class JsCode implements Attribute {
    content: string

    constructor(params: { content: string }) {
        Object.assign(this, params)
    }

    eval<TInput = unknown, TResp = unknown>(data: TInput): TResp {
        return new Function(this.content)()(data)
    }
}

export class Float implements Attribute {
    public readonly value: number
    public readonly min?: number
    public readonly max?: number

    constructor(params: { value: number; min?: number; max?: number }) {
        Object.assign(this, params)
    }
}
