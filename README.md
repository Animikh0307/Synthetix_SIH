# RakshaMitra 🛡️🌿

### AI-Powered Stress Detection & Mental Well-Being Support Platform

RakshaMitra is an AI-driven mental well-being platform designed to help users understand their emotional state and access supportive stress-management resources.

The project combines a modern web frontend with a dedicated Machine Learning engine for emotion/stress-related analysis. The ML pipeline uses **XGBoost, SHAP, and VADER** to process and interpret user-related data.

> Built as a technology-driven solution focused on accessible, intelligent, and supportive mental well-being assistance.

---

## 🌱 Why RakshaMitra?

Stress and emotional overload can affect concentration, productivity, sleep, relationships, and overall quality of life.

RakshaMitra aims to provide a technology-assisted approach that can:

- Analyze user-provided emotional information
- Identify patterns related to stress and well-being
- Provide interpretable ML predictions
- Support users with appropriate stress-management resources
- Create a simple and accessible digital experience

The goal is not to replace professional mental-health care, but to provide an additional layer of awareness and support.

---

# ✨ Key Features

## 🧠 Machine Learning Engine

RakshaMitra contains a dedicated ML engine built around:

- **XGBoost** — predictive machine-learning model
- **SHAP** — model explainability and feature contribution analysis
- **VADER** — sentiment analysis
- Python-based data processing and model training
- Vercel-ready ML engine structure

The ML engine is organized separately from the frontend so that the prediction pipeline can be developed, tested, and deployed independently.

---

## 🔍 Explainable AI

A major focus of RakshaMitra is not only generating a prediction, but also understanding **why** the model generated it.

Using SHAP, the system can analyze the contribution of individual features toward a model prediction.

This helps move the system toward:

> **Prediction → Explanation → Understanding**

rather than treating the ML model as a complete black box.

---

## 💬 Sentiment Analysis

RakshaMitra uses **VADER sentiment analysis** as part of its processing pipeline.

This enables the system to analyze textual sentiment and extract useful information that can contribute to the overall emotional-state analysis.

---

## 📊 Data & Model Pipeline

The ML engine follows a structured workflow:

```text
User / Input Data
       ↓
Data Processing
       ↓
Sentiment Analysis
       ↓
Feature Preparation
       ↓
XGBoost Model
       ↓
Prediction
       ↓
SHAP Explainability
       ↓
Interpretable Result
```
## 🏗️ Project Architecture
```
RakshaMitra/
│
├── Frontend/
│   ├── public/
│   ├── src/
│   ├── AGENTS.md
│   ├── INTEGRATION.md
│   ├── README.md
│   ├── package.json
│   ├── package-lock.json
│   ├── bun.lock
│   ├── bunfig.toml
│   ├── components.json
│   ├── eslint.config.js
│   ├── nitro.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── ml-engine/
│   ├── api/
│   ├── data/
│   ├── data_generator.py
│   ├── train_model.py
│   ├── requirements.txt
│   ├── vercel.json
│   └── README.md
│
└── README.md
