import { FlowNode, ProjectState } from './project'
import { Workflow } from '../workflows'
import { IEnvironment } from '../environment'
import { Implementation, InputMessage } from '../modules'
import { BehaviorSubject, from, Observable } from 'rxjs'

export class Repl {
    public readonly environment: IEnvironment
    public project$: BehaviorSubject<ProjectState>

    constructor(params: { environment: IEnvironment }) {
        Object.assign(this, params)
        const project = new ProjectState({
            main: new Workflow(),
            macros: [],
            environment: this.environment,
        })
        this.project$ = new BehaviorSubject(project)
    }

    async import(fwdArgs) {
        await this.environment.import(fwdArgs)
    }

    async __(
        flows: string[] | string[][],
        options: {
            adaptors?: { [k: string]: ({ data, context }) => InputMessage }
            configurations?: { [k: string]: unknown }
        } = {},
    ) {
        const project = this.project$.value
        const sanitizedFlows: string[][] =
            Array.isArray(flows) && !Array.isArray(flows[0])
                ? ([flows] as string[][])
                : (flows as string[][])
        const branches = []
        const modules = [...project.main.modules]
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
        const newProject = project.addFlows(branches)
        this.project$.next(newProject)
        return { project: newProject }
    }

    __$(
        flows: string[] | string[][],
        options: {
            adaptors?: { [k: string]: ({ data, context }) => InputMessage }
            configurations?: { [k: string]: unknown }
        } = {},
    ): Observable<{ project: ProjectState }> {
        return from(this.__(flows, options))
    }

    organize(
        data: [{ layerId: string; parentLayerId?: string; uids: string[] }],
    ) {
        const project = this.project$.value
        const newProject = data.reduce((acc, e) => {
            return project.addLayer(e)
        }, project)
        this.project$.next(newProject)
        return { project: newProject }
    }
}

async function parseElement(
    elem: string,
    isStart: boolean,
    modules: Implementation[],
    environment: IEnvironment,
    options: {
        adaptors?: { [k: string]: ({ data, context }) => InputMessage }
        configurations?: { [k: string]: unknown }
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
        const result = /{(.*?)}/.exec(module)
        conf = result[1].includes('@')
            ? options.configurations[result[1]]
            : JSON.parse(args[0])
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
        input: isStart
            ? undefined
            : instance.inputSlots[parseInt(input)].slotId,
        output: instance.outputSlots[parseInt(output)].slotId,
        adaptor: adaptor && options.adaptors[adaptor],
    })
}
