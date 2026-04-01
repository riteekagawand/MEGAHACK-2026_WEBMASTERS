#!/usr/bin/env python3
"""
Nutrition analysis engine for Next.js API integration.

Expected input JSON (stdin or --input-json):
{
  "report_context": "<lab findings text>",
  "additional_info": "<optional user context>",
  "source": "image|saved_report",
  "metadata": { ... optional ... }
}

Outputs strict JSON for the nutrition UI schema.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


@dataclass
class MarkerRule:
    name: str
    low: Optional[float]
    high: Optional[float]
    unit: str
    nutrient: Optional[str]
    severity_cutoffs: Tuple[float, float]  # (moderate boundary, severe boundary)


MARKER_RULES: Dict[str, MarkerRule] = {
    "hemoglobin": MarkerRule("Hemoglobin", 12.0, 17.0, "g/dL", "Iron", (11.0, 9.0)),
    "vitamin d": MarkerRule("Vitamin D", 30.0, 100.0, "ng/mL", "Vitamin D", (20.0, 12.0)),
    "vitamin b12": MarkerRule("Vitamin B12", 200.0, 900.0, "pg/mL", "Vitamin B12", (170.0, 120.0)),
    "calcium": MarkerRule("Calcium", 8.5, 10.5, "mg/dL", "Calcium", (8.0, 7.2)),
    "hba1c": MarkerRule("HbA1c", 4.0, 5.6, "%", None, (6.5, 8.0)),
    "ldl": MarkerRule("LDL", None, 100.0, "mg/dL", None, (130.0, 160.0)),
    "triglycerides": MarkerRule("Triglycerides", None, 150.0, "mg/dL", None, (200.0, 500.0)),
    "uric acid": MarkerRule("Uric Acid", 3.4, 7.0, "mg/dL", None, (8.0, 10.0)),
}


def read_input(args: argparse.Namespace) -> dict:
    if args.input_json:
        with open(args.input_json, "r", encoding="utf-8") as f:
            return json.load(f)

    raw = sys.stdin.read().strip()
    if not raw:
        raise ValueError("No input provided. Pass JSON via stdin or --input-json.")
    return json.loads(raw)


def parse_markers(report_context: str) -> Dict[str, float]:
    markers: Dict[str, float] = {}
    text = report_context.lower()

    aliases = {
        "hemoglobin": [r"hemoglobin", r"\bhb\b"],
        "vitamin d": [r"vitamin d", r"vit d", r"25[-\s]?oh"],
        "vitamin b12": [r"vitamin b12", r"\bb12\b"],
        "calcium": [r"calcium"],
        "hba1c": [r"hba1c", r"hb1ac"],
        "ldl": [r"\bldl\b"],
        "triglycerides": [r"triglycerides", r"\btg\b"],
        "uric acid": [r"uric acid"],
    }

    for key, patterns in aliases.items():
        for pattern in patterns:
            regex = re.compile(pattern + r"[^\d]{0,20}(\d+(\.\d+)?)")
            match = regex.search(text)
            if match:
                markers[key] = float(match.group(1))
                break
        if key in markers:
            continue

    return markers


def classify_value(rule: MarkerRule, value: float) -> str:
    if rule.low is not None and value < rule.low:
        return "Low"
    if rule.high is not None and value > rule.high:
        return "High"
    return "Normal"


def severity_for_deficiency(rule: MarkerRule, value: float) -> str:
    moderate_boundary, severe_boundary = rule.severity_cutoffs
    if value <= severe_boundary:
        return "Severe"
    if value <= moderate_boundary:
        return "Moderate"
    return "Mild"


def nutrition_advice_for_nutrient(nutrient: str) -> Tuple[List[str], List[str], str]:
    lookup = {
        "Iron": (
            ["Spinach", "Lentils", "Jaggery", "Sesame seeds"],
            ["Egg yolk", "Chicken liver", "Lean red meat", "Fish"],
            "Ferrous bisglycinate (as advised by physician)",
        ),
        "Vitamin D": (
            ["Fortified milk", "Mushrooms", "Paneer"],
            ["Fatty fish", "Egg yolk"],
            "Vitamin D3 weekly sachet (medical supervision)",
        ),
        "Vitamin B12": (
            ["Fortified cereals", "Fortified nutritional yeast", "Curd"],
            ["Eggs", "Fish", "Chicken"],
            "Methylcobalamin (medical supervision)",
        ),
        "Calcium": (
            ["Ragi", "Sesame seeds", "Paneer", "Curd"],
            ["Sardines", "Small fish with bones"],
            "Calcium + Vitamin D combination if needed",
        ),
    }
    return lookup.get(nutrient, ([], [], "Consult physician"))


def build_output(payload: dict) -> dict:
    report_context = (payload.get("report_context") or "").strip()
    additional_info = (payload.get("additional_info") or "").strip()

    markers = parse_markers(report_context)
    nutritional_deficiencies = []
    health_markers = []
    by_deficiency = []
    warnings = []

    for marker_key, value in markers.items():
        rule = MARKER_RULES.get(marker_key)
        if not rule:
            continue

        status = classify_value(rule, value)
        health_markers.append(
            {
                "marker": rule.name,
                "value": f"{value} {rule.unit}",
                "normalRange": (
                    f"{rule.low}-{rule.high} {rule.unit}"
                    if rule.low is not None and rule.high is not None
                    else (f"< {rule.high} {rule.unit}" if rule.high is not None else f"> {rule.low} {rule.unit}")
                ),
                "status": status,
                "dietaryImpact": (
                    "Needs dietary correction and periodic monitoring."
                    if status != "Normal"
                    else "Currently within acceptable range."
                ),
                "foodsToInclude": ["Seasonal vegetables", "Whole grains", "Adequate hydration"],
                "foodsToAvoid": ["Ultra-processed foods", "Excess sugar", "Trans fats"],
            }
        )

        if rule.nutrient and status == "Low":
            severity = severity_for_deficiency(rule, value)
            veg, nonveg, supplement = nutrition_advice_for_nutrient(rule.nutrient)
            nutritional_deficiencies.append(
                {
                    "nutrient": rule.nutrient,
                    "currentLevel": f"{value} {rule.unit}",
                    "normalRange": f"{rule.low}-{rule.high} {rule.unit}",
                    "status": "Deficient" if severity in ("Moderate", "Severe") else "Low",
                    "severity": severity,
                    "symptoms": ["Fatigue", "Low energy", "Poor concentration"],
                }
            )
            by_deficiency.append(
                {
                    "deficiency": f"{rule.nutrient} deficiency",
                    "vegetarian": veg,
                    "nonVegetarian": nonveg,
                    "supplements": supplement,
                }
            )

    if not markers:
        warnings.append("Could not confidently parse all markers from report context.")
    if "kidney" in report_context.lower():
        warnings.append("Kidney-related findings detected: monitor protein and sodium intake closely.")
    if "pregnan" in additional_info.lower():
        warnings.append("Pregnancy context noted: clinician validation required before supplementation.")

    confidence = 70 + min(len(markers) * 3, 25)

    return {
        "reportSummary": {
            "reportType": "Lab Report",
            "testDate": "Date not visible",
            "overallHealthStatus": "Needs Attention" if nutritional_deficiencies else "Fair",
        },
        "nutritionalDeficiencies": nutritional_deficiencies,
        "healthMarkers": health_markers,
        "personalizedDietPlan": {
            "dailyCalories": "1900",
            "macros": {"protein": "70g", "carbs": "230g", "fats": "60g", "fiber": "30g"},
            "mealTiming": {
                "breakfast": "8:00 AM - high protein + fiber",
                "lunch": "1:00 PM - balanced plate (carb+protein+veg)",
                "dinner": "7:30 PM - light, low refined carbs",
                "snacks": "2 healthy snacks between meals",
            },
        },
        "recommendedFoods": {
            "byDeficiency": by_deficiency,
            "superfoods": ["Moringa", "Amla", "Ragi", "Flaxseed", "Turmeric milk"],
            "herbs": ["Turmeric", "Cinnamon", "Fenugreek"],
        },
        "mealPlan": {
            "weekDays": [
                {
                    "day": "Monday",
                    "meals": {
                        "breakfast": "Moong chilla + curd",
                        "lunch": "Brown rice + dal + salad + paneer",
                        "dinner": "Millet roti + mixed veg + soup",
                        "snacks": "Roasted chana / fruit",
                    },
                }
            ],
            "notes": "Rotate grains (millets/wheat/rice), maintain portion control, avoid late-night heavy meals.",
        },
        "lifestyleRecommendations": {
            "exercise": "30-40 min brisk walk, 5 days/week",
            "hydration": "2.5-3.0 liters/day unless fluid-restricted",
            "sleep": "7-8 hours/night",
            "stress": "10 minutes breathing or mindfulness daily",
        },
        "foodsToAvoid": {
            "strict": ["Sugary beverages", "Trans-fat snacks"],
            "moderate": ["Deep-fried food", "High-sodium packaged foods"],
            "occasional": ["Refined flour desserts"],
        },
        "supplements": [
            {
                "name": "Omega-3 (if diet lacks fatty fish)",
                "dosage": "As advised",
                "timing": "After meals",
                "reason": "Supports cardiometabolic health",
                "duration": "8-12 weeks then reassess",
            }
        ],
        "progressTracking": {
            "markers": [h["marker"] for h in health_markers] or ["Hemoglobin", "Vitamin D", "HbA1c"],
            "frequency": "Every 8-12 weeks",
            "targetValues": ["Move abnormal markers toward lab reference range"],
        },
        "indianDietOptions": {
            "vegetarian": {
                "breakfast": ["Besan chilla", "Vegetable poha", "Oats upma"],
                "lunch": ["Dal + roti + sabzi", "Rajma + brown rice", "Curd rice + salad"],
                "dinner": ["Khichdi + curd", "Millet roti + paneer bhurji", "Veg soup + salad"],
            },
            "nonVegetarian": {
                "breakfast": ["Egg bhurji + multigrain toast", "Boiled eggs + fruit"],
                "lunch": ["Grilled fish + rice + veg", "Chicken curry + millet roti"],
                "dinner": ["Egg curry + salad", "Light chicken stew + sauteed veg"],
            },
        },
        "warnings": warnings or ["Review recommendations with a qualified clinician."],
        "confidence": min(confidence, 95),
        "engine": "python-v1",
        "engineReason": "Deterministic Python rules with marker parsing",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Nutrition analysis engine")
    parser.add_argument("--input-json", type=str, default="")
    parser.add_argument("--output-json", type=str, default="")
    args = parser.parse_args()

    try:
        payload = read_input(args)
        output = build_output(payload)
        output_str = json.dumps(output, ensure_ascii=True)
        if args.output_json:
            with open(args.output_json, "w", encoding="utf-8") as f:
                f.write(output_str)
        print(output_str)
    except Exception as exc:  # noqa: BLE001
        err = {"error": "python_analysis_failed", "details": str(exc)}
        print(json.dumps(err), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
