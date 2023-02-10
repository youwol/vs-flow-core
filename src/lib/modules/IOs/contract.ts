import { Context } from '@youwol/logging'

/**
 * ## ExpectationStatus
 *
 * The class ExpectationStatus is the type of the return value when an [[IExpectation | expectation]] is resolved.
 * It serves two purposes:
 * -    they can be used to present a reporting about input's contract of modules
 * -    in case of [[FulfilledExpectation]] it includes the normalized value of the data
 *
 *
 * ExpectationStatus has a tree structure, the same way expectations have (complex 'expectations' are built from combinations
 * of children expectations).
 *
 * See [[Contract]] for a contextual discussion about expectations, status, and normalized values.
 *
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 */
export class ExpectationStatus<T> {
    /**
     * @param expectation the related expectation
     * @param children the status of *expectation* children
     * @param succeeded whether or not the expectation is fulfilled
     * @param fromValue the value (data) from which the expectation has been resolved
     * @param value the normalized value, defined only for [[FulfilledExpectation]]
     */
    constructor(
        public readonly expectation: IExpectation<T>,
        public readonly children: Array<ExpectationStatus<unknown>> | undefined,
        public readonly succeeded: boolean | undefined,
        public readonly fromValue: unknown,
        public readonly value: T,
    ) {}
}

/**
 * ## FulfilledExpectation
 *
 * The case of a fulfilled [[ExpectationStatus]].
 *
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 */
export class FulfilledExpectation<T> extends ExpectationStatus<T> {
    /**
     * @param expectation the related expectation
     * @param children the status of *expectation* children
     * @param fromValue the value (data) from which the expectation has been resolved
     * @param value the normalized value
     */
    constructor(
        expectation: IExpectation<T>,
        value: T,
        fromValue: unknown,
        children?: Array<ExpectationStatus<unknown>> | undefined,
    ) {
        super(expectation, children, true, fromValue, value)
    }
}

/**
 * ## RejectedExpectation
 *
 * The case of a rejected [[ExpectationStatus]].
 *
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 */
export class RejectedExpectation<T> extends ExpectationStatus<T> {
    /**
     * @param expectation the related expectation
     * @param children the status of *expectation* children
     * @param fromValue the value (data) from which the expectation has been resolved
     */
    constructor(
        expectation: IExpectation<T>,
        fromValue: unknown,
        children?: Array<ExpectationStatus<unknown>> | undefined,
    ) {
        super(expectation, children, false, fromValue, undefined)
    }
}

/**
 * ## UnresolvedExpectation
 *
 * The case of an expectation that hasn't been resolved.
 * It is the case for expectations combining children expectations in such ways that it
 * may be unnecessary to resolve all the children to reach the outcome (e.g. [[expectAllOf]], [[expectAnyOf]])
 *
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 */
export class UnresolvedExpectation<T> extends ExpectationStatus<T> {
    /**
     * @param expectation the related expectation
     * @param fromValue the value (data) from which the expectation has been resolved
     */
    constructor(expectation: IExpectation<T>, fromValue: unknown) {
        super(expectation, undefined, undefined, fromValue, undefined)
    }
}

/**
 * ## IExpectation
 *
 * Interface for all expectations. Implementing it needs:
 * -    to define a [[description]]
 * -    to implement a [[resolve]] function
 *
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 */
export interface IExpectation<T> {
    /**
     * description of the expectation
     */
    readonly description: string

    /**
     *
     * @param inputData Input data to evaluate the expectation on
     * @param context
     * @return Three case:
     * -    the expectation is resolved: [[FulfilledExpectation]]
     * -    the expectation is failed: [[RejectedExpectation]]
     * -    the expectation does not need to be resolved: [[UnresolvedExpectation]]
     */
    resolve(inputData: unknown, context: Context): ExpectationStatus<T>
}

/**
 * ## BaseExpectation
 *
 * A simple base class for expectations that may be better suited rather than deriving directly from [[IExpectation]].
 *
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 */
export abstract class BaseExpectation<T> implements IExpectation<T> {
    /**
     *
     * @param description description of the expectation
     * @param when defines the condition of fulfillment
     * @param normalizeTo defines how to normalize the data
     */
    protected constructor(
        public readonly description: string,
        public readonly when: BaseExpectation<T> | ((inputData) => boolean),
        public readonly normalizeTo: (
            accData: unknown,
            context: Context,
        ) => T = (d) => d as T,
    ) {}

