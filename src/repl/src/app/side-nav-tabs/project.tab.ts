import { DockableTabs } from '@youwol/fv-tabs'

/**
 * @category View
 */
export class ProjectTab extends DockableTabs.Tab {
    constructor() {
        super({
            id: 'Project',
            title: 'Project',
            icon: '',
            content: () => {
                return {
                    style: {
                        width: '300px',
                    },
                    children: [
                        {
                            innerText: 'Project Content View',
                        },
                    ],
                }
            },
        })
    }
}
