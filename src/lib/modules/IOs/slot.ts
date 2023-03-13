import { Observable, Subject } from 'rxjs'
import { IExpectation } from './contract'
import { Message } from '../../connections'
import { InputMessage, ProcessingMessage } from '../module'

export interface Slot {
    slotId: string
    moduleId: string
}

export class InputSlot<T = unknown> implements Slot {
    public readonly slotId: string
    public readonly moduleId: string
    public readonly description: string
    public readonly contract: IExpectation<unknown>
    public readonly preparedMessage$: Observable<ProcessingMessage<T>>
    public readonly rawMessage$: Subject<InputMessage<T>>

    constructor(params: {
        slotId: string
        moduleId: string
        description: string
        contract: IExpectation<unknown>
        rawMessage$: Subject<InputMessage<T>>
        preparedMessage$: Observable<ProcessingMessage<T>>
    }) {
        Object.assign(this, params)
    }
}

export class OutputSlot<T = unknown> implements Slot {
    slotId: string
    moduleId: string
    observable$: Observable<Message<T>>

    constructor(params: {
        slotId: string
        moduleId: string
        observable$: Observable<Message<T>>
    }) {
        Object.assign(this, params)
    }
}