    /**
     * BaseExpectation gets fulfilled if *this.when* is from *inputData*.
     *
     * The normalized data in case of [[FulfilledExpectation]] is:
     * -    *this.when* is of type *(inputData) => boolean* => *this.normalizeTo(inputData)*
     * -    *this.when* is of type BaseExpectation => normalized value of this.when
     *
     * @param inputData Input data to evaluate the expectation on
     * @param context
     * @return Expectation status from given inputData
     */
    abstract resolve(
        inputData: unknown,
        context: Context,
    ): ExpectationStatus<T> /*{
        const { succeeded, value } =
            this.when instanceof BaseExpectation
                ? this.when.resolve(inputData, context)
                : { succeeded: this.when(inputData), value: inputData }
        return succeeded
            ? new FulfilledExpectation<T>(
                  this,
                  this.normalizeTo(value, context),
                  inputData,
              )
            : new RejectedExpectation(this, inputData)
    }*/
}

/**
 * ## Of
 *
 * An 'elementary' expectation: it resolves a provided ```(inputData: unknown) => boolean``` function.
 * It represents the leafs of the expectation trees of [[Contract | contract]].
 *
 * > ❕ The function [[resolve]] is generally used to construct *Of* expectation.
 *
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 */
export class Of<T> extends BaseExpectation<T> {
    /**
     *
     * @param description description of the expectation
     * @param when defines the condition of fulfillment
     * @param normalizeTo defines how to normalize the data
     */
    constructor(
        public readonly description: string,
        public readonly when: (inputData: unknown) => boolean,
        public readonly normalizeTo: (
            leafData: unknown,
            context: Context,
        ) => T = (leafData) => leafData as T,
    ) {
        super(description, when, normalizeTo)
    }

    /**
     * Resolve the expectation
     *
     * *Of* expectation gets fulfilled if *this.when(inputData)* returns *true*,
     *
     * The normalized data in case of [[FulfilledExpectation]] is *this.normalizeTo(inputData)*.
     *
     * @param inputData Input data to evaluate the expectation on
     * @param context
     * @return Expectation status from given inputData
     */
    resolve(inputData: unknown, context: Context): ExpectationStatus<T> {
        const succeeded = this.when(inputData)
        return succeeded
            ? new FulfilledExpectation(
                  this,
                  this.normalizeTo(inputData, context),
                  inputData,
              )
            : new RejectedExpectation(this, inputData)
    }
}

/**
 * ## AnyOf
 *
 * Combine a list of children expectations and gets fulfilled if at least one of the children
 * is.
 *
 * Children expectations beyond the first fulfilled one get associated to [[UnresolvedExpectation]]
 * (they do not need to be evaluated).
 *
 * The normalized data in case of [[FulfilledExpectation]] is the the result of the provided *normalizeTo* function
 * evaluated from the first fulfilled child.
 *
 * > ❕ The function [[expectAnyOf]] is generally used to construct *AnyOf* expectation.
 *
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 */
export class AnyOf<T> extends BaseExpectation<T> {
    /**
     * @param description description of the expectation
     * @param expectations list of children expectations
     * @param normalizeTo defines how to normalize the data from one of the children
     */
    constructor(
        description: string,
        public readonly expectations: Array<IExpectation<T>>,
        normalizeTo: (accData: unknown, context: Context) => T = (accData) =>
            accData as T,
    ) {
        super(description, undefined, normalizeTo)
    }

