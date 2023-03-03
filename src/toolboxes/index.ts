/**
 * Public API Surface
 *
 * @format
 */
import { toolbox as tbRxjs } from './rxjs'
import { toolbox as tbCore } from './core'

export const toolboxes = {
    rxjs: tbRxjs(),
    core: tbCore(),
}
