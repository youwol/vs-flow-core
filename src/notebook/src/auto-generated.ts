
const runTimeDependencies = {
    "externals": {
        "rxjs": "^6.5.5",
        "@youwol/logging": "^0.1.0",
        "@youwol/http-clients": "^2.0.5",
        "@youwol/http-primitives": "^0.1.2",
        "@youwol/flux-view": "^1.1.0",
        "@youwol/cdn-client": "^1.0.2",
        "@youwol/fv-tabs": "^0.2.1",
        "@youwol/os-top-banner": "^0.1.1",
        "@youwol/fv-code-mirror-editors": "^0.2.2",
        "@youwol/fv-tree": "^0.2.3",
        "three-trackballcontrols": "^0.0.8",
        "three": "^0.128.0",
        "marked": "^4.2.3"
    },
    "includedInBundle": {
        "d3-dag": "0.8.2",
        "client-zip": "2.3.0"
    }
}
const externals = {
    "rxjs": "window['rxjs_APIv6']",
    "@youwol/logging": "window['@youwol/logging_APIv01']",
    "@youwol/http-clients": "window['@youwol/http-clients_APIv2']",
    "@youwol/http-primitives": "window['@youwol/http-primitives_APIv01']",
    "@youwol/flux-view": "window['@youwol/flux-view_APIv1']",
    "@youwol/cdn-client": "window['@youwol/cdn-client_APIv1']",
    "@youwol/fv-tabs": "window['@youwol/fv-tabs_APIv02']",
    "@youwol/os-top-banner": "window['@youwol/os-top-banner_APIv01']",
    "@youwol/fv-code-mirror-editors": "window['@youwol/fv-code-mirror-editors_APIv02']",
    "@youwol/fv-tree": "window['@youwol/fv-tree_APIv02']",
    "three-trackballcontrols": "window['TrackballControls_APIv008']",
    "three": "window['THREE_APIv0128']",
    "marked": "window['marked_APIv4']",
    "rxjs/operators": "window['rxjs_APIv6']['operators']"
}
const exportedSymbols = {
    "rxjs": {
        "apiKey": "6",
        "exportedSymbol": "rxjs"
    },
    "@youwol/logging": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/logging"
    },
    "@youwol/http-clients": {
        "apiKey": "2",
        "exportedSymbol": "@youwol/http-clients"
    },
    "@youwol/http-primitives": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/http-primitives"
    },
    "@youwol/flux-view": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/flux-view"
    },
    "@youwol/cdn-client": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/cdn-client"
    },
    "@youwol/fv-tabs": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/fv-tabs"
    },
    "@youwol/os-top-banner": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/os-top-banner"
    },
    "@youwol/fv-code-mirror-editors": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/fv-code-mirror-editors"
    },
    "@youwol/fv-tree": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/fv-tree"
    },
    "three-trackballcontrols": {
        "apiKey": "008",
        "exportedSymbol": "TrackballControls"
    },
    "three": {
        "apiKey": "0128",
        "exportedSymbol": "THREE"
    },
    "marked": {
        "apiKey": "4",
        "exportedSymbol": "marked"
    }
}

const mainEntry : {entryFile: string,loadDependencies:string[]} = {
    "entryFile": "./index.ts",
    "loadDependencies": [
        "rxjs",
        "@youwol/logging",
        "@youwol/http-clients",
        "@youwol/http-primitives",
        "@youwol/flux-view",
        "@youwol/cdn-client",
        "@youwol/fv-tabs",
        "@youwol/os-top-banner",
        "@youwol/fv-code-mirror-editors",
        "@youwol/fv-tree",
        "three-trackballcontrols",
        "three",
        "marked"
    ]
}

const secondaryEntries : {[k:string]:{entryFile: string, name: string, loadDependencies:string[]}}= {}

const entries = {
     '@youwol/vsf-notebook': './index.ts',
    ...Object.values(secondaryEntries).reduce( (acc,e) => ({...acc, [`@youwol/vsf-notebook/${e.name}`]:e.entryFile}), {})
}
export const setup = {
    name:'@youwol/vsf-notebook',
        assetId:'QHlvdXdvbC92c2Ytbm90ZWJvb2s=',
    version:'0.0.1-wip',
    shortDescription:"",
    developerDocumentation:'https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/vsf-notebook',
    npmPackage:'https://www.npmjs.com/package/@youwol/vsf-notebook',
    sourceGithub:'https://github.com/youwol/vsf-notebook',
    userGuide:'https://l.youwol.com/doc/@youwol/vsf-notebook',
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
            return window[`@youwol/vsf-notebook_APIv001`]
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
            `@youwol/vsf-notebook#0.0.1-wip~dist/@youwol/vsf-notebook/${entry.name}.js`
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
            return window[`@youwol/vsf-notebook/${entry.name}_APIv001`]
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
