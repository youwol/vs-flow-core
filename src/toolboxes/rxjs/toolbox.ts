import { Modules, ToolBox } from '../../lib'
import { RxjsFilter, RxjsMap, RxjsMergeMap, RxjsOf } from './rxjs.modules'

export function toolbox() {
    return new ToolBox({
        modules: [
            new Modules.Module({
                declaration: {
                    typeId: 'of',
                },
                implementation: (fwdParams) => {
                    return new RxjsOf(fwdParams)
                },
            }),
            new Modules.Module({
                declaration: {
                    typeId: 'filter',
                },
                implementation: (fwdParams) => {
                    return new RxjsFilter(fwdParams)
                },
            }),
            new Modules.Module({
                declaration: {
                    typeId: 'map',
                },
                implementation: (fwdParams) => {
                    return new RxjsMap(fwdParams)
                },
            }),
            new Modules.Module({
                declaration: {
                    typeId: 'mergeMap',
                },
                implementation: ({ fwdParams }) => {
                    return new RxjsMergeMap(fwdParams)
                },
            }),
        ],
    })
}
