import { Modules, ToolBox } from '../../lib'
import {
    RxjsCombineLatest,
    RxjsFilter,
    RxjsForkJoin,
    RxjsMap,
    RxjsMerge,
    RxjsMergeMap,
    RxjsOf,
    RxjsTake,
    RxjsTimer,
} from './rxjs.modules'

export function toolbox() {
    return new ToolBox({
        name: 'rxjs',
        uid: '@youwol/vs-flow-core/rxjs',
        modules: [
            new Modules.Module({
                declaration: {
                    typeId: 'of',
                },
                implementation: ({ fwdParams }) => {
                    return new RxjsOf(fwdParams)
                },
            }),
            new Modules.Module({
                declaration: {
                    typeId: 'filter',
                },
                implementation: ({ fwdParams }) => {
                    return new RxjsFilter(fwdParams)
                },
            }),
            new Modules.Module({
                declaration: {
                    typeId: 'map',
                },
                implementation: ({ fwdParams }) => {
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
            new Modules.Module({
                declaration: {
                    typeId: 'timer',
                },
                implementation: ({ fwdParams }) => {
                    return new RxjsTimer(fwdParams)
                },
            }),
            new Modules.Module({
                declaration: {
                    typeId: 'take',
                },
                implementation: ({ fwdParams }) => {
                    return new RxjsTake(fwdParams)
                },
            }),
            new Modules.Module({
                declaration: {
                    typeId: 'combineLatest',
                },
                implementation: ({ fwdParams }) => {
                    return new RxjsCombineLatest(fwdParams)
                },
            }),
            new Modules.Module({
                declaration: {
                    typeId: 'merge',
                },
                implementation: ({ fwdParams }) => {
                    return new RxjsMerge(fwdParams)
                },
            }),
            new Modules.Module({
                declaration: {
                    typeId: 'forkJoin',
                },
                implementation: ({ fwdParams }) => {
                    return new RxjsForkJoin(fwdParams)
                },
            }),
        ],
    })
}
