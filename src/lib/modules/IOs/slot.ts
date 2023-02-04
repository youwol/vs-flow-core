import { Observable, Subject } from 'rxjs'
import { IExpectation } from './contract'
import { Message } from '../../connections'
import { InputMessage } from '../module'

export interface Slot {
    slotId: string
    moduleId: string
}

export class InputSlot<T = unknown> implements Slot {
    slotId: string
    moduleId: string
    description: string
    contract: IExpectation<unknown>
    subject: Subject<InputMessage<T>>

    constructor(params: {
        slotId: string
        moduleId: string
        description: string
        contract: IExpectation<unknown>
        subject: Subject<InputMessage<T>>
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
        observable$: Observable<Message>
    }) {
        Object.assign(this, params)
    }
}
