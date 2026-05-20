# T20 Score Prediction — Chapter Mapping

## Research Objectives (from Chapter 1)

| ID | Research Objective |
|----|--------------------|
| RO1 | Construct dataset of in-game T20 state snapshots with engineered features including the novel *Remaining Batting Strength Score* (RBSS) |
| RO2 | Design a natural-language prompt schema and labelled training corpus of prompt–completion pairs |
| RO3 | Establish a zero-shot baseline using untuned *Llama 3.2-3B* |
| RO4 | Fine-tune *Llama 3.2-3B* with QLoRA SFT and evaluate improvement over zero-shot baseline |
| RO5 | Compare minimum-validation-loss checkpoint vs. final checkpoint for generalisation |
| RO6 | Evaluate frontier model *GPT-4.1-nano* zero-shot as an upper-bound reference |

---

## Chapter-by-Chapter Mapping

### Chapter 1 — Introduction

| Aspect | Detail |
|--------|--------|
| **Sections** | Background, Problem Statement, Research Motivation, Research Objectives, Scope & Limitations, Thesis Organisation |
| **Research Objectives** | RO1–RO6 (defined here) |
| **Experiments** | None |
| **Implementation** | — |
| **Files** | `thesis/chapters/01_introduction.tex` |

---

### Chapter 2 — Literature Review

| Aspect | Detail |
|--------|--------|
| **Sections** | Statistical methods, ML approaches, LLMs for structured prediction, T20 analytics |
| **Research Objectives** | Motivates RO1–RO6 |
| **Experiments** | None |
| **Implementation** | — |
| **Files** | `thesis/chapters/02_literature_review.tex` |

---

### Chapter 3 — Materials and Methods

#### §3.2 — Data Collection and Preprocessing

| Aspect | Detail |
|--------|--------|
| **Research Objective** | RO1 |
| **Experiment** | Filtering 3,113 Cricsheet JSON files → 2,895 qualifying matches |
| **Implementation** | Pydantic v2 schema parsing, no-result/incomplete-innings filters, venue name normalisation (exact prefix + fuzzy rules), 322 → 236 unique venues |
| **Repository Files** | `forecaster/models.py`, `forecaster/match_loader.py`, `research/01_data_processing.ipynb`, `research/02_data_processing_vanues.ipynb` |
| **Data Files** | `t20s_json/male/`, `t20s_json/venue_metrics.json` |

#### §3.3 — Feature Engineering

| Aspect | Detail |
|--------|--------|
| **Research Objective** | RO1 |
| **Experiment** | 10 snapshots × 2,895 matches = ~28,954 rows; 20 features per snapshot; venue par score at 52nd percentile; RBSS weighted-role scoring |
| **Implementation** | Innings segmentation into 10 two-over sections; per-section features; venue par score; player career stats; player role classification; RBSS |
| **Repository Files** | `forecaster/player_stats.py`, `forecaster/player_classification.py`, `research/03_data_processing_average_score.ipynb`, `research/04_data_processing_player_stat.ipynb`, `research/05_data_processing_remaining_depth.ipynb` |

#### §3.4 — Prompt Schema and Dataset Construction

| Aspect | Detail |
|--------|--------|
| **Research Objective** | RO2 |
| **Experiment** | Train: ~24,080 rows (up to 2024-12-31), Validation: ~2,370 rows (2025-H1), Test: ~2,500 rows (2025-H2+); chronological split |
| **Implementation** | Natural-language prompt template; completion = plain integer score; max 148 prompt tokens; summary variant for frontier model; published to Hugging Face Hub |
| **Repository Files** | `forecaster/json_schema_template.json`, `forecaster/JSON_SCHEMA.md`, `research/06_data_processing_prompt_generation.ipynb`, `forecaster/__init__.py` |
| **Data Files** | `t20s_json/finetune_training_data.jsonl`, `t20s_json/finetune_training_data_summary.jsonl`, `t20s_json/sample_input.json` |

#### §3.5 — Model Architecture and Fine-Tuning

| Aspect | Detail |
|--------|--------|
| **Research Objective** | RO4, RO5 |
| **Experiment** | QLoRA (NF4 4-bit, r=16, α=32, dropout=0.1) on `q/k/v/o_proj`; 1 epoch; lr=2×10⁻⁴ cosine; batch=8 effective; Kaggle NVIDIA T4; eval every 100 steps; min val-loss at step 800 (1.856) |
| **Implementation** | `SFTTrainer` (TRL); `BitsAndBytesConfig`; LoRA via PEFT; W&B logging; adapter saved to Hugging Face Hub |
| **Repository Files** | `research/08_finetune.ipynb`, `research/12_modal_llm_engineering.ipynb` |
| **Appendix** | `thesis/appendices/appendix_c.tex` — Full Training Configuration |

