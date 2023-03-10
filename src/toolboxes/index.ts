/**
 * Public API Surface
 *
 * @format
 */
import { toolbox as tbRxjs } from './rxjs'
import { toolbox as tbCore } from './core'
import { toolbox as tbThree } from './three'

export const toolboxes = {
    rxjs: tbRxjs(),
    core: tbCore(),
    three: tbThree(),
}