    /**
     * Resolve the expectation
     *
     * *AnyOf* expectation gets fulfilled if at least one of its children is.
     *
     * Children expectations beyond the first fulfilled one get associated to [[UnresolvedExpectation]]
     * (they do not need to be evaluated).
     *
     * The normalized data in case of [[FulfilledExpectation]] is the result of the provided *normalizeTo* function
     * evaluated from the first fulfilled child.
     *
     * @param inputData Input data to evaluate the expectation on
     * @param context
     * @return Expectation status from given inputData
     */
    resolve(inputData: unknown, context: Context): ExpectationStatus<T> {
        let done = false
        const children = this.expectations.map((expectation) => {
            if (done) {
                return new UnresolvedExpectation(expectation, inputData)
            }
            const resolved = expectation.resolve(inputData, context)
            done = resolved.succeeded
            return resolved
        })

        const resolved = children.reduce(
            (acc, status) =>
                acc.succeeded || !status.succeeded
                    ? acc
                    : { succeeded: true, value: status.value },
            { succeeded: false, value: undefined },
        )

        return resolved.succeeded
            ? new FulfilledExpectation(
                  this,
                  this.normalizeTo(resolved.value, context),
                  inputData,
                  children,
              )
            : new RejectedExpectation(this, inputData, children)
    }
}

/**
 * ## expectAnyOf
 *
 * Companion creation function of [[AnyOf]].
 *
 * @param description description of the expectation
 * @param when array of children expectations
 * @param normalizeTo normalizing function
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 * @returns AnyOf expectation
 */
export function expectAnyOf<T>({
    description,
    when,
    normalizeTo,
}: {
    description: string
    when: Array<IExpectation<T>>
    normalizeTo?: (data: unknown, context: Context) => T
}): AnyOf<T> {
    return new AnyOf<T>(description, when, normalizeTo)
}

/**
 * ## AllOf
 * =unknown
 * Combine a list of children expectations and gets fulfilled only if all the children are.
 *
 * > ❕ The function [[expectAllOf]] is generally used to construct *AllOf* expectation.
 *
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 */
export class AllOf<T> extends BaseExpectation<T> {
    /**
     * @param description description of the expectation
     * @param expectations list of children expectations
     * @param normalizeTo defines how to normalize the data from the list of children's normalized data
     */
    constructor(
        description,
        public readonly expectations: Array<IExpectation<T>>,
        normalizeTo: (accData: unknown, context: Context) => T = (accData) =>
            accData as T,
    ) {
        super(description, undefined, normalizeTo)
    }

    /**
     * Resolve the expectation
     *
     * *AllOf* expectations gets fulfilled only if all the children expectations are.
     *
     * The evaluation stops at the first [[RejectedExpectation]] and children beyond that are [[UnresolvedExpectation]].
     *
     * The normalized data in case of [[FulfilledExpectation]] is the result of the provided *normalizeTo* function
     * evaluated from the list of the normalized data returned by each children.
     *
     * @param inputData Input data to evaluate the expectation on
     * @param context
     * @return Expectation status from given inputData
     */
    resolve(inputData: unknown, context: Context): ExpectationStatus<T> {
        let done = false
        const children = this.expectations.map((expectation) => {
            if (done) {
                return new UnresolvedExpectation(expectation, inputData)
            }
            const resolved = expectation.resolve(inputData, context)
            done = !resolved.succeeded
            return resolved
        })
        const resolveds = children.reduce(
            (acc, status) => {
                if (!acc.succeeded) {
                    return acc
                }

                return {
                    succeeded: acc.succeeded && status.succeeded,
                    elems: status.succeeded
                        ? acc.elems.concat([status.value])
                        : acc.elems,
                }
            },
            { succeeded: true, elems: [] },
        )
        return resolveds.succeeded
            ? new FulfilledExpectation(
                  this,
                  this.normalizeTo(resolveds.elems, context),
                  inputData,
                  children,
              )
            : new RejectedExpectation(this, inputData, children)
    }
}

/**
 * ## expectAllOf
 *
 * Companion creation function of [[AllOf]].
 *
 * @param description description of the expectation
 * @param when array of children expectations
 * @param normalizeTo normalizing function
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 * @returns AllOf expectation
 */
export function expectAllOf<T>({
    description,
    when,
    normalizeTo,
}: {
    description: string
    when: Array<IExpectation<T>>
    normalizeTo?: (accData: Array<unknown>) => T
}): AllOf<T> {
    return new AllOf<T>(description, when, normalizeTo)
}

