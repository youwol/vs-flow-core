import { Mesh } from 'three'
import { Implementation } from '../../../../lib/modules'

export interface SelectableTrait {
    getEntity(): Implementation

    getSelectables(): Mesh[]

    onHovered: () => void
    onRestored: () => void
    onSelected: () => void
}
