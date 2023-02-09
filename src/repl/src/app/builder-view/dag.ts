import {
    Dag,
    dagStratify,
    decrossOpt,
    layeringLongestPath,
    sugiyama,
} from 'd3-dag'
import { ProjectState } from '../../../../lib/project'

export function renderDag(project: ProjectState) {
    const data = project.main.modules.map((module) => {
        const connections = project.main.connections.filter((connection) => {
            return connection.end.moduleId == module.uid
        })
        return {
            id: module.uid,
            parentIds: connections.map(
                (connection) => connection.start.moduleId,
            ),
        }
    })

    const dag = dagStratify()(data)

    const layout = sugiyama()
        .layering(layeringLongestPath())
        // minimize number of crossings
        .decross(decrossOpt())
        // set node size instead of constraining to fit
        .nodeSize((n) => [(n ? 3.6 : 0.25) * 10, 40])

    layout(dag as Dag<never, never>)

    const positions = dag['proots']
        ? dag['proots']
              .reduce((acc, e) => [...acc, extractPosition(e)], [])
              .flat()
        : extractPosition(dag)
    const result: { [k: string]: { x: number; y: number } } = positions.reduce(
        (acc, e) => ({ ...acc, [e.id]: e }),
        {},
    )

    const values = Object.values(result)
    const count = values.length
    const average = values.reduce(
        (acc, e) => ({ x: acc.x + e.x / count, y: acc.y + e.y / count }),
        { x: 0, y: 0 },
    )
    Object.values(result).forEach((p) => {
        p.x = p.x - average.x
        p.y = p.y - average.y
    })
    return result
}
export function extractPosition(level) {
    const pos = { id: level.data.id, x: level.y, y: level.x }
    const children = level.dataChildren.map((child) => {
        return extractPosition(child.child)
    })
    return [[pos], ...children].flat()
}
