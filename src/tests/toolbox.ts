import { RxjsFilter, RxjsMergeMap } from './modules-implementation/rxjs.modules'
import { setup } from '../auto-generated'
import { Modules } from '..'
import { ToolBox } from '../lib/environment'

type SphereModule = typeof import('./modules-implementation/sphere.module')

const auxModuleSphere = 'test-sphere-module'
export const toolbox = new ToolBox({
    modules: [
        new Modules.Module({
            declaration: {
                typeId: 'filter',
            },
            implementation: (fwdParams) => {
                return Promise.resolve(new RxjsFilter(fwdParams))
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
                typeId: 'sphere',
                dependencies: {
                    modules: setup.getCdnDependencies('test-sphere-module'),
                    scripts: [
                        //setup.getAuxiliaryModulePath(auxModuleSphere)
                        `${setup.name}#${setup.version}~dist/${setup.name}/${auxModuleSphere}.js`,
                    ],
                },
            },
            implementation: ({ fwdParams }) => {
                // const SphereModule = await import('./sphere.module')
                // const SphereModule: SphereModule = setup.getAuxiliaryModule<SphereModule>(auxModuleSphere)
                const SphereModule: SphereModule =
                    window[
                        `${setup.name}/${auxModuleSphere}_API${setup.apiVersion}`
                    ]
                return new SphereModule.Sphere(fwdParams)
            },
        }),
    ],
})
