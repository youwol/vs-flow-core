import { DockableTabs } from '@youwol/fv-tabs'

/**
 * @category View
 */
export class ReplTab extends DockableTabs.Tab {
    constructor() {
        super({
            id: 'REPL',
            title: 'REPL',
            icon: '',
            content: () => {
                return {
                    style: {
                        width: '300px',
                    },
                    children: [
                        {
                            innerText: 'REPL Content View',
                        },
                    ],
                }
            },
        })
    }
}
