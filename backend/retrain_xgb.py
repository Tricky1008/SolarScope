import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error

print("Loading training data...")
df = pd.read_csv("data/raw/solar_installations.csv")

FEATURES = ["lat","lon","roof_area_m2","ghi","dni","pvout",
            "avg_temp","usability_factor","panel_efficiency","tilt_angle"]

print("Cleaning data...")
df = df.dropna(subset=FEATURES + ["annual_kwh_actual"])

X = df[FEATURES].values
y = df["annual_kwh_actual"].values

print(f"Dataset: {len(df):,} rows")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

print("Training XGBoost locally...")
model = xgb.XGBRegressor(
    n_estimators=500,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train_s, y_train)

y_pred = model.predict(X_test_s)
r2  = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)

print(f"\nResults:")
print(f"  R²  : {r2:.4f}")
print(f"  MAE : {mae:.1f} kWh")

# Save
joblib.dump(model,  "data/models/solar_gbm_model.pkl")
joblib.dump(scaler, "data/models/feature_scaler.pkl")
print("\nSaved solar_gbm_model.pkl + feature_scaler.pkl")

# Test predictions
test_cases = [
    ("Mumbai  150sqm", [19.08, 72.88, 150, 5.5, 5.0, 1606, 27.5, 0.75, 0.20, 19.0]),
    ("Delhi   200sqm", [28.61, 77.20, 200, 5.2, 4.8, 1514, 25.0, 0.75, 0.20, 28.0]),
    ("Chennai 100sqm", [13.08, 80.27, 100, 5.8, 5.2, 1690, 29.0, 0.75, 0.20, 13.0]),
]

print("\nTest Predictions:")
print("-" * 45)
for name, vals in test_cases:
    inp = scaler.transform(np.array([vals]))
    pred = model.predict(inp)[0]
    print(f"  {name}: {pred:,.0f} kWh/year")

print("\nExpected ranges:")
print("  Mumbai  150sqm -> 18,000 - 24,000 kWh")
print("  Delhi   200sqm -> 20,000 - 28,000 kWh")
print("  Chennai 100sqm -> 14,000 - 19,000 kWh")
