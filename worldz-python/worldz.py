import pathlib
import json

_WORLDZ_DATA_PATH = "worldz-data"
_SECTOR_DESC_JSON_PATH = "desc.json"

class Sector:
    def __init__(self, sector_path: pathlib.Path):
        self.id = sector_path.name

        with open(sector_path.joinpath(_SECTOR_DESC_JSON_PATH)) as f:
            data = json.load(f)
            self.name = data["name"]

    def __getitem__(self, key):
        return getattr(self, key)

    def __iter__(self):
        yield from ["id", "name"]

class Worldz:
    def __init__(self):
        self.data_path = pathlib.Path(__file__).parent.joinpath(_WORLDZ_DATA_PATH)
        self.sectors = [Sector(path) for path in self.data_path.iterdir() if path.is_dir()]

