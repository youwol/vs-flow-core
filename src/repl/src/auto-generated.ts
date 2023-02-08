
const runTimeDependencies = {
    "externals": {
        "rxjs": "^6.5.5",
        "@youwol/flux-view": "^1.0.3",
        "@youwol/http-clients": "^2.0.3",
        "@youwol/http-primitives": "^0.1.2",
        "@youwol/cdn-client": "^1.0.2"
    },
    "includedInBundle": {}
}
const externals = {
    "rxjs": "window['rxjs_APIv6']",
    "@youwol/flux-view": "window['@youwol/flux-view_APIv1']",
    "@youwol/http-clients": "window['@youwol/http-clients_APIv2']",
    "@youwol/http-primitives": "window['@youwol/http-primitives_APIv01']",
    "@youwol/cdn-client": "window['@youwol/cdn-client_APIv1']",
    "rxjs/operators": "window['rxjs_APIv6']['operators']"
}
const exportedSymbols = {
    "rxjs": {
        "apiKey": "6",
        "exportedSymbol": "rxjs"
    },
    "@youwol/flux-view": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/flux-view"
    },
    "@youwol/http-clients": {
        "apiKey": "2",
        "exportedSymbol": "@youwol/http-clients"
    },
    "@youwol/http-primitives": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/http-primitives"
    },
    "@youwol/cdn-client": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/cdn-client"
    }
}

const mainEntry : {entryFile: string,loadDependencies:string[]} = {
    "entryFile": "./index.ts",
    "loadDependencies": [
        "rxjs",
        "@youwol/flux-view",
        "@youwol/http-clients",
        "@youwol/http-primitives",
        "@youwol/cdn-client"
    ]
}

const secondaryEntries : {[k:string]:{entryFile: string, name: string, loadDependencies:string[]}}= {}

const entries = {
     '@youwol/vs-flow-repl': './index.ts',
    ...Object.values(secondaryEntries).reduce( (acc,e) => ({...acc, [`@youwol/vs-flow-repl/${e.name}`]:e.entryFile}), {})
}
export const setup = {
    name:'@youwol/vs-flow-repl',
        assetId:'QHlvdXdvbC92cy1mbG93LXJlcGw=',
    version:'0.0.1-wip',
    shortDescription:"vs-flow REPL",
    developerDocumentation:'https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/vs-flow-repl',
    npmPackage:'https://www.npmjs.com/package/@youwol/vs-flow-repl',
    sourceGithub:'https://github.com/youwol/vs-flow-repl',
    userGuide:'https://l.youwol.com/doc/@youwol/vs-flow-repl',
    apiVersion:'001',
    runTimeDependencies,
    externals,
    exportedSymbols,
    entries,
    secondaryEntries,
    getDependencySymbolExported: (module:string) => {
        return `${exportedSymbols[module].exportedSymbol}_APIv${exportedSymbols[module].apiKey}`
    },

    installMainModule: ({cdnClient, installParameters}:{
        cdnClient:{install:(unknown) => Promise<Window>},
        installParameters?
    }) => {
        const parameters = installParameters || {}
        const scripts = parameters.scripts || []
        const modules = [
            ...(parameters.modules || []),
            ...mainEntry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/vs-flow-repl_APIv001`]
        })
    },
    installAuxiliaryModule: ({name, cdnClient, installParameters}:{
        name: string,
        cdnClient:{install:(unknown) => Promise<Window>},
        installParameters?
    }) => {
        const entry = secondaryEntries[name]
        if(!entry){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const parameters = installParameters || {}
        const scripts = [
            ...(parameters.scripts || []),
            `@youwol/vs-flow-repl#0.0.1-wip~dist/@youwol/vs-flow-repl/${entry.name}.js`
        ]
        const modules = [
            ...(parameters.modules || []),
            ...entry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/vs-flow-repl/${entry.name}_APIv001`]
        })
    },
    getCdnDependencies(name?: string){
        if(name && !secondaryEntries[name]){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const deps = name ? secondaryEntries[name].loadDependencies : mainEntry.loadDependencies

        return deps.map( d => `${d}#${runTimeDependencies.externals[d]}`)
    }
}
