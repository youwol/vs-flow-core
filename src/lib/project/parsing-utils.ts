import { Implementation, InputMessage } from '../modules'
import { IEnvironment } from '../environment'
import { Connection } from '../connections'

export async function parseDag(
    modules: Implementation[],
    environment: IEnvironment,
    flows: string | string[],
    options: {
        adaptors?: { [k: string]: ({ data, context }) => InputMessage }
        configurations?: { [k: string]: unknown }
    } = {},
) {
    const sanitizedFlows: string[] = Array.isArray(flows) ? flows : [flows]
    let existingModules = modules.reduce(
        (acc, e) => ({ ...acc, [e.uid]: e }),
        {},
    )
    const addedModules = []
    const addedConnections = []
    for (const flow of sanitizedFlows) {
        const { modules, connections } = await parseBranch(
            flow,
            existingModules,
            environment,
            options,
        )
        existingModules = modules.reduce(
            (acc, e) => ({ ...acc, [e.uid]: e }),
            existingModules,
        )
        addedModules.push(...modules)
        addedConnections.push(...connections)
    }
    return { modules: addedModules, connections: addedConnections }
}
function locations(substring, string) {
    const a = []
    let i = -1
    while ((i = string.indexOf(substring, i + 1)) >= 0) {
        a.push(i)
    }
    return a
}

async function parseBranch(
    branch: string,
    existingModules: { [k: string]: Implementation },
    environment: IEnvironment,
    options,
) {
    const starts = locations('(', branch)
    const ends = locations(')', branch)
    const modulesStr = starts.map((i0, i) => {
        return branch.substring(i0 + 1, ends[i])
    })
    const modules = await Promise.all(
        modulesStr.map((moduleStr) =>
            parseModule(moduleStr, existingModules, environment, options),
        ),
    )
    const connections = ends
        .map((i0, i) => {
            return branch.substring(i0 + 1, starts[i + 1])
        })
        .slice(0, -1)
        .map((connection, i) => {
            return parseConnection(
                connection,
                modules[i],
                modules[i + 1],
                options,
            )
        })
    return {
        modules,
        connections,
    }
}

async function parseModule(
    moduleStr,
    existingModules: { [k: string]: Implementation },
    environment: IEnvironment,
    options,
) {
    const idIndex = moduleStr.indexOf('#')
    const [typeId, moduleId] =
        idIndex != -1
            ? [
                  moduleStr.substring(0, idIndex),
                  moduleStr.substring(idIndex + 1),
              ]
            : [moduleStr, undefined]
    if (typeId == '' && existingModules[moduleId]) {
        return existingModules[moduleId]
    }
    return await environment.instantiateModule({
        typeId,
        moduleId,
        configuration: moduleId ? options[moduleId] : undefined,
    })
}

function parseConnection(
    connectionStr,
    beforeModule: Implementation,
    afterModule: Implementation,
    options,
) {
    const indexes = locations('>', connectionStr)
    let startIndex = 0
    let endIndex = 0
    if (indexes[0] > 0) {
        startIndex = parseInt(connectionStr.substring(0, indexes[0]))
    }
    if (indexes[1] < connectionStr.length - 1) {
        endIndex = parseInt(connectionStr.substring(indexes[1] + 1))
    }
    const content = connectionStr.substring(indexes[0] + 1, indexes[1])
    const uid = content.includes('#')
        ? content.substring(content.indexOf('#') + 1)
        : undefined

    return new Connection({
        start: {
            slotId: beforeModule.outputSlots[startIndex].slotId,
            moduleId: beforeModule.uid,
        },
        end: {
            slotId: afterModule.inputSlots[endIndex].slotId,
            moduleId: afterModule.uid,
        },
        configuration: uid && options[uid] ? options[uid] : {},
        uid,
    })
}