/**
 * ## OptionalsOf
 *
 * Expectation used to describe optionals values - always fulfilled.
 *
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 */
export class OptionalsOf<T> extends BaseExpectation<T> {
    /**
     * @param description description of the expectation
     * @param expectations list of children expectations
     * @param normalizeTo defines how to normalize the data from the list of children's normalized data
     */
    constructor(
        description,
        public readonly expectations: Array<IExpectation<T>>,
        normalizeTo: (accData: unknown) => T = (accData) => accData as T,
    ) {
        super(description, undefined, normalizeTo)
    }

    /**
     * Resolve the expectation
     *
     * OptionalsOf are always [[FulfilledExpectation]], even if some of its children are [[RejectedExpectation]].
     *
     * The evaluation always go through all the children (no [[UnresolvedExpectation]]).
     *
     * The normalized data is the result of the provided *normalizeTo* function
     * evaluated from the list of the normalized data returned by each children.
     *
     * @param inputData Input data to evaluate the expectation on
     * @param context
     * @return the [[FulfilledExpectation]]
     */
    resolve(inputData: unknown, context: Context): ExpectationStatus<T> {
        const children = this.expectations.map((expectation) =>
            expectation.resolve(inputData, context),
        )
        const resolveds = children.reduce(
            (acc, status) => acc.concat([status.value]),
            [],
        )
        return new FulfilledExpectation(
            this,
            this.normalizeTo(resolveds, context),
            inputData,
            children,
        )
    }
}

/**
 * ## expectOptionalsOf
 *
 * Companion creation function of [[OptionalsOf]].
 *
 * @param description description of the expectation
 * @param when array of children expectations
 * @param normalizeTo normalizing function
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 * @returns AllOf expectation
 */
export function expectOptionalsOf<T>({
    description,
    when,
    normalizeTo,
}: {
    description: string
    when: Array<IExpectation<T>>
    normalizeTo?: (accData: Array<unknown>) => T
}): OptionalsOf<T> {
    return new OptionalsOf<T>(description, when, normalizeTo)
}

/**
 * ## SomeOf
 *
 * Expectation used to describe optionals values - always fulfilled.
 *
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 */
export class SomeOf<T, TConverted = T[]> extends BaseExpectation<TConverted> {
    /**
     * @param description description of the expectation
     * @param expectation expectation
     * @param count expectation
     * @param normalizeTo defines how to normalize the data from the list of children's normalized data
     */
    constructor(
        description,
        public readonly expectation: IExpectation<T>,
        public readonly count?: number,
        normalizeTo?: (accData: T[]) => TConverted,
    ) {
        super(description, undefined, normalizeTo)
    }

    /**
     * Resolve the expectation
     *
     * SomeOf are always [[FulfilledExpectation]], even if some of its children are [[RejectedExpectation]].
     *
     * The evaluation always go through all the children (no [[UnresolvedExpectation]]) using
     * provided *expectation* at construction.
     *
     * The normalized data is the result of the provided *normalizeTo* function
     * evaluated using the item of inputData that are resolved successfully using *expectation* .
     *
     * @param inputData Input data to evaluate the expectation on
     * @param context
     * @return the [[FulfilledExpectation]]
     */
    resolve(
        inputData: unknown | Array<unknown>,
        context: Context,
    ): ExpectationStatus<TConverted> {
        const arrayData = Array.isArray(inputData) ? inputData : [inputData]

        const children = arrayData.map((data) =>
            this.expectation.resolve(data, context),
        )

        const dataResolved = children
            .filter((expectation) => expectation.succeeded)
            .map((child) => child.value)
        const normalized = this.normalizeTo(dataResolved, context)

        if (
            dataResolved.length == 0 ||
            (this.count && dataResolved.length != this.count)
        ) {
            return new RejectedExpectation<TConverted>(
                this,
                inputData,
                children,
            )
        }

        if (this.count == undefined || dataResolved.length == this.count) {
            return new FulfilledExpectation<TConverted>(
                this,
                normalized,
                inputData,
                children,
            )
        }
    }
}

