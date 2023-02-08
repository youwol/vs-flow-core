import shutil
from pathlib import Path

from youwol.pipelines.pipeline_typescript_weback_npm import Template, PackageType, Dependencies, \
    RunTimeDeps, generate_template, Bundles, MainModule, AuxiliaryModule
from youwol_utils import parse_json

folder_path = Path(__file__).parent

pkg_json = parse_json(folder_path / 'package.json')

load_dependencies = {
    'rxjs': '^6.5.5',
    '@youwol/cdn-client': '^1.0.2',
    '@youwol/logging': '^0.0.2',
}

template = Template(
    path=folder_path,
    type=PackageType.Library,
    name=pkg_json['name'],
    version=pkg_json['version'],
    shortDescription=pkg_json['description'],
    author=pkg_json['author'],
    dependencies=Dependencies(
        runTime=RunTimeDeps(
            externals={**load_dependencies,
                       # three is a dev dependencies for testing, it is included here to work properly as external
                       # for the auxiliary module test-sphere-module.
                       # py-youwol & pipeline-ts should be improved to handle the case of external dev-dependencies.
                       'three': '^0.128.0'},
            includedInBundle={}
        ),
        devTime={
            '@youwol/flux-view': '^1.0.3'
        }
    ),
    userGuide=True,
    bundles=Bundles(
        mainModule=MainModule(
            entryFile='./index.ts',
            loadDependencies=list(load_dependencies.keys())
        ),
        auxiliaryModules=[
            AuxiliaryModule(
                name="test-sphere-module",
                entryFile="./tests/modules-implementation/sphere.module.ts",
                loadDependencies=['three', "rxjs"]
            ),
            AuxiliaryModule(
                name="rxjs",
                entryFile="./toolboxes/rxjs/index.ts",
                loadDependencies=["rxjs"]
            )
        ]
    )
)

generate_template(template)

shutil.copyfile(
    src=folder_path / '.template' / 'src' / 'auto-generated.ts',
    dst=folder_path / 'src' / 'auto-generated.ts'
)

for file in ['README.md', '.gitignore', '.npmignore', '.prettierignore', 'LICENSE', 'package.json',
             'tsconfig.json', 'webpack.config.ts']:
    shutil.copyfile(
        src=folder_path / '.template' / file,
        dst=folder_path / file
    )