#### §3.6 — Evaluation Framework

| Aspect | Detail |
|--------|--------|
| **Research Objectives** | RO3, RO4, RO5, RO6 |
| **Experiments** | 3 conditions: zero-shot Llama, fine-tuned Llama (step-800 & final ckpt), GPT-4.1-nano; metrics: MAE, MSE, R² |
| **Implementation** | Greedy decoding (LLaMA); regex score extraction; `scikit-learn` metrics; LiteLLM for GPT-4.1-nano API |
| **Repository Files** | `research/07_model_evaluation.ipynb`, `research/09_finetuned_model_evaluation.ipynb`, `research/11_finetuned_model_evaluation_v2.ipynb`, `research/10_frontier_model_evaluation.ipynb` |

#### §3.7 — Serverless Inference Deployment

| Aspect | Detail |
|--------|--------|
| **Research Objective** | RO4 (deployment validation) |
| **Experiment** | Ephemeral Modal function (~30 s cold start); persistent warm service (~2 s warm); Gradio HF Space; React dashboard on GitHub Pages |
| **Implementation** | Modal `@app.function` + `@app.cls`; PEFT adapter loading; Gradio form UI; `deploy_space.py` programmatic Space provisioning; React 18 + Vite + Tailwind; RBSS logic mirrored in `webapp/src/lib/cricket.js` |
| **Repository Files** | `research/t20_scorer_ephemeral.py`, `research/t20_scorer_service.py`, `research/app.py`, `research/deploy_space.py`, `research/util.py`, `research/13_gradio_score_predictor.ipynb`, `webapp/src/` |

---

### Chapter 4 — Results

| Experiment | RO | Key Result | Notebooks |
|---|---|---|---|
| Zero-shot Llama 3.2-3B (n=200) | RO3 | MAE=71.31, R²=−317.4% | `research/07_model_evaluation.ipynb` |
| Fine-tuned step-800 checkpoint (n=200) | RO4, RO5 | MAE=17.05, R²=66.4% | `research/09_finetuned_model_evaluation.ipynb` |
| Fine-tuned final checkpoint (n=200) | RO5 | MAE=16.12, R²=65.4% | `research/09_finetuned_model_evaluation.ipynb` |
| Fine-tuned step-800 checkpoint (n=500) | RO4, RO5 | MAE=16.51, R²=68.3% ✓ selected | `research/11_finetuned_model_evaluation_v2.ipynb` |
| Fine-tuned final checkpoint (n=500) | RO5 | MAE=16.54, R²=68.1% | `research/11_finetuned_model_evaluation_v2.ipynb` |
| GPT-4.1-nano zero-shot (n=200) | RO6 | MAE=30.02, R²=14.0% | `research/10_frontier_model_evaluation.ipynb` |

**Files:** `thesis/chapters/04_results.tex`, `thesis/appendices/appendix_d.tex`

---

### Chapters 5–7 — Discussion, Conclusion, Recommendations

| Chapter | Focus | File |
|---------|-------|------|
| Ch. 5 — Discussion | Interpretation of findings; limitations; future work | `thesis/chapters/05_discussion.tex` |
| Ch. 6 — Conclusion | Summary of contributions vs. RO1–RO6 | `thesis/chapters/06_conclusion.tex` |
| Ch. 7 — Recommendations | Cricket boards, ML researchers, MLOps, future researchers | `thesis/chapters/07_recommendations.tex` |

---

### Appendices

| Appendix | Content | Related Files |
|----------|---------|---------------|
| A — Prompt Schema & Sample Pairs | Full prompt template + example prompt–completion pairs | `forecaster/json_schema_template.json`, `t20s_json/sample_input.json` |
| B — Player Classification Rules | Role classification thresholds used for RBSS | `forecaster/player_classification.py` |
| C — Full Training Configuration | Complete hyperparameter tables, LoRA config | `research/08_finetune.ipynb` |
| D — Sample Model Outputs | Raw predictions across conditions | `research/09_finetuned_model_evaluation.ipynb`, `research/10_frontier_model_evaluation.ipynb` |
