import pathlib
import json
import shutil

_WORLDZ_DATA_PATH = "worldz-data"
_SECTOR_DESC_JSON_PATH = "desc.json"

_WORLDZ_UPLOADS_PATH = "worldz-uploads"

class Sector:
    def __init__(self, sector_path: pathlib.Path):
        with open(sector_path.joinpath(_SECTOR_DESC_JSON_PATH)) as f:
            data = json.load(f)
            self.name = data["name"]
            self.objects = data["objects"]

class Worldz:
    def __init__(self):
        self.data_path = pathlib.Path(__file__).parent.joinpath(_WORLDZ_DATA_PATH)
        self.uploads_path = pathlib.Path(__file__).parent.joinpath(_WORLDZ_UPLOADS_PATH)

    def get_sectors(self):
        sectors = dict()
        for path in self.data_path.iterdir():
            if not path.is_dir():
                continue

            sectors.update(dict([(path.name, Sector(path))]))

        return sectors
    
    def get_obj(self, folder, name):
        with open(self.uploads_path.joinpath(folder).joinpath(f"{name}.json")) as f:
            data = json.load(f)
        return data
    
    def get_obj_file(self, folder, name, file):
        return self.uploads_path.joinpath(folder).joinpath(name).joinpath(file)

    def get_folders(self):
        return [folder.name for folder in self.uploads_path.iterdir()]
    
    def get_folder_objs(self, folder):
        return [obj.name for obj in self.uploads_path.joinpath(folder).iterdir() if obj.is_dir()]

    def upload_obj(self, files, folder, name, model):
        top_path = self.uploads_path.joinpath(folder)

        if not top_path.exists():
            top_path.mkdir()

        save_path = top_path.joinpath(name)
        desc_path = top_path.joinpath(f"{name}.json")

        if save_path.exists():
            raise RuntimeError()
        
        if desc_path.exists():
            raise RuntimeError()

        save_path.mkdir()
        for file in files:
            file_save_path = save_path.joinpath(file.filename)
            with open(file_save_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

        with open(desc_path, "w") as f:
            json.dump({"files": [file.filename for file in files], "model": model}, f)

    def delete_obj(self, folder, name):
        top_path = self.uploads_path.joinpath(folder)
        del_path = top_path.joinpath(name)
        desc_path = top_path.joinpath(f"{name}.json")

        if del_path.exists():
            shutil.rmtree(del_path)

        if desc_path.exists():
            desc_path.unlink()

        if sum(1 for _ in top_path.iterdir()) == 0:
            shutil.rmtree(top_path)
