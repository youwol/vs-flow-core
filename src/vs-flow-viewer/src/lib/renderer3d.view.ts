import { VirtualDOM } from '@youwol/flux-view'
import { Vector3 } from 'three'

import { renderDag } from './dag'
import { ProjectState } from '../../../lib/project'
import { Environment3D, SelectableMesh } from './environment3d'
import { ReplaySubject } from 'rxjs'

export class Renderer3DView {
    public readonly class = 'h-100 w-100'
    public readonly style = {
        position: 'relative',
    }
    public readonly project: ProjectState
    public readonly children: VirtualDOM[]
    public readonly positions: { [_k: string]: Vector3 }

    public environment3D: Environment3D

    constructor(params: {
        project: ProjectState
        uidSelected: ReplaySubject<string>
    }) {
        Object.assign(this, params)

        this.positions =
            this.project.main.modules.length > 0 ? renderDag(this.project) : {}

        this.children = [
            {
                class: 'h-100 w-100',
                connectedCallback: (htmlElement: HTMLDivElement) => {
                    this.environment3D = new Environment3D({
                        htmlElementContainer: htmlElement,
                        project: this.project,
                        positions: this.positions,
                        uidSelected$: params.uidSelected,
                    })
                    animate(this.environment3D)
                },
            },
        ]
    }
}

function animate(environment3d: Environment3D) {
    environment3d.controls.update()
    requestAnimationFrame(() => animate(environment3d))
    render(environment3d)
}

function render(environment3d: Environment3D) {
    environment3d.renderer.render(environment3d.scene, environment3d.camera)
    environment3d.labelRenderer.render(
        environment3d.scene,
        environment3d.camera,
    )
    environment3d.rayCaster.setFromCamera(
        environment3d.pointer,
        environment3d.camera,
    )

    const intersects = environment3d.rayCaster.intersectObjects(
        environment3d.selectables,
    )

    if (intersects.length > 0) {
        const obj = intersects[0].object as unknown as SelectableMesh
        if (environment3d.hovered && environment3d.hovered == obj) {
            return
        }
        if (environment3d.hovered && environment3d.hovered != obj) {
            environment3d.hovered.userData.selectableTrait.onRestored()
            environment3d.hovered = obj
        }
        environment3d.hovered = intersects[0]
            .object as unknown as SelectableMesh
        environment3d.hovered.userData.selectableTrait.onHovered()
    }
    if (intersects.length == 0 && environment3d.hovered) {
        environment3d.hovered.userData.selectableTrait.onRestored()
        environment3d.hovered = undefined
    }
}
