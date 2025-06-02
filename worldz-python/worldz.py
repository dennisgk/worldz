import pathlib
import json

_WORLDZ_DATA_PATH = "worldz-data"
_SECTOR_DESC_JSON_PATH = "desc.json"

class Sector:
    def __init__(self, sector_path: pathlib.Path):
        with open(sector_path.joinpath(_SECTOR_DESC_JSON_PATH)) as f:
            data = json.load(f)
            self.name = data["name"]
            self.objects = data["objects"]

class Worldz:
    def __init__(self):
        self.data_path = pathlib.Path(__file__).parent.joinpath(_WORLDZ_DATA_PATH)

        self.sectors = dict()
        for path in self.data_path.iterdir():
            if not path.is_dir():
                continue

            self.sectors.update(dict([(path.name, Sector(path))]))
