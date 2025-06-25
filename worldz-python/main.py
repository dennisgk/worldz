import uvicorn

from fastapi import FastAPI, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.encoders import jsonable_encoder
from fastapi import FastAPI, Request

from worldz import Worldz

from typing import List

import pathlib

def main():
    app = FastAPI()
    worldz = Worldz()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.mount("/assets", StaticFiles(directory=pathlib.Path(__file__).parent.parent.joinpath("worldz-react").joinpath("dist").joinpath("assets").resolve()), name="assets")

    def index():
        return FileResponse(path=pathlib.Path(__file__).parent.parent.joinpath("worldz-react").joinpath("dist").joinpath("index.html").resolve())

    @app.get("/", response_class=FileResponse)
    def get():
        return index()
    
    @app.get("/tags", response_class=FileResponse)
    def get_tags():
        return index()
    
    @app.get("/settings", response_class=FileResponse)
    def get_settings():
        return index()

    @app.get("/sector", response_class=FileResponse)
    def get_sector():
        return index()
    
    @app.get("/api/worldz", response_class=JSONResponse)
    def get_api_worldz():
        return JSONResponse(jsonable_encoder(worldz.get_sectors(False)))
    
    @app.get("/api/sector", response_class=JSONResponse)
    def get_api_sector(id: str = Query(...)):
        return JSONResponse(jsonable_encoder(worldz.get_sectors(True)[id]))
    
    @app.post("/api/write_sector", response_class=Response)
    async def post_api_write_sector(request: Request, id: str = Query(...)):
        data = await request.json()
        worldz.write_sector(id, data)
        return Response(status_code=200)
    
    @app.post("/api/upload_obj", response_class=Response)
    def post_api_upload_obj(files: List[UploadFile] = File(...), folder: str = Query(...), name: str = Query(...), model: str = Query(...)):
        worldz.upload_obj(files, folder, name, model)
        return Response(status_code=200)
    
    @app.post("/api/delete_obj", response_class=Response)
    def post_api_delete_obj(folder: str = Query(...), name: str = Query(...)):
        worldz.delete_obj(folder, name)
        return Response(status_code=200)
    
    @app.get("/api/folders", response_class=JSONResponse)
    def get_api_folders():
        return JSONResponse(jsonable_encoder(worldz.get_folders()))
    
    @app.get("/api/folder_objs", response_class=JSONResponse)
    def get_api_folder_objs(folder: str = Query(...)):
        return JSONResponse(jsonable_encoder(worldz.get_folder_objs(folder)))
    
    @app.get("/api/obj", response_class=JSONResponse)
    def get_api_obj(folder: str = Query(...), name: str = Query(...)):
        return JSONResponse(jsonable_encoder(worldz.get_obj(folder, name)))
    
    @app.get("/api/obj_file", response_class=FileResponse)
    def get_api_obj_file(folder: str = Query(...), name: str = Query(...), file: str = Query(...)):
        return FileResponse(path=worldz.get_obj_file(folder, name, file))
    
    @app.post("/api/create_sector", response_class=Response)
    def post_api_create_sector(name: str = Query(...)):
        worldz.create_sector(name)
        return Response(status_code=200)
    
    @app.post("/api/delete_sector", response_class=Response)
    def post_api_delete_sector(id: str = Query(...)):
        worldz.delete_sector(id)
        return Response(status_code=200)

    uvicorn.run(app, host="0.0.0.0", port=19423) # 19423 # 8000

if __name__ == "__main__":
    main()