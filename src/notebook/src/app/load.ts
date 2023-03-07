import { LoadingScreenView, CdnMessageEvent } from '@youwol/cdn-client'
import { forkJoin, Observable } from 'rxjs'
import { AssetsGateway, AssetsBackend } from '@youwol/http-clients'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { map, tap } from 'rxjs/operators'
/**
 *
 * @param assetId asset id of the fs-flow repl project
 * @param loadingScreen loading screen to append loading events
 * @returns application state & application view
 */
export function load$(
    assetId: string,
    loadingScreen: LoadingScreenView,
): Observable<{
    content
    permissions
}> {
    const client = new AssetsGateway.AssetsGatewayClient()
    loadingScreen.next(
        new CdnMessageEvent('fetch_content', 'Fetch REPL worksheet...'),
    )

    return forkJoin([
        client.assets.getFile$({ assetId, path: 'source.json' }).pipe(
            raiseHTTPErrors(),
            tap(() =>
                loadingScreen.next(
                    new CdnMessageEvent(
                        'fetch_content',
                        'Fetch REPL worksheet...done',
                    ),
                ),
            ),
        ),
        client.assets.queryAccessInfo$({ assetId }).pipe(
            raiseHTTPErrors(),
            tap(() =>
                loadingScreen.next(
                    new CdnMessageEvent(
                        'fetch_access',
                        'Retrieve access...done',
                    ),
                ),
            ),
            map(
                (access: AssetsBackend.QueryAccessInfoResponse) =>
                    access.consumerInfo.permissions,
            ),
        ),
    ]).pipe(
        tap(() => loadingScreen.done()),
        map(([content, permissions]) => ({
            content,
            permissions,
        })),
    )
}