/**
 * ## ExpectAttribute
 *
 * Apply an [[expectation]] on a target attribute [[attName]].
 *
 * > ❕ The function [[expectAttribute]] is generally used to construct *ExpectAttribute* expectation.
 *
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 */
export class ExpectAttribute<T> extends BaseExpectation<T> {
    /**
     * @param attName target attribute name
     * @param expectation expectation on the attribute
     * @param normalizeTo defines how to normalize the *expectation* resolved value.
     */
    constructor(
        public readonly attName: string,
        public readonly expectation: IExpectation<T>,
        normalizeTo: (accData: unknown) => T = (accData) => accData as T,
    ) {
        super(`expect attribute ${attName}`, undefined, normalizeTo)
    }

    /**
     * Resolve the expectation
     *
     * The expectation get fulfilled if both: (i) the attribute [[attName]] exist in the inputData,
     * and (ii) [[expectation]] resolve to [[FulfilledExpectation]] when applied on *inputData[attName]*.
     *
     * If the [[attName]] do not exist in the inputData, [[expectation]] is not evaluated.
     *
     * The normalized data is the result of the provided *normalizeTo* function
     * evaluated from *this.expectation.resolve(inputData[attName])*.
     *
     * @param inputData Input data to evaluate the expectation on
     * @param context
     * @return Expectation status from given inputData
     */
    resolve(inputData: unknown, context: Context): ExpectationStatus<T> {
        if (inputData[this.attName] == undefined) {
            return new RejectedExpectation(this, inputData)
        }

        const resolved = this.expectation.resolve(
            inputData[this.attName],
            context,
        )
        return resolved.succeeded
            ? new FulfilledExpectation(
                  this,
                  this.normalizeTo(resolved.value, context),
                  inputData,
                  [resolved],
              )
            : new RejectedExpectation(this, inputData, [resolved])
    }
}

/**
 * ## expectAttribute
 *
 * Companion creation function of [[ExpectAttribute]].
 *
 * @param name name of the attribute
 * @param when expectation to test on the target attribute
 * @param T The type of [[FulfilledExpectation.value]], i.e. the type of the expectation return's value (normalized value)
 * when the expectation is fulfilled
 * @returns ExpectAttribute expectation
 */
export function expectAttribute<T>({
    name,
    when,
}: {
    name: string
    when: IExpectation<T>
}): ExpectAttribute<T> {
    return new ExpectAttribute<T>(name, when)
}

/**
 * ## OfFree
 *
 * Expect nothing (always fulfilled) and do not apply any data normalization (directly return the inputData).
 *
 * > 😕 This can be used for quick prototyping of module's input in order to postponed the design of the contract
 * > to latter.
 */
export class OfFree implements IExpectation<unknown> {
    description = 'No expectation'
    constructor() {
        /**no op*/
    }

    /**
     *
     * @param inputData Input data to evaluate the expectation on
     * @returns *FulfilledExpectation<unknown>(this, inputData, inputData, [])*
     */
    resolve(inputData: unknown): ExpectationStatus<unknown> {
        return new FulfilledExpectation<unknown>(this, inputData, inputData, [])
    }
}

/**
 * ## expectNothing
 *
 * Companion creation function of [[NoExpectation]]
 *
 * @returns an expectation that expects nothing and to do not apply any data normalization
 */
export function expectFree(): OfFree {
    return new OfFree()
}

export const noContract = expectFree()

/**
 * ## expectInstanceOf
 *
 * The function expectInstanceOf aims at ensuring that at least one element of target
 * instance type exists in input data.
 *
 * The expectation get fulfilled if any of the following get fulfilled:
 * -    the inputData is an instance of *Type*
 * -    the inputData have an attribute in *attNames* that is an instance of *Type*
 *
 * In that case, the normalized data is the instance of *Type* retrieved.
 *
 * @param typeName display name of the type
 * @param Type the target type
 * @param attNames candidate attribute names
 * @param normalizeTo normalizer
 * @returns BaseExpectation that resolve eventually to a type T
 */
