import shutil
from pathlib import Path

from youwol.pipelines.pipeline_typescript_weback_npm import Template, PackageType, Dependencies, \
    RunTimeDeps, generate_template, Bundles, MainModule
from youwol_utils import parse_json

folder_path = Path(__file__).parent

pkg_json = parse_json(folder_path / 'package.json')

load_dependencies = {
    "@youwol/flux-view": "^1.0.3",
    "rxjs": "^6.5.5",
    "three-trackballcontrols": "^0.0.8",
    "three": '^0.128.0'
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
            externals=load_dependencies,
            includedInBundle={
                "d3-dag": "0.8.2"
            }
        ),
        devTime={
            "@types/three": "^0.128.0"
        }
    ),
    bundles=Bundles(
          mainModule=MainModule(
              entryFile='./index.ts',
              loadDependencies=list(load_dependencies.keys())
          )
        ),
    userGuide=True
    )

generate_template(template)
shutil.copyfile(
    src=folder_path / '.template' / 'src' / 'auto-generated.ts',
    dst=folder_path / 'src' / 'auto-generated.ts'
)
for file in ['README.md', 'package.json', 'jest.config.ts', 'tsconfig.json', 'webpack.config.ts']:
    shutil.copyfile(
        src=folder_path / '.template' / file,
        dst=folder_path / file
    )
