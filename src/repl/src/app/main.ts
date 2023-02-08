require('./style.css')
export {}
import * as cdnClient from '@youwol/cdn-client'
import { setup } from '../auto-generated'

/**
 *  To take advantage of YouWol ecosystem, the dependencies are not included in the bundle but are kept 'externals'.
 *  This file handle the actual installation of them (if needed, they will most likely already be cached by the browser).
 */
await setup.installMainModule({
    cdnClient,
    installParameters: {
        css: [
            'bootstrap#4.4.1~bootstrap.min.css',
            'fontawesome#5.12.1~css/all.min.css',
            '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
        ],
        displayLoadingScreen: true,
    },
})

await import('./on-load')
