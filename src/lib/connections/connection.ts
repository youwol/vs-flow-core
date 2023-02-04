type AnyJson = boolean | number | string | null | JsonArray | JsonMap
export interface JsonMap {
    [key: string]: AnyJson
}
type JsonArray = Array<AnyJson>

export type UserContext = { [key: string]: unknown }

export type Message<TData = unknown> = {
    data: TData
    context?: UserContext
}
