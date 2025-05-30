import uvicorn

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi import FastAPI

from worldz import Worldz

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
    
    @app.get("/api/worldz", response_class=JSONResponse)
    def get_api_worldz():
        return JSONResponse(jsonable_encoder(worldz.sectors))
    
    uvicorn.run(app, host="0.0.0.0", port=9000)

if __name__ == "__main__":
    main()