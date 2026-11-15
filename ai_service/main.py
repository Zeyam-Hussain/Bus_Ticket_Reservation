import hmac
import logging
import math
import os
from datetime import datetime, timezone
from pathlib import Path

import joblib
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator

from features import featurize, rule_demand

logger = logging.getLogger(__name__)
SECRET = os.environ.get("AI_SERVICE_SECRET", "")
MODEL_PATH = Path(__file__).parent / "model.joblib"
MODEL_VERSION = "gbr-synthetic-v1"

try:
    model = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None
except (OSError, EOFError, ValueError, ImportError) as error:
    logger.error("Pricing model could not be loaded: %s", error)
    model = None

app = FastAPI(title="AllRide dynamic pricing service")


class PricingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    route_id: int = Field(gt=0)
    base_fare: int = Field(gt=0)
    min_fare: int = Field(gt=0)
    max_fare: int = Field(gt=0)
    capacity: int = Field(gt=0)
    booked: int = Field(ge=0)
    hours_to_departure: float = Field(ge=0, allow_inf_nan=False)
    departure_dow: int = Field(ge=0, le=6)
    bookings_24h: int = Field(ge=0)

    @model_validator(mode="after")
    def check_fare_bounds(self):
        if not self.min_fare <= self.base_fare <= self.max_fare:
            raise ValueError("Fares must satisfy min_fare <= base_fare <= max_fare.")
        return self


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_version": MODEL_VERSION if model is not None else "rule-v1",
    }


@app.post("/pricing/recommend")
def recommend(
    req: PricingRequest,
    x_internal_secret: str | None = Header(default=None),
):
    if not SECRET or not hmac.compare_digest(x_internal_secret or "", SECRET):
        raise HTTPException(status_code=401, detail="Unauthorized")

    features = featurize(
        req.capacity,
        req.booked,
        req.hours_to_departure,
        req.departure_dow,
        req.bookings_24h,
    )

    if model is not None:
        try:
            raw_demand = float(model.predict([features])[0])
        except (ValueError, TypeError, ArithmeticError) as error:
            logger.exception("Pricing model inference failed")
            raise HTTPException(status_code=503, detail="Pricing model unavailable.") from error
        version = MODEL_VERSION
    else:
        raw_demand = float(rule_demand(*features))
        version = "rule-v1"

    if not math.isfinite(raw_demand):
        raise HTTPException(status_code=503, detail="Pricing model returned an invalid prediction.")

    demand = min(max(raw_demand, 0.0), 1.0)
    fare = round(req.base_fare * (0.85 + 0.65 * demand))
    fare = max(req.min_fare, min(req.max_fare, fare))

    return {
        "model_version": version,
        "predicted_demand": round(demand, 4),
        "recommended_fare": fare,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
