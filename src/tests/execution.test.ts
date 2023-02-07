import { Repl } from '../lib/project/repl'
import { TestEnvironment } from './environment'
import { toolbox } from './toolbox'
import { mergeMap } from 'rxjs/operators'
import { Mesh, MeshStandardMaterial } from 'three'

// eslint-disable-next-line jest/no-done-callback -- more readable that way
test('execution', (done) => {
    const repl = new Repl({
        environment: new TestEnvironment({ toolboxes: [toolbox] }),
    })

    repl.__$(['of', 'filter', 'a0=0>sphere(s0)'], {
        adaptors: {
            a0: ({ context }) => {
                return { data: new MeshStandardMaterial(), context }
            },
        },
    })
        .pipe(
            mergeMap((repl) => {
                return repl.state.getObservable({
                    moduleId: 's0',
                    slotId: 'output$',
                })
            }),
        )
        .subscribe(({ data }) => {
            expect(data).toBeInstanceOf(Mesh)
            done()
        })
})
