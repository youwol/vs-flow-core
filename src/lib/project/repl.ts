import { FlowNode, ProjectState } from './project'
import { Workflow } from '../workflows'
import { IEnvironment } from '../environment'
import { Implementation, InputMessage } from '../modules'
import { from, Observable } from 'rxjs'

export class Repl {
    public readonly environment: IEnvironment
    public state: ProjectState

    constructor(params: { environment: IEnvironment }) {
        Object.assign(this, params)
        this.state = new ProjectState({
            main: new Workflow(),
            macros: [],
            environment: this.environment,
        })
    }

    async import(fwdArgs) {
        await this.environment.import(fwdArgs)
    }

    modules() {
        return this.state.main.modules
    }

    connections() {
        return this.state.main.connections
    }

    async __(
        flows: string[] | string[][],
        options: {
            adaptors?: { [k: string]: ({ data, context }) => InputMessage }
        } = {},
    ) {
        const sanitizedFlows: string[][] =
            Array.isArray(flows) && !Array.isArray(flows[0])
                ? ([flows] as string[][])
                : (flows as string[][])
        const branches = []
        const modules = [...this.state.main.modules]
        for (const flow of sanitizedFlows) {
            const promises = flow.map((elem, i): Promise<FlowNode> => {
                return parseElement(
                    elem,
                    i == 0,
                    modules,
                    this.environment,
                    options,
                )
            })
            const branch = await Promise.all(promises)
            branches.push(branch)
        }
        this.state = this.state.addFlows(branches)
        return this
    }

    __$(
        flows: string[] | string[][],
        options: {
            adaptors?: { [k: string]: ({ data, context }) => InputMessage }
        } = {},
    ): Observable<Repl> {
        return from(this.__(flows, options))
    }
}

async function parseElement(
    elem: string,
    isStart: boolean,
    modules: Implementation[],
    environment: IEnvironment,
    options: {
        adaptors?: { [k: string]: ({ data, context }) => InputMessage }
    },
): Promise<FlowNode> {
    /**
     * #filter
     * #filter>0
     * 1>#filter
     * 0->#filter->0
     * '0>#filter('f0',{"aza":0})>0'
     * '0>#filter({"aza":0})>0'
     * 'a0=0>#filter({"aza":0})>0'
     */
    const parts = elem.split('>')
    let adaptor
    let input = '0',
        module: string,
        output = '0'
    if (parts.length == 3) {
        input = parts[0]
        module = parts[1]
        output = parts[2]
    }
    if (parts.length == 2 && parseInt(parts[1]) == parseInt(parts[1])) {
        module = parts[0]
        output = parts[1]
    }
    if (parts.length == 2 && parseInt(parts[1]) != parseInt(parts[1])) {
        input = parts[0]
        module = parts[1]
    }
    if (parts.length == 1) {
        module = parts[0]
    }
    if (input.includes('=')) {
        adaptor = input.substring(0, input.indexOf('='))
        input = input.substring(input.indexOf('=') + 1) || '0'
    }
    if (module[0] == '#') {
        // reference instances
        const instance = modules.find((m) => m.uid == module.substr(1))
        modules.push(instance)
        return new FlowNode({
            module: instance,
            input: instance.inputSlots[parseInt(input)].slotId,
            output: instance.outputSlots[parseInt(output)].slotId,
        })
    }
    // new instances
    let moduleId = undefined
    let conf = undefined
    const result = /\(([^)]+)\)/.exec(module)
    if (!result) {
        const instance = await environment.instantiateModule({
            typeId: module,
        })
        return new FlowNode({
            module: instance,
            input: isStart
                ? undefined
                : instance.inputSlots[parseInt(input)].slotId,
            output: instance.outputSlots[parseInt(output)].slotId,
            adaptor: adaptor && options.adaptors[adaptor],
        })
    }
    const [outer, arg] = result
    const type = module.split(outer)[0]
    const args = arg.split(',')
    if (args[0].includes('{')) {
        conf = JSON.parse(args[0])
    } else {
        moduleId = args[0]
    }
    if (args[1]) {
        conf = JSON.parse(args[1])
    }
    const instance = await environment.instantiateModule({
        typeId: type,
        moduleId,
        configuration: conf,
    })
    modules.push(instance)
    return new FlowNode({
        module: instance,
        input: instance.inputSlots[parseInt(input)].slotId,
        output: instance.outputSlots[parseInt(output)].slotId,
        adaptor: adaptor && options.adaptors[adaptor],
    })
}
