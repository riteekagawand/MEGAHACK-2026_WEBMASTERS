#!/usr/bin/env python3
"""
Evaluation utility for nutrition classification outputs.

Generates:
- confusion matrix JPEG for each model column
- metrics comparison JPEG (precision/recall/f1/accuracy)
- accuracy comparison JPEG
- CSV + JSON metrics dump

Input CSV required columns:
- y_true
- one or more prediction columns, e.g. y_pred_python, y_pred_llm_v2
"""

from __future__ import annotations

import argparse
import json
import os
from typing import Dict, List

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate nutrition classifier outputs")
    parser.add_argument("--csv", required=True, help="Path to evaluation CSV")
    parser.add_argument(
        "--output-dir",
        default="evaluation_outputs",
        help="Directory to save metrics and JPEGs",
    )
    parser.add_argument(
        "--average",
        default="weighted",
        choices=["micro", "macro", "weighted"],
        help="Averaging strategy for precision/recall/f1",
    )
    return parser.parse_args()


def evaluate_model(y_true: pd.Series, y_pred: pd.Series, average: str) -> Dict[str, float]:
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, average=average, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, average=average, zero_division=0)),
        "f1_score": float(f1_score(y_true, y_pred, average=average, zero_division=0)),
    }


def save_confusion_matrix(
    y_true: pd.Series, y_pred: pd.Series, labels: List[str], title: str, output_path: str
) -> None:
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=labels, yticklabels=labels)
    plt.title(title)
    plt.xlabel("Predicted")
    plt.ylabel("True")
    plt.tight_layout()
    plt.savefig(output_path, format="jpeg", dpi=300)
    plt.close()


def save_metrics_comparison(metrics_df: pd.DataFrame, output_path: str) -> None:
    melted = metrics_df.melt(id_vars=["model"], value_vars=["precision", "recall", "f1_score", "accuracy"])
    plt.figure(figsize=(10, 6))
    sns.barplot(data=melted, x="model", y="value", hue="variable")
    plt.ylim(0, 1.0)
    plt.title("Model Metrics Comparison")
    plt.ylabel("Score")
    plt.xlabel("Model")
    plt.legend(title="Metric")
    plt.tight_layout()
    plt.savefig(output_path, format="jpeg", dpi=300)
    plt.close()


def save_accuracy_comparison(metrics_df: pd.DataFrame, output_path: str) -> None:
    plt.figure(figsize=(8, 5))
    sns.barplot(data=metrics_df, x="model", y="accuracy", color="#4C78A8")
    plt.ylim(0, 1.0)
    plt.title("Accuracy Comparison Across Models")
    plt.ylabel("Accuracy")
    plt.xlabel("Model")
    for idx, val in enumerate(metrics_df["accuracy"]):
        plt.text(idx, val + 0.02, f"{val:.3f}", ha="center", fontsize=9)
    plt.tight_layout()
    plt.savefig(output_path, format="jpeg", dpi=300)
    plt.close()


def main() -> None:
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    df = pd.read_csv(args.csv)
    if "y_true" not in df.columns:
        raise ValueError("Input CSV must contain 'y_true' column.")

    prediction_cols = [c for c in df.columns if c != "y_true"]
    if not prediction_cols:
        raise ValueError("Input CSV must contain at least one prediction column besides 'y_true'.")

    y_true = df["y_true"].astype(str)
    labels = sorted(y_true.unique().tolist())

    rows: List[Dict[str, float]] = []
    detailed_reports: Dict[str, dict] = {}

    for pred_col in prediction_cols:
        y_pred = df[pred_col].astype(str)
        metrics = evaluate_model(y_true, y_pred, args.average)
        rows.append({"model": pred_col, **metrics})
        detailed_reports[pred_col] = classification_report(
            y_true, y_pred, labels=labels, output_dict=True, zero_division=0
        )

        cm_path = os.path.join(args.output_dir, f"confusion_matrix_{pred_col}.jpeg")
        save_confusion_matrix(
            y_true=y_true,
            y_pred=y_pred,
            labels=labels,
            title=f"Confusion Matrix - {pred_col}",
            output_path=cm_path,
        )

    metrics_df = pd.DataFrame(rows).sort_values(by="accuracy", ascending=False)
    metrics_csv_path = os.path.join(args.output_dir, "metrics_summary.csv")
    metrics_df.to_csv(metrics_csv_path, index=False)

    metrics_json_path = os.path.join(args.output_dir, "detailed_classification_report.json")
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(detailed_reports, f, indent=2)

    metrics_plot_path = os.path.join(args.output_dir, "metrics_comparison.jpeg")
    save_metrics_comparison(metrics_df, metrics_plot_path)

    acc_plot_path = os.path.join(args.output_dir, "accuracy_comparison.jpeg")
    save_accuracy_comparison(metrics_df, acc_plot_path)

    print("Evaluation complete.")
    print(f"Saved: {metrics_csv_path}")
    print(f"Saved: {metrics_json_path}")
    print(f"Saved: {metrics_plot_path}")
    print(f"Saved: {acc_plot_path}")
    for model in metrics_df["model"].tolist():
        print(f"Saved: {os.path.join(args.output_dir, f'confusion_matrix_{model}.jpeg')}")


if __name__ == "__main__":
    main()
