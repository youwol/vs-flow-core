import { Implementation, InputMessage } from '../modules'
import { FlowNode, ProjectState } from './project'
import { IEnvironment } from '../environment'
import { Connection } from '../connections'
import { Layer, Workflow } from '../workflows'
import { Modules } from '..'

export function addFlows(
    project: ProjectState,
    flows: FlowNode[][],
): ProjectState {
    const {
        modules,
        connections,
    }: { modules: Modules.Implementation[]; connections: Connection[] } = flows
        .map((flow) => {
            const starts = flow.slice(0, -1)
            const ends = flow.slice(1)
            const modules = flow.map(({ module }) => module)
            const connections = starts.map((start, i) => {
                const end = ends[i]
                return new Connection({
                    start: {
                        moduleId: start.module.uid,
                        slotId: start.output,
                    },
                    end: {
                        moduleId: end.module.uid,
                        slotId: end.input,
                    },
                    configuration: { adaptor: end.adaptor },
                })
            })
            return { modules, connections }
        })
        .reduce(
            (acc, e) => {
                return {
                    modules: [...acc.modules, ...e.modules],
                    connections: [...acc.connections, ...e.connections],
                }
            },
            { modules: [], connections: [] },
        )
    const modulesSet = new Set([...project.main.modules, ...modules])
    const root = project.main.rootLayer
    const rootModuleIds = new Set([
        ...root.moduleIds,
        ...modules.map((m) => m.uid),
    ])
    return new ProjectState({
        ...project,
        main: new Workflow({
            modules: [...modulesSet],
            connections: [...project.main.connections, ...connections],
            rootLayer: new Layer({
                uid: root.uid,
                children: root.children,
                moduleIds: [...rootModuleIds],
            }),
        }),
    })
}

export async function parseDag(
    modules: Implementation[],
    environment: IEnvironment,
    flows: string[] | string[][],
    options: {
        adaptors?: { [k: string]: ({ data, context }) => InputMessage }
        configurations?: { [k: string]: unknown }
    } = {},
) {
    const sanitizedFlows: string[][] =
        Array.isArray(flows) && !Array.isArray(flows[0])
            ? ([flows] as string[][])
            : (flows as string[][])
    const branches = []
    const modulesCopy = [...modules]
    for (const flow of sanitizedFlows) {
        const promises = flow.map((elem, i): Promise<FlowNode> => {
            return parseElement(elem, i == 0, modulesCopy, environment, options)
        })
        const branch = await Promise.all(promises)
        branches.push(branch)
    }
    return branches
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
            input: isStart
                ? undefined
                : instance.inputSlots[parseInt(input)].slotId,
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
        //conf = parseConfig(module)
        const result = /{(.*?)}/.exec(module)
        conf = result[1].includes('@')
            ? options.configurations[result[1]]
            : JSON.parse(args[0])
    } else {
        moduleId = args[0]
    }
    if (args[1] && args[1].includes('{')) {
        const result = /{(.*?)}/.exec(args[1])
        conf = result[1].includes('@')
            ? options.configurations[result[1]]
            : JSON.parse(args[1])
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
