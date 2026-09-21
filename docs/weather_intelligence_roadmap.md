# Skyhour Weather Intelligence Architecture Roadmap (v1.3)

## Executive Summary

During the machine learning development phase for **Skyhour v1.2.0**, we executed an empirical ablation experiment (**Model E**) to evaluate whether integrating pre-flight historical weather proxies (temperature, precipitation, wind speed, visibility) improved arrival-delay prediction performance ($ArrDel15 \ge 15\text{ minutes}$).

### Key Findings from Model E Experiment
- **Model D Baseline** (Schedule + Route + Distance + Target Encodings + Route Priors):
  - **Validation ROC-AUC**: `0.6255`
- **Model E** (+ Regional Pre-Flight Weather Proxies):
  - **Validation ROC-AUC**: `0.6038`
- **Conclusion**: Broad regional weather proxies did **not** improve out-of-sample generalization over historical route and schedule priors.

As a result, **weather features were intentionally excluded from Skyhour v1.2.0** to prevent noise injection and over-fitting.

---

## Phase 5 Strategy: Architecture for Skyhour ML v1.3

To incorporate weather intelligence without compromising the frozen **v1.2.0** baseline, weather integration is designed as a modular **v1.3 enhancement architecture**.

```
                           +------------------------+
                           |   Live Flight Search   |
                           +-----------+------------+
                                       |
                                       v
                           +------------------------+
                           | Feature Transformer    |
                           +-----------+------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
     +---------------------------+           +---------------------------+
     |  Skyhour Frozen v1.2.0    |           |  Weather Feature Engine   |
     | (Schedule + Route Priors) |           |  (High-Res METAR / TAF)   |
     +-------------+-------------+           +-------------+-------------+
                   |                                       |
                   |       +-----------------------+       |
                   +------>|  Ensemble / Fusion    |<------+
                           |   Model (v1.3)        |
                           +-----------+-----------+
                                       |
                                       v
                           +-----------------------+
                           | Final Risk Probability|
                           +-----------------------+
```

---

## Proposed Technical Enhancements for v1.3

1. **High-Resolution Weather Inputs**:
   - Upgrade from broad regional summaries to airport-specific hourly **METAR** (Meteorological Aerodrome Reports) and **TAF** (Terminal Aerodrome Forecasts).
   - Key variables: Convective storm activity index, freezing level/icing indicators, crosswind severity vectors, runway visual range (RVR).

2. **Temporal Alignment Window**:
   - Align weather forecasts strictly within $T-2\text{h}$ to $T+1\text{h}$ of scheduled departure and arrival.

3. **Version Isolation Guarantee**:
   - `skyhour_delay_model.rds` (v1.2.0) remains immutable.
   - Skyhour ML v1.3 will be registered under `models/skyhour_delay_model_v1.3.rds` with its own contract endpoint (`/predict-v1.3`).
