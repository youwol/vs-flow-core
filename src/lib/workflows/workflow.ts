import { Modules, Connections } from './..'
import { UidTrait } from '../modules/traits'

export class Layer {
    public readonly moduleIds: string[] = []
    public readonly children: Array<Layer> = []
}
export class Organizer {
    public readonly root: Layer = new Layer()
}

export class Workflow implements UidTrait {
    public readonly uid: string
    public readonly modules: Modules.Implementation[] = []
    public readonly connections: Connections.Connection[] = []

    public readonly organizer: Organizer = new Organizer()

    constructor(
        params: {
            modules?: Modules.Implementation[]
            connections?: Connections.Connection[]
            organizer?: Organizer
        } = {},
    ) {
        Object.assign(this, params)
    }
}

/**
 * \\main *timer @main #timer0
 * async ({vsf, environment}){
 * const {Timer, CombineLatest, Viewer3D, Button} = await environment.installModules({
 *      Timer:'@youwol/vs-flow-core.Timer',
 *      CombineLatest:'@youwol/vs-flow-core.CombineLatest',
 * }
 * branch=[
 *      [vsf(Timer, {count:1000}), vsf(CombineLatest,'comb0',{count:2}), vsf(Viewer3D)]
 * ]
 *
 * state = state.main.addFlows({flows:[vsf(Button, button0, {}), vsf('combo0', 1)]})
 * const Macro0 = state.addMacros('Macro0').addFlow(branch, 'Macro0')
 *
 * branch = [button0.clone(), Macro0('m_0').plugin('replica')]
 *
 * state.main.setLayout({
 *      class:'d-flex w-100 h-100',
 *      children:[
 *          {
 *              id:'button0'
 *          },
 *          {
 *              id:'viewer0'
 *          }
 *      ]
 * })
 */
/**
 *
 * return (data, context) => {
 *      const flow = project.instantiate('flow_id')
 *      setTimeout(() => {})
 *      return of(data).pipe(
 *          macros.get(macro_id, {input$: data, output})
 *
 *      )
 *     return fromFetch(data)
 *     return macros.get(macro_id).call({inputs:{input$:data}, {})
 * }
 */
