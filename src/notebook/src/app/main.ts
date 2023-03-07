import { Client, LoadingScreenView } from '@youwol/cdn-client'

require('./style.css')
export {}
import * as cdnClient from '@youwol/cdn-client'
import { setup } from '../auto-generated'

const loadingScreen = new LoadingScreenView()
loadingScreen.render()
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
            'codemirror#5.52.0~codemirror.min.css',
            'codemirror#5.52.0~theme/blackboard.min.css',
        ],
        scripts: [
            'codemirror#5.52.0~mode/javascript.min.js',
            'codemirror#5.52.0~mode/markdown.min.js',
            'codemirror#5.52.0~mode/css.min.js',
            'codemirror#5.52.0~mode/xml.min.js',
            'codemirror#5.52.0~mode/htmlmixed.min.js',
            'codemirror#5.52.0~mode/gfm.min.js',
        ],
        onEvent: (ev) => {
            loadingScreen.next(ev)
        },
    },
})

Client['initialLoadingScreen'] = loadingScreen

await import('./on-load')
