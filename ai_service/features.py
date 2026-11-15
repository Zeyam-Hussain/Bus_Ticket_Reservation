def featurize(capacity, booked, hours_to_departure, departure_dow, bookings_24h):
    load = min(booked / capacity, 1.0)
    hours_norm = min(hours_to_departure, 240.0) / 240.0
    weekend = 1.0 if departure_dow >= 4 else 0.0
    velocity = min(bookings_24h / capacity, 1.0)
    return [load, hours_norm, weekend, velocity]


def rule_demand(load, hours_norm, weekend, velocity):
    urgency = (1.0 - hours_norm) ** 2
    return 0.55 * load + 0.25 * urgency + 0.10 * weekend + 0.10 * velocity