export function expectInstanceOf<T, TConverted = T>({
    typeName,
    Type,
    attNames,
    normalizeTo,
}: {
    typeName: string
    Type
    attNames?: Array<string>
    normalizeTo?: (data: T, context: Context) => TConverted
}): BaseExpectation<TConverted> {
    attNames = attNames || []
    const when = expect<TConverted>({
        description: `A direct instance of ${typeName}`,
        when: (d) => d instanceof Type,
    })

    const attExpectations = attNames.map((name) =>
        expectAttribute({ name, when }),
    )
    const fullDescription =
        attNames.length == 0
            ? `A direct instance of ${typeName}`
            : `A direct instance of ${typeName}, or such instance in attributes [${attNames}]`
    return expectAnyOf<TConverted>({
        description: fullDescription,
        when: [when, ...attExpectations],
        normalizeTo,
    })
}

/**
 * ## expectCount
 *
 * The function expectCount aims at ensuring that exactly *count* elements in some *inputData*
 * are fulfilled with respect to a given expectation.
 *
 * The expectation get fulfilled if both:
 * -    (i) the inputData is an array
 * -    (ii) there exist exactly *count* elements in the array that verifies *when*
 *
 * In that case, the normalized data is an array containing the normalized data of the elements fulfilled.
 * (of length *count*)
 *
 * @param count the expected count
 * @param when the expectation
 * @param normalizeTo
 * @returns BaseExpectation that resolve eventually to a type T[] of length *count*
 */
export function expectCount<T, TConverted = T[]>({
    count,
    when,
    normalizeTo,
}: {
    count: number
    when: IExpectation<T>
    normalizeTo?: (d: Array<T>) => TConverted
}): BaseExpectation<TConverted> {
    return expectSome({
        description: when.description,
        when,
        count,
        normalizeTo,
    })
}

/**
 * ## expectSingle
 *
 * The function expectSingle aims at ensuring that exactly one element in some *inputData*
 * is fulfilled with respect to a given expectation.
 *
 * The expectation get fulfilled if either:
 * -    (i) *when.resolve(inputData)* is fulfilled
 * -    (ii) inputData is an array that contains exactly one element for which *when* resolve to [[FulfilledExpectation]]
 *
 * In that case, the normalized data identifies to the one of the *when* expectation.
 *
 * @param count the expected count
 * @param when the expectation
 * @returns BaseExpectation that resolve eventually to a type T[] of length *count*
 */
export function expectSingle<T>({ when }: { when: IExpectation<T> }) {
    return expectCount<T, T>({ count: 1, when, normalizeTo: (d: T[]) => d[0] })
}

/**
 * ## expectSome
 *
 * The function expectSome aims at ensuring that it exist at least one elements in some *inputData*
 * that are fulfilled with respect to a given expectation.
 *
 * The expectation get fulfilled if either:
 * -    (i) *when.resolve(inputData)* is fulfilled
 * -    (ii) inputData is an array that contains at least one element that verifies *when*
 *
 * In that case, the normalized data is an array containing the normalized data of the elements fulfilled.
 *
 * @param description the expectation
 * @param when
 * @param count
 * @param normalizeTo
 * @returns BaseExpectation that resolve eventually to a type T[]
 */
export function expectSome<T, TConverted = T[]>({
    description,
    when,
    count,
    normalizeTo,
}: {
    description: string
    when: IExpectation<T>
    count?: number
    normalizeTo?: (d: T[]) => TConverted
}): BaseExpectation<TConverted> {
    const fullDescription = count
        ? `${count} of "${description}"`
        : `1 or more of "${description}"`
    return new SomeOf(fullDescription, when, count, normalizeTo)
}

/**
 * ## expect
 *
 * Generic expectation creator, companion creation function of [[BaseExpectation]].
 *
 * @param description expectation's description
 * @param when either a condition that returns true if the expectation is fulfilled
 * or an expectation
 * @param normalizeTo normalizing function for fulfilled case
 * @returns BaseExpectation that resolve eventually to a type T
 */
export function expect<T>({
    description,
    when,
    normalizeTo,
}: {
    description: string
    when: (inputData: unknown) => boolean
    normalizeTo?: (data: unknown, ctx: Context) => T
}): BaseExpectation<T> {
    // if (when instanceof BaseExpectation) {
    //     return new BaseExpectation<T>(description, when, normalizeTo)
    // }

    return new Of<T>(description, when, normalizeTo)
}

