import { BehaviorSubject, from, ReplaySubject } from 'rxjs'
import { child$, VirtualDOM } from '@youwol/flux-view'
import { ProjectState } from './project'
import { IEnvironment } from '../environment'
import { JsCode } from '../modules/configurations/attributes'

export type CellFunction = (d: {
    project: ProjectState
    cell: ProjectCell
    env: IEnvironment
}) => Promise<ProjectState>

export interface CellTrait {
    execute(project: ProjectState): Promise<ProjectState>
}
export class ProjectCell implements CellTrait {
    public readonly source: JsCode<CellFunction>
    public readonly outputs$ = new ReplaySubject<VirtualDOM>()
    public readonly environment: IEnvironment

    constructor(params: {
        source: JsCode<CellFunction>
        environment: IEnvironment
    }) {
        Object.assign(this, params)
    }
    execute(project: ProjectState): Promise<ProjectState> {
        return this.source
            .execute({ project, cell: this, env: project.environment })
            .then((project) => {
                this.outputs$.next({ class: 'fas fa-check fv-text-success' })
                this.outputs$.complete()
                return project
            })
    }

    display(...args: (VirtualDOM | string)[]) {
        this.outputs$.next({
            class: 'd-flex align-items-center',
            children: args.map((view) => {
                const vDOM = typeof view == 'string' ? stringView(view) : view
                return {
                    class: 'pr-2',
                    children: [vDOM],
                }
            }),
        })
    }

    log(...args: (string | unknown)[]) {
        const allViews = args
            .map((data) => {
                return typeof data == 'string'
                    ? stringView(data)
                    : this.environment.viewsFactory
                          .filter((view) => view.isCompatible(data))
                          .map((fact) => fact.view(data))
            })
            .flat()
        from(allViews).subscribe((view) => {
            if (view instanceof Promise) {
                this.outputs$.next({
                    children: [child$(from(view), (v) => v)],
                })
                return
            }
            this.outputs$.next(view)
        })
    }
}

function stringView(data: string | boolean | number) {
    return {
        class: 'fv-text-focus',
        innerHTML: `<b>${data}</b>`,
    }
}

export type projectsStore = Map<CellTrait, ProjectState>

export class BatchCells {
    public readonly cells: CellTrait[]
    public readonly projectsStore$: BehaviorSubject<projectsStore>

    constructor(params: {
        cells: CellTrait[]
        projectsStore$: BehaviorSubject<projectsStore>
    }) {
        Object.assign(this, params)
    }

    execute(defaultProject: ProjectState): Promise<ProjectState> {
        const projectsStore0 = this.projectsStore$.value
        if (this.cells.length == 0) {
            return Promise.resolve(defaultProject)
        }
        const currentCell =
            this.cells.length > 1
                ? this.cells[this.cells.length - 1]
                : undefined
        if (currentCell && projectsStore0.has(currentCell)) {
            return currentCell
                .execute(projectsStore0.get(currentCell))
                .then((project) => project)
        }
        if (this.cells.length == 1) {
            return this.cells[0]
                .execute(defaultProject)
                .then((project) => project)
        }
        const batch = new BatchCells({
            cells: this.cells.slice(0, -1),
            projectsStore$: this.projectsStore$,
        })
        return batch
            .execute(defaultProject)
            .then((project) => {
                const projectsStore = this.projectsStore$.value
                const newStore = new Map(projectsStore)
                newStore.set(this.cells.slice(-1)[0], project)
                this.projectsStore$.next(newStore)
                return project
            })
            .then(() => {
                return this.execute(defaultProject)
            })
    }
}
