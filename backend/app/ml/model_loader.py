import os
import xgboost as xgb
from typing import Optional
from backend.app.config.settings import settings
from backend.app.config.logging import logger

class XGBoostModelLoader:
    def __init__(self):
        self.booster: Optional[xgb.Booster] = None
        self.load_model()

    def load_model(self):
        root = settings.project_root
        json_path = os.path.join(root, "models", "model_xgboost_d.json")
        if os.path.exists(json_path):
            try:
                b = xgb.Booster()
                b.load_model(json_path)
                self.booster = b
                logger.info("Loaded XGBoost JSON model into Python booster successfully!")
                return
            except Exception as e:
                logger.error(f"Error loading XGBoost JSON model: {str(e)}")
        logger.warning("XGBoost model file not found or failed to load. Will fallback to deterministic scoring.")

model_loader = XGBoostModelLoader()
