import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import countries, emergency, interactions, patients, users, visits

load_dotenv()

FRONTEND_URLS = [
    o.strip()
    for o in os.getenv("FRONTEND_URLS", "http://localhost:3000").split(",")
    if o.strip()
]

app = FastAPI(
    title="MediSync Africa API",
    description="Phase 1 — patient records, visits, prescriptions",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URLS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(patients.router)
app.include_router(visits.router)
app.include_router(emergency.router)
app.include_router(interactions.router)
app.include_router(countries.router)


@app.get("/")
def root():
    return {"message": "MediSync Africa API — go to /docs for API documentation"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "MediSync Africa API"}
