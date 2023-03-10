import { Slot } from '../modules/IOs'
import {
    ApiTrait,
    ConfigurableTrait,
    ExecutionJournal,
    JournalTrait,
    StatusTrait,
    UidTrait,
} from '../modules/traits'
import { map } from 'rxjs/operators'
import { Configurations, InputMessage } from '../modules'
import { BehaviorSubject, ReplaySubject, Subscription } from 'rxjs'

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
    name: Configurations.Attributes.String
    adaptor?: Configurations.Attributes.JsCode<(Message) => Message>
}

export class Connection
    implements
        UidTrait,
        ConfigurableTrait<TSchema>,
        JournalTrait,
        StatusTrait<{ connected: boolean }>
{
    public readonly start: Slot
    public readonly end: Slot

    public readonly uid: string

    public readonly configuration = new Configurations.Configuration<TSchema>({
        schema: {
            name: new Configurations.Attributes.String({
                value: 'Connection',
            }),
            adaptor: new Configurations.Attributes.JsCode({
                value: undefined,
            }),
        },
    })

    public readonly configurationInstance: { adaptor?: Adaptor }
    public readonly journal: ExecutionJournal

    private subscription: Subscription

    public readonly status$ = new BehaviorSubject<{ connected: boolean }>({
        connected: true,
    })

    private _start$: ReplaySubject<Message>
    private _end$: ReplaySubject<Message>

    get start$() {
        if (!this._start$) {
            this._start$ = new ReplaySubject<Message>(1)
        }
        return this._start$
    }

    get end$() {
        if (!this._end$) {
            this._end$ = new ReplaySubject<Message>(1)
        }
        return this._end$
    }

    constructor({
        uid,
        start,
        end,
        configuration,
    }: {
        uid?: string
        start: Slot
        end: Slot
        configuration: { adaptor?: Adaptor }
    }) {
        this.start = start
        this.end = end
        this.journal = new ExecutionJournal({
            logsChannels: [],
        })
        this.configurationInstance = this.configuration.extractWith({
            values: configuration,
            context: this.journal.addPage({
                title: 'constructor',
            }),
        })

        this.uid =
            uid ||
            `${this.start.slotId}@${this.start.moduleId}-${this.end.slotId}@${this.end.moduleId}`
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
        const adaptor = this.configurationInstance.adaptor

        this.subscription = startSlot.observable$
            .pipe(
                map((message: Message<unknown>) => {
                    const ctx = this.journal.addPage({
                        title: 'data transiting',
                    })
                    this._start$ && this._start$.next(message)
                    ctx.info('Incoming message', message)
                    const adapted = adaptor ? adaptor(message) : message
                    ctx.info('Adapted message', adapted)
                    return adapted
                }),
            )
            .subscribe(
                (adaptedMessage: InputMessage<unknown>) => {
                    this._end$ && this._end$.next(adaptedMessage)
                    endSlot.rawMessage$.next(adaptedMessage)
                },
                (_error) => {
                    /*no op for now*/
                },
                () => {
                    endSlot.rawMessage$.complete()
                    this.status$.next({ connected: false })
                },
            )
    }

    isConnected() {
        return this.subscription != undefined
    }

    disconnect() {
        if (this.isConnected()) {
            this.subscription.unsubscribe()
        }
    }

    adapt(d: unknown) {
        return this.configurationInstance.adaptor(d)
    }
}
