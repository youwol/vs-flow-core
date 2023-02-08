import { Slot } from '../modules/IOs'
import {
    ApiTrait,
    ConfigurableTrait,
    ExecutionJournal,
    JournalTrait,
    UidTrait,
} from '../modules/traits'
import { map } from 'rxjs/operators'
import { Configurations, InputMessage } from '../modules'
import { Subscription } from 'rxjs'

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

type TSchema = {
    adaptor: Configurations.Attributes.JsCode<(Message) => Message>
}

export class Connection
    implements UidTrait, ConfigurableTrait<TSchema>, JournalTrait
{
    public readonly start: Slot
    public readonly end: Slot

    public readonly uid: string

    public readonly configurationModel =
        new Configurations.Configuration<TSchema>({
            model: {
                adaptor: new Configurations.Attributes.JsCode({
                    value: (d) => d,
                }),
            },
        })

    public readonly configuration: { adaptor?: Adaptor }
    public readonly journal: ExecutionJournal

    private subscription: Subscription

    constructor({
        start,
        end,
        configuration,
    }: {
        start: Slot
        end: Slot
        configuration: { adaptor?: Adaptor }
    }) {
        this.start = start
        this.end = end
        this.journal = new ExecutionJournal({
            logsChannels: [],
        })
        this.configuration = this.configurationModel.extractWith({
            values: configuration,
            context: this.journal.addJournal({
                title: 'constructor',
            }),
        })

        this.uid = `${this.start.slotId}@${this.start.moduleId}-${this.end.slotId}@${this.end.moduleId}`
    }

    connect({ apiFinder }: { apiFinder: (uid: string) => ApiTrait }) {
        const startModule = apiFinder(this.start.moduleId)
        const endModule = apiFinder(this.end.moduleId)
        const startSlot = startModule.outputSlots.find(
            (slot) => slot.slotId == this.start.slotId,
        )
        const endSlot = endModule.inputSlots.find(
            (slot) => slot.slotId == this.end.slotId,
        )
        const adaptor = this.configuration.adaptor

        this.subscription = startSlot.observable$
            .pipe(
                map((message: Message<unknown>) => {
                    const ctx = this.journal.addJournal({
                        title: 'data transiting',
                    })
                    ctx.info('Incoming message', message)
                    const adapted = adaptor ? adaptor(message) : message
                    ctx.info('Adapted message', adapted)
                    return adapted
                }),
            )
            .subscribe((adaptedMessage: InputMessage<unknown>) => {
                endSlot.subject.next(adaptedMessage)
            })
    }

    isConnected() {
        return this.subscription != undefined
    }

    adapt(d: unknown) {
        return this.configuration.adaptor(d)
    }
}
