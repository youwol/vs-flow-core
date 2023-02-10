import { setup } from '../auto-generated'
import { PlotModule } from './modules-implementation/plot.module'
import { Implementation } from '../lib/modules'
import { Modules, ToolBox } from '..'
import { toolboxes } from '../toolboxes'

type SphereModule = typeof import('./modules-implementation/sphere.module')

const auxModuleSphere = 'test-sphere-module'

export const toolbox = new ToolBox({
    name: 'test-toolbox',
    uid: '@youwol/vs-flow-core/test-toolbox',
    modules: [
        ...toolboxes.rxjs.modules,
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
                return new SphereModule.Sphere(fwdParams) as Implementation
            },
        }),
        new Modules.Module({
            declaration: {
                typeId: 'plot',
            },
            implementation: ({ fwdParams }) => {
                return new Promise<Implementation>((resolve) => {
                    setTimeout(() => resolve(new PlotModule(fwdParams)), 0)
                })
            },
        }),
    ],
})
