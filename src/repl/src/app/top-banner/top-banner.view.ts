import { TopBannerView as TopBannerBaseView } from '@youwol/os-top-banner'

/**
 * @category View
 */
export class TopBannerView extends TopBannerBaseView {
    constructor() {
        super({
            innerView: {
                class: 'd-flex w-100 justify-content-center my-auto align-items-center',
                children: [],
            },
        })
    }
}
