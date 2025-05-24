import uvicorn

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import FastAPI

import pathlib

def main():
    app = FastAPI()

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
    
    uvicorn.run(app, host="0.0.0.0", port=19422)

if __name__ == "__main__":
    main()