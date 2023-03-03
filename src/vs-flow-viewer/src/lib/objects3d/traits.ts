import { Object3D } from 'three'
import { Observable } from 'rxjs'
import { UidTrait } from '../../../../lib/modules/traits'

export interface SelectableTrait<TEntity extends UidTrait> {
    selector: Selector<TEntity>
}

export class Selector<TEntity extends UidTrait> {
    public readonly entity: TEntity
    public readonly selectables: Object3D[]
    public readonly _onHovered: () => void
    public readonly _onSelected: () => void
    public readonly _onRestored: () => void
    private selected = false

    public readonly uidSelected$: Observable<string>
    constructor(params: {
        entity: TEntity
        selectables: Object3D[]
        onHovered: () => void
        onSelected: () => void
        onRestored: () => void
        uidSelected$: Observable<string>
    }) {
        this.entity = params.entity
        this.selectables = params.selectables
        this.uidSelected$ = params.uidSelected$
        this._onHovered = params.onHovered
        this._onSelected = params.onSelected
        this._onRestored = params.onRestored
        this.uidSelected$.subscribe((uid) => {
            if (uid != this.entity.uid) {
                this.selected = false
                this.onRestored()
                return
            }
            this.onSelected()
        })
        this.selectables.forEach((obj) => (obj.userData.selector = this))
    }

    getEntity(): TEntity {
        return this.entity
    }

    getSelectables() {
        return this.selectables
    }

    onHovered() {
        document.body.style.cursor = 'pointer'
        this._onHovered()
    }
    onRestored() {
        if (this.selected) {
            return
        }
        document.body.style.cursor = 'default'
        this._onRestored()
    }
    onSelected() {
        this.selected = true
        document.body.style.cursor = 'default'
        this._onSelected()
    }
}