/**
 * ## Contract
 *
 *
 * The objects Contract are an expectation that gather multiple expectations 😵.
 *
 * > For 'simple' cases you may not need a Contract, sticking with the functions *expect\** like in the examples
 * > provided [[contract | here]] is totally fine.
 * > This Contract class will help to go a bit further, in particular in terms of formalizing required & optionals expectations.
 *
 * Let consider the following example (and assume Material, Mesh, Option1, Option2 are known classes):
 *
 * ```typescript
 * // the next line is to avoid to write an expect statement for each and every types.
 * let expectInstanceOf = ( T, attName ) => {
 *      let isInstance = expect({when: (d) => d instanceof T})
 *      return expectAnyOf( {when:[
 *          isInstance,
 *          expectAttribute({name:attName, when: isInstance})
 *      ]
 * })
 *
 * let contract = contract({
 *       requireds: {
 *           mat:expectSingle<Material>({when: expectInstanceOf(Material, 'material' ) }),
 *           meshes:expectCount<Mesh>({count: 2, when:  expectInstanceOf(Mesh, 'mesh')}),
 *       },
 *       optionals: {
 *           options1 : expectSingle<Option1>({when: expectInstanceOf(Option1, 'option')})
 *       }
 *   })
 * ```
 *
 * Using this contract in an input will ensure we always get the following normalized
 * data-structure in the triggered callback:
 *
 * ```
 * type dataType = {
 *      mat: Material,
 *      meshes: [Mesh, Mesh],
 *      options1: Option1 | undefined,
 * }
 * ```
 */
export class Contract implements IExpectation<unknown> {
    /*
     * @param description expectation's description
     * @param requireds set of required expectations provided as a mapping using a given name
     * @param optionals set of optionals expectations provided as a mapping using a given name
     */
    constructor(
        public readonly description: string,
        public readonly requireds: { [key: string]: IExpectation<unknown> },
        public readonly optionals: {
            [key: string]: IExpectation<unknown>
        } = {},
    ) {}

    /**
     * Resolve the expectation
     *
     * The expectation get fulfilled if all the [[requireds]] expectations are.
     *
     * The normalized data is provided as dictionary *{[key:string]: normalizedData(key)}* where
     * *key* reference the keys in [[requireds]] + [[optionals]] and *normalizedData(key)*
     * the normalize data of the associated expectation.
     *
     * The class documentation provide an example of use.
     *
     * @param data Input data to evaluate the expectation on
     * @param context context
     * @return Expectation status from given inputData, either [[FulfilledExpectation]] or [[RejectedExpectation]]
     */
    resolve(
        data: unknown,
        context: Context,
    ): ExpectationStatus<{ [key: string]: unknown }> {
        const requiredStatus = new AllOf<unknown>(
            'requireds',
            Object.values(this.requireds),
        ).resolve(data, context)
        const optionalStatus = expectOptionalsOf({
            description: 'optionals',
            when: Object.values(this.optionals),
        }).resolve(data, context)

        const valuesRequired = requiredStatus.succeeded
            ? Object.entries(this.requireds).reduce((acc, [k, _v], i) => {
                  return { ...acc, ...{ [k]: requiredStatus.value[i] } }
              }, {})
            : {}
        const valuesOptional = Object.entries(this.optionals).reduce(
            (acc, [k, _v], i) => {
                return { ...acc, ...{ [k]: optionalStatus.value[i] } }
            },
            {},
        )
        const values = { ...valuesRequired, ...valuesOptional }

        return requiredStatus.succeeded
            ? new FulfilledExpectation(this, values, data, [
                  requiredStatus,
                  optionalStatus,
              ])
            : new RejectedExpectation(this, data, [
                  requiredStatus,
                  optionalStatus,
              ])
    }
}

/**
 * ## contract
 *
 * Companion creation function of [[Contract]].
 *
 * @param description expectation's description
 * @param requireds set of required expectations provided as a mapping using a given name
 * @param optionals set of optionals expectations provided as a mapping using a given name
 * @returns Contract
 */
export function contract({
    description,
    requirements,
    optionals,
}: {
    description: string
    requirements: { [_key: string]: IExpectation<unknown> }
    optionals?: { [_key: string]: IExpectation<unknown> }
}): Contract {
    return new Contract(description, requirements, optionals)
}
