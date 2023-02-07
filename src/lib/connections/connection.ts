import { Slot } from '../modules/IOs'
import { ApiTrait, UidTrait } from '../modules/traits'
import { map } from 'rxjs/operators'
import { InputMessage } from '../modules'

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

type Adaptor = (Message) => InputMessage

export class Connection implements UidTrait {
    public readonly start: Slot
    public readonly end: Slot
    public readonly adaptor: Adaptor

    public readonly uid: string

    constructor(params: { start: Slot; end: Slot; adaptor?: Adaptor }) {
        Object.assign(this, params)
        this.uid = `${this.start.slotId}@${this.start.moduleId}-${this.end.slotId}@${this.end.moduleId}`
    }
}

export function connect({
    start,
    end,
    adaptor,
}: {
    start: { slotId: string; module: ApiTrait }
    end: { slotId: string; module: ApiTrait }
    adaptor?: Adaptor
}) {
    const startSlot = start.module.outputSlots.find(
        (slot) => slot.slotId == start.slotId,
    )
    const endSlot = end.module.inputSlots.find(
        (slot) => slot.slotId == end.slotId,
    )
    return startSlot.observable$
        .pipe(
            map((message: Message<unknown>) => {
                return adaptor ? adaptor(message) : message
            }),
        )
        .subscribe((adaptedMessage: InputMessage<unknown>) => {
            endSlot.subject.next(adaptedMessage)
        })
}
