import unittest
from unittest.mock import patch

import main
from features import featurize, rule_demand


class PricingFeatureTests(unittest.TestCase):
    def test_health_reports_loaded_or_fallback_model(self):
        response = main.health()

        self.assertEqual(response["status"], "ok")
        self.assertIn(response["model_version"], {"gbr-synthetic-v1", "rule-v1"})

    def test_features_normalize_valid_inputs(self):
        features = featurize(40, 20, 120, 5, 10)

        self.assertEqual(features, [0.5, 0.5, 1.0, 0.25])

    def test_features_cap_over_capacity_and_departure_horizon(self):
        features = featurize(40, 55, 500, 2, 60)

        self.assertEqual(features, [1.0, 1.0, 0.0, 1.0])

    def test_rule_demand_is_bounded_for_normalized_features(self):
        self.assertAlmostEqual(rule_demand(0.5, 0.5, 1.0, 0.25), 0.4625)

    def test_request_rejects_invalid_fare_bounds(self):
        with self.assertRaises(ValueError):
            main.PricingRequest(
                route_id=1,
                base_fare=1000,
                min_fare=1200,
                max_fare=1500,
                capacity=40,
                booked=10,
                hours_to_departure=24,
                departure_dow=2,
                bookings_24h=4,
            )

    def test_request_rejects_invalid_capacity(self):
        with self.assertRaises(ValueError):
            main.PricingRequest(
                route_id=1,
                base_fare=1000,
                min_fare=800,
                max_fare=1500,
                capacity=0,
                booked=10,
                hours_to_departure=24,
                departure_dow=2,
                bookings_24h=4,
            )

    def test_recommendation_requires_internal_secret(self):
        request = self.valid_request()

        with self.assertRaises(main.HTTPException) as raised:
            main.recommend(request, x_internal_secret="wrong-secret")

        self.assertEqual(raised.exception.status_code, 401)

    def test_recommendation_requires_a_secret(self):
        with self.assertRaises(main.HTTPException) as raised:
            main.recommend(self.valid_request(), x_internal_secret=None)

        self.assertEqual(raised.exception.status_code, 401)

    def test_recommendation_uses_rule_fallback_when_model_is_unavailable(self):
        with (
            patch.object(main, "SECRET", "test-internal-secret"),
            patch.object(main, "model", None),
        ):
            result = main.recommend(self.valid_request(), x_internal_secret="test-internal-secret")

        self.assertEqual(result["model_version"], "rule-v1")
        self.assertGreaterEqual(result["predicted_demand"], 0)
        self.assertLessEqual(result["predicted_demand"], 1)
        self.assertGreaterEqual(result["recommended_fare"], 800)
        self.assertLessEqual(result["recommended_fare"], 1500)
        self.assertTrue(result["generated_at"])

    def test_recommendation_clamps_model_output_to_fare_bounds(self):
        class OverpredictingModel:
            def predict(self, _features):
                return [1.0]

        with (
            patch.object(main, "SECRET", "test-internal-secret"),
            patch.object(main, "model", OverpredictingModel()),
        ):
            result = main.recommend(self.valid_request(), x_internal_secret="test-internal-secret")

        self.assertEqual(result["predicted_demand"], 1.0)
        self.assertEqual(result["recommended_fare"], 1500)

    @staticmethod
    def valid_request():
        return main.PricingRequest(
            route_id=1,
            base_fare=1000,
            min_fare=800,
            max_fare=1500,
            capacity=40,
            booked=20,
            hours_to_departure=24,
            departure_dow=5,
            bookings_24h=10,
        )


if __name__ == "__main__":
    unittest.main()
