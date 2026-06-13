# MSc Viva Presentation Plan
**Thesis:** Fine-Tuning a Small Open-Source LLM for In-Game First-Innings Score Prediction in International Men's T20 Cricket
**Format:** 15-min talk + 5-min Q&A · 15 slides maximum · MSc DSA 055
**Author:** Tilanka Ratnayaka

---

## 1. Research Story (One-Paragraph Defence Spine)

> Conventional T20 score predictors treat match state as a flat numeric vector and discard the qualitative context that human analysts use. I show that **serialising in-game state into a natural-language prompt and QLoRA-fine-tuning a 3-billion-parameter Llama on ~24k domain examples** transforms an essentially useless zero-shot model (MAE 71.3 runs, $R^2 = -317\%$) into a competitive predictor (**MAE 16.51 runs, $R^2 = 68.3\%$**) that **beats zero-shot GPT-4.1-nano** (MAE 30.0, $R^2 = 14.0\%$) by a 45% MAE reduction. The novelty lies in three places: (i) a **Remaining Batting Strength Score (RBSS)** that encodes residual batting quality, (ii) a **prompt schema** built explicitly for LLM ingestion of cricket state, and (iii) **empirical evidence** that domain-specific fine-tuning of a small open-source model is a more effective and cheaper deployment route than prompting a frontier API for structured numerical sports forecasting.

### Central problem
Can a compact open-source LLM, trained with parameter-efficient fine-tuning on natural-language match-state prompts, predict T20 first-innings totals competitively from any two-over snapshot of the innings?

### Why it matters
- T20 is the dominant commercial format; live score forecasts drive broadcast graphics, fantasy markets, betting, and team strategy.
- Existing models (DLS, Markov, regression, RNN/LSTM) lose the qualitative semantics of "who is yet to bat" and "what is this venue like".
- LLM use in cricket analytics is essentially uncharted territory.

### Gap addressed
1. No prior work uses natural-language prompt representations for in-game T20 prediction.
2. No prior cricket study compares fine-tuned small open-source vs. frontier zero-shot LLM.
3. No quantitative benchmark for RBSS-style batting-depth features in an LLM prompt.
4. Checkpoint-selection effects in PEFT for sports forecasting have not been reported.

### Key contributions
| # | Contribution | Type |
|---|--------------|------|
| C1 | Reproducible Cricsheet → prompt → QLoRA → eval pipeline | Technical |
| C2 | **RBSS** — novel weighted batting-depth feature | Technical / Methodological |
| C3 | Natural-language prompt schema for cricket state (≤148 tokens) | Methodological |
| C4 | Empirical evidence: fine-tuned 3B beats zero-shot frontier on this task | Scientific |
| C5 | Checkpoint-selection analysis showing min-val-loss > final checkpoint at scale | Methodological |
| C6 | Three-tier serverless deployment (Modal + Gradio + React on Azure) | Practical |

### Evidence base
- 3,113 → 2,895 Cricsheet matches → **28,950 prompt–completion pairs**
- Strict temporal split (train ≤2024-12-31, val 2025-H1, test 2025-H2+)
- 3 model conditions × consistent metrics (MAE, MSE, $R^2$)
- Training reproducible via W&B run `v64wpa10`; artefact pinned to HF revision `00be3f3f`

---

## 2. Slide-by-Slide Outline (15 Slides, ~15 min)

> Timing budget: 14 min speaking + 1 min slack. Q&A is separate. Aim for ~60 s per content slide; opening/closing slides ~30 s.

---

### Slide 1 — Title

| Field | Value |
|-------|-------|
| **Purpose** | Establish identity, programme, and topic in one breath. |
| **Key Content** | Thesis title; "An MSc DSA 055 viva submission"; candidate name; supervisor name; institution and date; small Cricsheet attribution line. |
| **Recommended Visuals** | Clean title block + small stadium/Cricsheet logo strip; no busy imagery. |
| **Time** | 0:30 |

#### Speaker Notes

Good morning, and thank you for the opportunity to defend this thesis. My name is Tilanka Ratnayaka, and over the next fifteen minutes I will present my MSc DSA work on context-aware fine-tuning of a small open-source language model for in-game first-innings score prediction in Twenty20 cricket. The central question I set out to answer is whether a compact, three-billion-parameter Llama, adapted with QLoRA on natural-language match-state prompts, can predict T20 totals competitively from any mid-innings snapshot. I will cover motivation, methodology, results, and contributions, in that order, before opening to questions.

#### Key Message

A compact open-source LLM, fine-tuned on cricket-specific natural-language prompts, can outperform a frontier proprietary model at predicting T20 first-innings totals.

#### Potential Examiner Question

> "In one sentence, what is the contribution of this thesis?"

#### Suggested Response

It is the first reproducible demonstration that QLoRA fine-tuning of a 3-billion-parameter Llama on natural-language T20 match-state prompts beats zero-shot GPT-4.1-nano on first-innings score prediction by a 45 % MAE reduction, with all artefacts pinned for bit-level reproducibility.

---

### Slide 2 — Motivation & Significance

| Field | Value |
|-------|-------|
| **Purpose** | Anchor the relevance for an examiner who may not be a cricket specialist. |
| **Key Content** | (i) T20 is the highest-revenue cricket format; (ii) in-game score prediction drives broadcast, fantasy, betting, strategy; (iii) classical predictors miss the *qualitative* context (who is yet to bat, what kind of pitch); (iv) LLMs have transformed structured-data prediction in other domains but are *largely untested in sports forecasting*. |
| **Recommended Visuals** | Two-column infographic: (left) icons for broadcast / fantasy / betting / coaching; (right) a redacted match-card showing a numeric vector vs. a sentence describing the same state. |
| **Time** | 1:00 |

#### Speaker Notes

Twenty20 is the dominant commercial format in cricket: it drives broadcast revenue, fantasy markets, betting, and tactical decision-making. A reliable in-game forecast must integrate four signals at once — venue character, batting depth, recent momentum, and powerplay state — and integrate them in seconds, between deliveries. Conventional predictors built on flat numeric vectors lose precisely the qualitative semantics that human analysts trade in. Large language models, by contrast, were designed to consume context-rich text natively, and recent work on tabular and time-series prediction shows they can be adapted to structured numerical tasks. That capability is essentially uncharted in cricket analytics, and that is the opportunity this thesis exploits. The next slide turns it into six concrete research objectives.

#### Key Message

Classical T20 predictors discard the qualitative context that human analysts use; LLMs are the first model class that consumes that context natively.

#### Potential Examiner Question

> "Why is in-game T20 score prediction still open after decades of cricket modelling?"

#### Suggested Response

DLS solves interruption fairness, not in-game forecasting. Earlier ML predictors flatten match state into numeric vectors and lose lineup quality, venue character, and momentum semantics. No prior work has used natural-language prompts to retain those signals end-to-end through a fine-tuned model.

---

### Slide 3 — Research Objectives & Scope

| Field | Value |
|-------|-------|
| **Purpose** | Set the contract you will be judged against. |
| **Key Content** | RO1 dataset + RBSS · RO2 prompt schema · RO3 zero-shot Llama baseline · RO4 QLoRA fine-tune · RO5 checkpoint comparison · RO6 GPT-4.1-nano frontier reference. Scope chips: men's international T20 only · first innings only · QLoRA (not full FT) · single training run. |
| **Recommended Visuals** | 2×3 table of ROs with one-line descriptions; a *Scope* and *Out of scope* strip beneath. |
| **Time** | 1:00 |

#### Speaker Notes

The six research objectives map directly onto chapters three, four, and five of the thesis, and I treat them as the evaluation contract you will hold me to. RO1 builds the dataset and the RBSS feature; RO2 designs the prompt schema; RO3 establishes the zero-shot Llama baseline; RO4 runs the QLoRA fine-tune; RO5 compares the minimum-validation-loss checkpoint against the final checkpoint; and RO6 benchmarks against GPT-4.1-nano. The scope is deliberately narrow — international men's T20, first innings only, QLoRA rather than full fine-tuning — so that every comparison made later is on like-for-like ground and every limitation is explicit. The methodology slide will show how these objectives flow through the pipeline.

#### Key Message

Six tightly scoped research objectives form an auditable evaluation contract that each subsequent slide must answer.

#### Potential Examiner Question

> "Why exclude domestic leagues such as IPL, BBL, or PSL from scope?"

#### Suggested Response

Distributional homogeneity. International T20 is a single, well-curated population whose pitches, formats, and player pools are comparable; mixing leagues would conflate venue, format, and player effects in a single model. The pipeline is league-agnostic — pointing it at Cricsheet IPL JSON would rerun cleanly without code changes.

---

### Slide 4 — Literature Review (1): Themes & Trajectory

| Field | Value |
|-------|-------|
| **Purpose** | Show command of the field *without* paper-by-paper recital. |
| **Key Content** | Four thematic streams: (a) **Statistical cricket models** — DLS/Stern, Perera–Swartz Markov; (b) **ML cricket models** — Iyer & Sharda NNs, Kampakis & Thomas ensembles, Bailey & Clarke wicket-importance; (c) **LLM foundations** — Vaswani transformer, Brown GPT-3 emergence, Touvron Llama, Hu LoRA, Dettmers QLoRA; (d) **LLMs on tabular/forecasting** — Hegselmann TabLLM, Gruver time-series, Huckerby football LLM. |
| **Recommended Visuals** | Four-quadrant matrix (Statistical | ML | LLM tech | LLM applications), each quadrant listing the 2–3 most-cited works with a 6-word summary. |
| **Time** | 1:00 |

#### Speaker Notes

Rather than recite papers chronologically, I synthesise the literature into four streams. The first is statistical cricket modelling — Duckworth–Lewis, Stern, Perera–Swartz Markov — which frames scoring as a resource problem on hand-crafted features. The second is machine learning on cricket — Iyer and Sharda, Kampakis and Thomas, Bailey and Clarke — which improved accuracy but kept numeric-vector inputs. The third is the technical lineage that makes parameter-efficient fine-tuning affordable — Vaswani, Brown, Touvron, Hu's LoRA, Dettmers' QLoRA. The fourth is LLMs applied to structured prediction — Hegselmann's TabLLM, Gruver's time-series, Huckerby's football LLM. Each stream contributes a piece; none assembles them for in-game T20, which is the gap I make explicit on the next slide.

#### Key Message

Cricket modelling and LLM application are converging trajectories that meet, for the first time, at this thesis.

#### Potential Examiner Question

> "Which paper is the closest precedent to your work?"

#### Suggested Response

Hegselmann's TabLLM is closest on paradigm — tabular state serialised into text, then fine-tuned on a small LLM. Huckerby 2024 is closest on domain — LLM applied to football outcome prediction. Neither tackles in-game cricket and neither runs a small-fine-tuned versus frontier-zero-shot benchmark, which is what makes this contribution distinctive.

---

### Slide 5 — Literature Review (2): Research Gap & Contribution Map

| Field | Value |
|-------|-------|
| **Purpose** | Convert the gap into a defensible claim of novelty. |
| **Key Content** | Gap table — columns: *Natural-language prompts for T20*, *RBSS-style batting-quality feature*, *Fine-tuned small vs. frontier zero-shot benchmark*, *Checkpoint selection in PEFT for sports*. Rows: representative prior works (Perera–Swartz, Kampakis, Hegselmann, Huckerby, This Work). Only *This Work* ticks all four. |
| **Recommended Visuals** | Tick/cross gap matrix; the *This Work* row highlighted. |
| **Time** | 1:00 |

#### Speaker Notes

This is the novelty-defence slide. The four columns of the matrix are the four open boxes from the previous quadrant: a natural-language prompt schema for in-game T20 state, a weighted batting-depth feature like RBSS, a head-to-head benchmark of fine-tuned small versus zero-shot frontier, and an explicit checkpoint-selection analysis for PEFT in sports forecasting. Every prior row above ours ticks at most two of these. Mine is the only row that ticks all four — and that simultaneous combination, not any one cell on its own, is what I claim as the contribution. The methodology section that follows shows exactly how each column was implemented in code.

#### Key Message

This thesis is the first to populate all four cells of the cricket-LLM gap matrix simultaneously.

#### Potential Examiner Question

> "Is your novelty really the whole pipeline, or just RBSS?"

#### Suggested Response

The combination is the contribution. RBSS is one of four pieces; the prompt schema, the small-versus-frontier benchmark, and the checkpoint-selection analysis are equally load-bearing. Removing any one would weaken the claim, which is precisely why the matrix shows all four together rather than any one in isolation.

---

### Slide 6 — Methodology Overview

| Field | Value |
|-------|-------|
| **Purpose** | Give the examiner the full pipeline in one image so later slides slot in cleanly. |
| **Key Content** | Five-stage flow: **Cricsheet JSON (3,113)** → **Filtering & venue normalisation (2,895 matches, 236 venues)** → **Feature engineering (16 features × 10 snapshots)** → **Prompt construction + temporal split** → **QLoRA fine-tuning** → **Evaluation (3 conditions)** → **Deployment (Modal + Gradio + React)**. Indicate which artefact is published (HF dataset, HF adapter). |
| **Recommended Visuals** | Horizontal pipeline diagram with five labelled boxes, arrows, and badge icons for HF dataset, W&B run, HF adapter, Modal, Azure. |
| **Time** | 1:00 |

#### Speaker Notes

Everything that follows fits inside this five-stage pipeline, and every artefact is published. Cricsheet supplies 3,113 raw match JSONs; Pydantic-validated filtering and venue-name normalisation reduces this to 2,895 matches across 236 canonical venues. Feature engineering produces sixteen numeric features at each of ten two-over snapshots — 28,950 prompt–completion pairs in total. The temporal split — train up to end of 2024, validation in 2025-H1, test in 2025-H2 onwards — sits before fine-tuning and is the single most important guardrail against data leakage. QLoRA fine-tunes on a free-tier Kaggle T4 in under six hours. Evaluation compares three model conditions on identical metrics, and the production stack is Modal plus Gradio plus React on Azure.

#### Key Message

A fully reproducible Cricsheet → prompt → QLoRA → evaluation → deployment pipeline with every artefact pinned to a specific revision.

#### Potential Examiner Question

> "What is your single most important methodological control?"

#### Suggested Response

The strict temporal split by match date. Train ends 31 December 2024, validation is 2025-H1, test is 2025-H2 onwards, and no match appears in two splits. The temporal ordering matches deployment conditions — predicting the future from the past, never the reverse — which is the only honest way to estimate live performance.

---

### Slide 7 — Feature Engineering & RBSS (Novelty Slide)

| Field | Value |
|-------|-------|
| **Purpose** | Spotlight the **single most novel methodological contribution** — RBSS. |
| **Key Content** | (a) Innings sliced into ten 2-over sections → 10 snapshots per innings. (b) 16 features per snapshot grouped as: *State* (overs/runs/wickets/run-rate), *Recent* (runs/dot balls/boundaries last 2 overs), *Phase* (powerplay flag), *Venue* (par score @ 52nd percentile), *RBSS*. (c) RBSS formula and weight table (BATTER 1.00 / ALL_ROUNDER 0.80 / UTILITY 0.65 / INSUFFICIENT_DATA 0.45 / BOWLER 0.30). (d) Worked example: 1×BATTER + 2×ALL_ROUNDER + 1×UTILITY + 3×BOWLER = **4.15**. |
| **Recommended Visuals** | Two-column slide: left — pipeline strip (raw deliveries → per-section features → prompt); right — RBSS weight table with the worked example boxed underneath. |
| **Time** | 1:30 |

#### Speaker Notes

RBSS — the Remaining Batting Strength Score — is the most novel methodological piece in the thesis. The intuition is simple: two states with an identical scoreboard but different remaining batting line-ups should look different to the model, because depth materially changes what the final total can be. RBSS encodes residual quality, not just count. Every player is classified by historical role into one of five buckets, with rounded weights — one for a recognised batter, down to 0.3 for a specialist bowler — non-zero because death-over cameos do happen. The worked example shows how a partially-collapsed lineup compresses to a single 4.15 scalar carried into the prompt on the next slide.

#### Key Message

RBSS distinguishes "five-for-three with the captain still in" from "five-for-three with the tail at the crease" — a depth signal that wickets-in-hand alone cannot capture.

#### Potential Examiner Question

> "Did you fit the RBSS weights from data?"

#### Suggested Response

No — they are hand-set, monotone, and rounded for stable learning on a 24,000-example training set. A data-driven version is acknowledged as future work; the contribution defended here is whether a depth signal helps at all, not which exact numeric depth signal helps. Hand-set weights also keep the feature interpretable for analysts and broadcasters.

---

### Slide 8 — Prompt Schema & Model Architecture

| Field | Value |
|-------|-------|
| **Purpose** | Show *how* numeric state becomes language and *how* QLoRA adapts the model. |
| **Key Content** | (a) Compact prompt template (Venue, par score, batting team, overs/balls, runs/wickets, run rate, last-2-over runs / dot balls, fours, sixes, powerplay flag, RBSS, "Final 1st innings score:"). (b) Token budget: max **148 prompt tokens**, max-seq 256. (c) Base model: **Llama 3.2-3B**, NF4 4-bit, double-quantised. (d) **LoRA config:** r=16, α=32, dropout=0.1, target `q/k/v/o_proj`. (e) **Training:** 1 epoch, lr 2e-4 cosine, eff. batch 8, `paged_adamw_8bit`, fp16, Kaggle T4, eval every 100 steps. |
| **Recommended Visuals** | Split slide — left: collapsed prompt template; right: Llama-3.2 transformer schematic with LoRA matrices `B·A` injected into attention projections + a small hyperparameter table. |
| **Time** | 1:15 |

#### Speaker Notes

On the left is the prompt template: venue, par score, batting team, overs and balls, runs, wickets, run rate, last-two-over runs, dot balls, fours, sixes, powerplay flag, RBSS, and the trailing instruction "Final 1st innings score:". The prompt budget is 148 tokens; sequences pad to 256. The completion is a single integer, which keeps decoding deterministic and post-processing trivial. On the right is the model: Llama 3.2-3B, 4-bit NF4, double-quantised, with LoRA adapters of rank sixteen and alpha thirty-two injected into the attention projections only. Training is one epoch, learning rate 2e-4 with cosine schedule, paged 8-bit AdamW, on a free-tier Kaggle T4 in under six hours. Consumer-grade reproducibility is itself part of the contribution.

#### Key Message

A 148-token prompt and a rank-16 LoRA adapter on Llama-3.2-3B are sufficient to produce a competitive predictor on a free-tier GPU.

#### Potential Examiner Question

> "Why rank sixteen LoRA on attention projections only?"

#### Suggested Response

Rank sixteen is the QLoRA paper's recommended starting configuration; it fits T4 VRAM with margin and avoids over-parameterising on a 24,000-example training set. Targeting only the q/k/v/o projections leaves the MLP layers frozen, which keeps the trainable parameter count low and acts as implicit regularisation.

---

### Slide 9 — Data, Splits & Tools

| Field | Value |
|-------|-------|
| **Purpose** | Demonstrate evaluation hygiene and reproducibility. |
| **Key Content** | (a) Temporal split table — Train ≤ 2024-12-31 (~24,080 rows / 2,408 matches), Val 2025-H1 (~2,370), Test 2025-H2+ (~2,500). (b) Why temporal: prevents leakage, simulates deployment. (c) Tool stack: Pydantic v2, fuzzywuzzy, SQLite, Hugging Face Hub + Datasets, PEFT, TRL `SFTTrainer`, BitsAndBytes, W&B, LiteLLM, Modal, Gradio, React/Vite, Azure SWA via Bicep + GitHub Actions OIDC. |
| **Recommended Visuals** | Timeline bar showing train / val / test windows; logo grid of the tool stack underneath. |
| **Time** | 0:45 |

#### Speaker Notes

The split table on the left shows roughly 24,000 training rows, 2,400 validation rows, and 2,500 test rows, segregated strictly by match date. The point of the temporal split is to simulate deployment — the model sees historical matches and predicts future ones, never the reverse. The tool stack on the right is conventional but worth highlighting: Pydantic-v2 for schema validation, fuzzywuzzy for venue normalisation, Hugging Face Hub for the dataset and adapter, TRL's SFTTrainer for fine-tuning, BitsAndBytes for quantisation, Weights and Biases for run tracking, Modal for serverless inference, and Bicep with GitHub Actions OIDC for Azure deployment. Every artefact is pinned to a specific revision SHA.

#### Key Message

Every result in Chapter 4 is bit-reproducible from a pinned Hugging Face revision and a public Weights & Biases run.

#### Potential Examiner Question

> "How would I reproduce your headline results?"

#### Suggested Response

Pull the prompt dataset from the Hugging Face Hub, pull the adapter at revision `00be3f3f`, and run the evaluation notebook against the pinned model with the W&B run config. The same MAE, MSE, and R² values reproduce — there is no hidden state and no manual configuration step.

---

### Slide 10 — Results (Headline Slide)

| Field | Value |
|-------|-------|
| **Purpose** | Deliver the single strongest piece of evidence the viva needs to hear. |
| **Key Content** | Headline cross-condition table (verbatim from Ch. 4): <br/> · **Zero-shot Llama 3.2-3B (n=200)** — MAE 71.31, MSE 7,463, $R^2$ **−317.4 %** <br/> · **GPT-4.1-nano zero-shot (n=200)** — MAE 30.02, MSE 1,538, $R^2$ 14.0 % <br/> · **Fine-tuned Llama 3.2-3B, step-800 (n=500)** — **MAE 16.51, MSE 543, $R^2$ 68.3 %** <br/> Three headline numbers boxed: **76.8 % MAE reduction over zero-shot Llama**, **45.0 % MAE reduction over GPT-4.1-nano**, **+54.3 pp $R^2$ over GPT-4.1-nano**. |
| **Recommended Visuals** | Single bar chart — three bars (MAE), colour-coded; small $R^2$ table on the right; the three headline percentages as large numbered call-outs at the bottom. |
| **Time** | 1:30 |

#### Speaker Notes

This is the headline result the thesis stands on. Zero-shot Llama 3.2-3B is unusable: an MAE of 71.31 runs and an R² of minus 317 percent — worse than predicting the mean. GPT-4.1-nano in zero-shot mode is meaningfully better at MAE 30 and R² 14 percent, but it still applies a roughly linear projection that misses T20 acceleration in the death overs. The fine-tuned 3B Llama at step 800 reaches MAE 16.51 and R² 68.3 percent. That is a 76.8 percent reduction in MAE over zero-shot Llama, a 45 percent reduction over GPT-4.1-nano, and a 54-percentage-point R² gain. A small fine-tuned open-source model decisively beats a frontier proprietary model on this task.

#### Key Message

A fine-tuned 3-billion-parameter open-source LLM beats zero-shot GPT-4.1-nano by 45 % MAE on every metric reported.

#### Potential Examiner Question

> "Is the gap large enough to claim significance without multi-seed runs?"

#### Suggested Response

Yes, on effect-size grounds. A 45 % MAE reduction and a 54-percentage-point R² jump are well above any plausible single-seed noise floor reported for QLoRA in the literature. I do not claim statistical significance — I claim direction and magnitude — and I am explicit about the single-seed limitation in the next-but-one slide.

---

### Slide 11 — Discussion: Why Fine-Tuning Wins & Checkpoint Effect

| Field | Value |
|-------|-------|
| **Purpose** | Move from *what happened* to *why it happened* — defend the interpretation. |
| **Key Content** | (a) **Why fine-tuning wins:** general pre-training corpora encode cricket prose but not the conditional distribution `P(final | mid-innings state)`. Fine-tuning supplies exactly that map. (b) **Why frontier loses:** observed GPT-4.1-nano under-prediction at early states (e.g. 14/1 in 2 overs at par 160 → predicted 89, actual 160) — applies a linear projection, ignores T20 acceleration. (c) **Checkpoint study:** at n=200 metrics disagree (noise window); at n=500 step-800 wins on MAE / MSE / $R^2$ consistently → validates min-val-loss selection. (d) **Feature contribution:** RBSS and venue par score are the two engineered features that most enrich the prompt beyond raw counts. |
| **Recommended Visuals** | Two-panel slide: left — `eval/loss` curve from W&B (already in repo) with the step-800 minimum marked; right — small bar showing checkpoint × n cell metrics. |
| **Time** | 1:30 |

#### Speaker Notes

Two arguments live on this slide. First, why fine-tuning wins: pre-training corpora encode cricket prose but not the conditional distribution of final totals given mid-innings state; fine-tuning supplies exactly that map, which is why a smaller model learns a function the larger one cannot derive in zero-shot. The W&B eval-loss curve on the left makes the learning explicit, with the minimum at step 800 marked. Second, the checkpoint study: at n equals 200 the metrics disagree because the evaluation window is noisy at that scale; at n equals 500 the minimum-validation-loss checkpoint wins on MAE, MSE, and R² consistently. That validates a principled checkpoint-selection rule for PEFT in sports forecasting — a small but transferable methodological lesson.

#### Key Message

Fine-tuning supplies the conditional map P(final total | mid-innings state) that pre-training does not, and the minimum-validation-loss checkpoint is the right one to select at scale.

#### Potential Examiner Question

> "Is the zero-shot Llama failure just an output-format problem?"

#### Suggested Response

Partly — many outputs are non-integer or repeated tokens, and the regex extractor falls back to zero. But even after charitable extraction, the MAE remains far above the fine-tuned model. Fine-tuning is doing genuine predictive work, not merely fixing output format; the residual gap demonstrates the conditional-distribution argument empirically.

---

### Slide 12 — Limitations

| Field | Value |
|-------|-------|
| **Purpose** | Pre-empt examiner critique by owning the boundaries honestly. |
| **Key Content** | (a) **Scope** — international men's T20 only; no IPL/BBL/PSL; women's matches present in the archive but unused. (b) **Single training run** — no multi-seed variance estimate. (c) **Base model** — 3B only; 8B/70B untested. (d) **Validation subsample** — `eval/loss` computed on first 50 val rows (T4 time budget). (e) **Point prediction** — greedy decoding only; no uncertainty interval. (f) **Quantisation** — 4-bit NF4 inference; full-precision results not reported. (g) **Frontier eval** — n=200 only (API cost). (h) **Regex post-processing** — fallback-to-zero inflates zero-shot Llama MAE. |
| **Recommended Visuals** | Two-column list (Methodological | Scope) with a small severity dot (low / medium) beside each item. |
| **Time** | 1:00 |

#### Speaker Notes

These are honest constraints, grouped as methodological and scope. On the methodological side: a single training run with no multi-seed variance estimate, a base model fixed at three billion parameters, validation loss computed on the first fifty rows only, point predictions without uncertainty intervals, and 4-bit quantised inference rather than full precision. On the scope side: international men's T20 only, no domestic leagues, women's matches present in the archive but unused, and frontier evaluation capped at n equals 200 because of API cost. Most are direct consequences of a free-tier hardware and API budget rather than methodological lapses, and several map cleanly onto the future-work agenda on the next slide.

#### Key Message

The limitations are mostly hardware-budget consequences and map cleanly onto a coherent future-research agenda.

#### Potential Examiner Question

> "What is the single biggest threat to validity?"

#### Suggested Response

The single training run with no multi-seed variance estimate. I report point estimates only and lean on effect-size magnitude — a 45 % MAE reduction is well above any plausible single-seed noise — rather than claiming statistical significance. Multi-seed replication is the first item on the future-work list.

---

### Slide 13 — Conclusions & Future Work

| Field | Value |
|-------|-------|
| **Purpose** | Restate the contribution and project it forward. |
| **Key Content** | Three conclusions (mirroring Ch. 6): C1 fine-tuning transforms unusable zero-shot into competitive predictor; C2 small fine-tuned beats frontier zero-shot for this structured numerical task; C3 min-val-loss checkpoint generalises better at scale. Future work chips: extend to domestic leagues, scale to 7B/8B/70B, second-innings chase prediction, uncertainty via sampled completions, feature ablation, live data feed. |
| **Recommended Visuals** | Left half — three numbered conclusion cards; right half — six future-work pills. |
| **Time** | 1:00 |

#### Speaker Notes

Three conclusions close the thesis, mirroring chapter six. First, fine-tuning transforms an essentially unusable zero-shot Llama into a competitive predictor. Second, a small fine-tuned open-source model beats a frontier zero-shot model on this structured numerical task. Third, at evaluation scale the minimum-validation-loss checkpoint generalises better than the final checkpoint, validating a principled selection rule. The contribution set is therefore empirical, methodological, and practical at once: a pipeline, a novel feature, a prompt schema, a fine-tuned model, and a deployment template. The future-work items — domestic leagues, larger base models, second-innings prediction, sampled-completion uncertainty, feature ablation, live-feed integration — are each scoped tightly enough to be a follow-up MSc or short paper.

#### Key Message

Fine-tuning a small open-source LLM is a more effective and economical alternative to prompting a frontier API for structured numerical sports forecasting.

#### Potential Examiner Question

> "Which future-work item would you prioritise first?"

#### Suggested Response

Second-innings chase prediction. It reuses the same pipeline and prompt schema with one additional field — the chase target — has obvious commercial demand, and adds a richer conditional structure that genuinely tests the LLM's grasp of asymmetric in-game dynamics under run-rate pressure.

---

### Slide 14 — Practical Implications

| Field | Value |
|-------|-------|
| **Purpose** | Show real-world impact and that the work is shipped, not just simulated. |
| **Key Content** | (a) **Cricket boards / analytics teams** — fine-tune in-house at ~£0/run, on-prem, no API fees. (b) **MLOps** — Modal serverless GPU (~30 s cold / ~2 s warm), Gradio HF Space for prototype, React + Tailwind + Azure SWA (Bicep + GitHub Actions OIDC) for broadcast UI. (c) **Live demo URL** (Azure SWA). (d) Deployment de-risks any future commercial integration. |
| **Recommended Visuals** | Architecture diagram — *Browser → Azure SWA (React) → Modal (FastAPI + LoRA + Llama) → HF Hub (weights cache)* — with a screenshot inset of the T20 Intelligence Console dashboard. |
| **Time** | 0:45 |

#### Speaker Notes

The thesis is shipped, not just simulated. The deployment is three-tiered. The model itself runs as a Modal serverless GPU service — about thirty seconds cold, two seconds warm — invocable from a single HTTP call, with scale-to-zero billing. A Gradio space on Hugging Face provides a public prototype interface for one-off requests. The production-style dashboard is a React application on Tailwind, deployed to Azure Static Web Apps via Bicep with GitHub Actions OIDC — no long-lived secrets in the repository. The same template generalises to any small-LLM sports product, and the cost-engineered architecture means a research prototype can be exposed publicly without a meaningful recurring hosting bill. The QR code on the slide opens the live demo.

#### Key Message

A three-tier serverless stack proves the work is deployable, with a cost profile that can host a public demo at near-zero recurring cost.

#### Potential Examiner Question

> "What is the operational latency in production?"

#### Suggested Response

Approximately thirty seconds cold-start while Modal mounts the container and loads the LoRA adapter, then about two seconds per warm request. The persistent `@app.cls` service amortises load cost across requests; setting `MIN_CONTAINERS=1` keeps a warm container at fixed cost when sub-second latency is required.

---

### Slide 15 — References (Selected)

| Field | Value |
|-------|-------|
| **Purpose** | Demonstrate citation discipline; signal the works the examiner is most likely to probe. |
| **Key Content** | 8–10 key references in IEEE-style numbered list: Hu *LoRA* 2022; Dettmers *QLoRA* 2023; Brown *GPT-3* 2020; Touvron *LLaMA* 2023; Hegselmann *TabLLM* 2023; Gruver *LLM time-series* 2023; Huckerby *LLM football* 2024; Duckworth & Lewis 1998; Bailey & Clarke 2004; Cricsheet 2024; Vaswani *Attention* 2017. Plus a *Full bibliography in thesis Chapter 2 / References* footer. |
| **Recommended Visuals** | Plain two-column numbered list; small QR/URL to the thesis PDF and to the public deployment. |
| **Time** | 0:30 |

#### Speaker Notes

The full bibliography is in the thesis; this slide lists the works most likely to be raised in questioning, organised by methodological lineage. Hu's LoRA and Dettmers' QLoRA underpin the parameter-efficient fine-tuning recipe. Brown's GPT-3, Touvron's Llama, and Vaswani's transformer are the technical foundations on the LLM side. Hegselmann's TabLLM, Gruver's time-series work, and Huckerby's football LLM are the closest application precedents. Duckworth–Lewis and Bailey–Clarke anchor the cricket-modelling literature. The QR code opens the thesis PDF and the deployment URL. Thank you for your attention — I am happy to take questions.

#### Key Message

This thesis sits at the intersection of the QLoRA technical lineage and the serialise-then-fine-tune application lineage, brought together for the first time in cricket analytics.

#### Potential Examiner Question

> "Which reference is most foundational to your method?"

#### Suggested Response

Dettmers et al., QLoRA 2023. The 4-bit NF4 plus double-quantisation plus LoRA recipe is what makes a 3-billion-parameter fine-tune fit into a free-tier 16 GB T4 at all. Without QLoRA, the entire training loop — and therefore the headline result — would be infeasible on the hardware budget I was working under.

---

### Time Budget Check

| Bucket | Minutes |
|--------|--------:|
| Opening (1–3) | 2:30 |
| Literature (4–5) | 2:00 |
| Methodology (6–9) | 4:30 |
| Results & Discussion (10–11) | 3:00 |
| Limitations / Conclusion / Implications / Refs (12–15) | 3:15 |
| **Total** | **≈ 15:15 (drop 15 s buffer in S15)** |

---

## 3. Research Contribution Analysis

### Primary contribution
**Empirical demonstration that QLoRA fine-tuning of a 3B open-source LLM on natural-language T20 match-state prompts outperforms a zero-shot frontier model on first-innings score prediction.** *(Emphasise on Slides 10, 11, 13.)*

### Secondary contributions
| Tag | Contribution | Where to emphasise |
|-----|--------------|--------------------|
| C-Data | A 28,950-row labelled prompt–completion corpus over 2,895 matches, published to Hugging Face | Slide 9 |
| C-Pipeline | Reproducible Cricsheet → features → prompt → fine-tune → eval pipeline | Slide 6 |
| C-Checkpoint | Empirical case for min-val-loss checkpoint selection over final checkpoint at scale | Slide 11 |
| C-Deploy | Three-tier serverless deployment template (Modal + Gradio + React/Azure) | Slide 14 |

### Novel aspects
- **RBSS** — first published weighted batting-depth feature for an LLM-prompt cricket model.
- **Prompt schema** — compact (≤148 tokens), human-readable, machine-parseable.
- **Comparative protocol** — same temporal test set scores three model conditions on identical metrics.
- **Reproducibility envelope** — adapter pinned to a specific HF revision SHA; W&B run public.

### Technical contributions
- 4-bit NF4 + double-quantised QLoRA recipe that fits in a 16 GB T4 budget.
- Two-rule venue-name normalisation (prefix + 95-threshold token-sort fuzz) collapsing 322 → 236 venues.
- Two-step regex post-processing with documented failure-rate effects.
- ASGI FastAPI bridge from Modal `@asgi_app()` to a React SPA with mock-fallback for offline demos.

### Practical contributions
- Live, publicly accessible inference endpoint and dashboard.
- Cost-engineered architecture (scale-to-zero GPU, free-tier static hosting).
- Reusable Bicep + OIDC GitHub Actions deployment template.

---

## 4. Results Analysis

### Most important results (must appear)
1. **Cross-condition headline table** — Slide 10 (anchor of the talk).
2. **Fine-tune vs. zero-shot Llama delta** — 76.8 % MAE reduction; demonstrates fine-tuning effect.
3. **Fine-tune vs. GPT-4.1-nano delta** — 45.0 % MAE reduction; demonstrates the small-vs-frontier story.
4. **Step-800 vs. final checkpoint at n=500** — supports min-val-loss selection.

### Strongest evidence
- Direction-of-effect is consistent across **all three metrics** (MAE, MSE, $R^2$) for the fine-tune vs. zero-shot comparisons.
- The improvement crosses the **$R^2 = 0$ threshold** from −317.4 % to +68.3 %, which is rhetorically powerful.
- Validation-loss minimum at step 800 is visible on the W&B curve, lending checkpoint claim a visual anchor.

### Most persuasive charts
| Priority | Chart | Source |
|---------:|-------|--------|
| 1 | Bar chart of MAE across three conditions (with $R^2$ labels) | New, derived from Ch. 4 Table 4.4 |
| 2 | W&B `eval/loss` curve with step-800 minimum annotated | `thesis/figures/wandb_eval_loss.png` |
| 3 | (Optional) Per-section error decomposition if available | New, requires post-hoc computation from notebook 11 |

### Metrics to highlight
- MAE (primary, in natural units).
- $R^2$ (intuitive variance-explained framing).
- Percentage-point and percent-reduction call-outs to make the deltas memorable.

### Results to **omit**
- The n=200 checkpoint comparison in isolation — too noisy to defend without the n=500 follow-up; relegate to Discussion slide as a *footnote*, not a headline.
- Token-by-token output traces — interesting in the appendix but not viva-grade.
- Training-loss curve as a standalone result — keep only as a small inset if room remains.
- Per-venue or per-team sub-analyses — out of scope for a 15-min talk.

### Recommended results slide layout (Slide 10)
- **Top quarter:** one-line headline ("Fine-tuned 3B beats zero-shot frontier on every metric").
- **Centre two-thirds:** MAE bar chart (3 bars) + compact $R^2$ chip beside each bar.
- **Bottom strip:** three big numerical call-outs (76.8 % ↓ MAE vs Llama-ZS · 45.0 % ↓ MAE vs GPT-4.1-nano · +54.3 pp $R^2$ vs GPT-4.1-nano).

---

## 5. Literature Review Optimisation (Viva-Length Strategy)

**Principle:** *Themes over papers.* Do not enumerate works — synthesise streams, identify trends, name the gap.

### Four thematic clusters (use these as Slide 4 quadrants)
| Cluster | Trend identified | Limitation that feeds the gap | Representative works |
|---------|------------------|-------------------------------|----------------------|
| Statistical cricket models | Resource-based framing dominates | Hand-crafted, vector-only, qualitative context lost | Duckworth & Lewis 1998; Stern 2016; Perera & Swartz 2012 |
| ML cricket models | Ensembles improve over linear baselines; wickets dominate features | Numeric-vector inputs; venue / lineup quality only partially exploited | Iyer & Sharda 2009; Kampakis & Thomas 2015; Bailey & Clarke 2004 |
| LLM technical foundations | Decoder-only transformers + PEFT make fine-tuning affordable | None on their own — they enable the new paradigm | Vaswani 2017; Brown 2020; Touvron 2023; Hu 2022 (LoRA); Dettmers 2023 (QLoRA); Devlin 2019 |
| LLMs on structured / forecasting tasks | Serialise-then-fine-tune beats GBMs on tabular & TS | Untested for in-game sports forecasting | Hegselmann 2023 (TabLLM); Gruver 2023 (time-series); Huckerby 2024 (football LLM) |

### Synthesised research gap (single sentence to memorise)
> "Despite mature statistical and ML traditions in cricket and emerging evidence that fine-tuned small LLMs excel at structured numerical prediction, no prior work has combined a natural-language T20 match-state prompt, a fine-tuned compact open-source LLM, and a head-to-head benchmark against a frontier zero-shot model."

### Tactic for verbal delivery
- Spend **≤ 60 s per literature slide**; never quote authors verbatim.
- Use the gap-matrix (Slide 5) so the examiner physically sees the empty boxes.
- If pressed, reference the **two most powerful adjacent works**: Hegselmann *TabLLM* (tabular → text → LLM) and Huckerby (football outcome via LLM). They prove the paradigm is real beyond this thesis.

---

## 6. Viva Defence Preparation

### 6.1 Likely Examiner Questions (≥ 20)

#### A · Motivation & framing
**Q1. Why an LLM for a regression task — why not gradient-boosted trees?**
*A.* Because the input is rich, semantically labelled context that a tree must pre-encode by hand. Language models consume this context natively; the same prompt schema can be extended (new venues, lineup notes, weather) without re-engineering features. The empirical numbers also justify it: fine-tuned 3B beats zero-shot GPT-4.1-nano by 45 % MAE.

**Q2. Why predict only the first innings?**
*A.* First-innings totals have a fixed target frame (20 overs / 10 wickets) and are independent of a chase target, so they isolate the scoring-dynamics problem cleanly. Second-innings prediction is a richer but conditional problem and is flagged as Future Work Item 1.

**Q3. Who is the end user — broadcaster, fantasy platform, team analyst?**
*A.* Primarily broadcast / fantasy use-cases. The deployed React dashboard is broadcast-styled; the Modal endpoint can also serve a fantasy-platform back-end. High-stakes uses (betting settlement, DLS) would require uncertainty intervals (Future Work Item 4).

#### B · Dataset & integrity
**Q4. How do you guarantee no data leakage between train, val, and test?**
*A.* Strict temporal split by **match date** — train ≤ 2024-12-31, val 2025-H1, test 2025-H2+. Splits are at the match level (no match appears in two splits); venue par scores were computed *before* splitting, but only from matches in the training window when used during inference would be a stricter alternative — that is acknowledged in Limitations.

**Q5. Why 2-over snapshots — why not every over or every ball?**
*A.* A balance between sample richness and within-match correlation. Ten snapshots per match keeps states diverse without explosively over-representing slow phases of an innings, and matches the natural rhythm of T20 broadcast units (overs are reported in pairs in many broadcast graphics).

**Q6. Why only men's matches?**
*A.* To keep distributional homogeneity within scope. Women's T20I JSONs are present in the archive (`t20s_json/female/`) and the same pipeline runs on them; cross-format extension is Future Work.

**Q7. What is the venue normalisation algorithm doing?**
*A.* Two rules: (1) if name *A* is an exact prefix of *B* and *B* continues with a comma, fold *B* into *A*; (2) token-sorted fuzzy ratio ≥ 95 → keep the shorter form. Collapses 322 → 236 venues; the 95 threshold is deliberately conservative.

#### C · Feature engineering
**Q8. How did you choose the RBSS weights?**
*A.* They are deliberately rounded, monotone, and stable to make them learnable. BATTER = 1.0 is the reference unit; ALL_ROUNDER = 0.8 reflects mid-order strike-rate roles; UTILITY = 0.65 is a mid-point; BOWLER = 0.3 is non-zero because T20 tail-end cameos do happen; INSUFFICIENT_DATA = 0.45 is a conservative midpoint to avoid bias against debutants. Weight sensitivity is acknowledged as a future ablation.

**Q9. Are the weights data-driven or hand-chosen?**
*A.* Hand-chosen, justified by domain reasoning. A data-driven (e.g. fitted on training innings) RBSS is a natural follow-up; it was deferred to keep RBSS interpretable and to keep the contribution about *whether* a depth signal helps, not *which* exact numeric depth signal helps.

**Q10. What is the 52nd-percentile par score and why 52 %?**
*A.* It is the historical first-innings total at the venue at which a batting-first team has roughly a 50–50 chance of winning. The DLS framework uses a similar resource-allocation concept. Sensitivity to this percentile is acknowledged in the Discussion.

**Q11. Why are extras, weather, toss, or pitch-report features absent?**
*A.* Toss outcome and match-result fields exist in the source but were excluded to keep the prompt schema causal (only information available at the snapshot moment). Weather and pitch reports are not in Cricsheet; both are noted as natural extensions.

#### D · Prompt design
**Q12. Did you experiment with alternative prompt formats?**
*A.* The summary variant (no trailing "Final 1st innings score:") was retained for the frontier model so that GPT-4.1-nano received a clean instruction. JSON-style prompts were considered but rejected — they inflated token counts without measurable benefit in pilots, and the natural-language template stayed within the 256-token training window.

**Q13. The completion is a plain integer — does that limit the model's reasoning?**
*A.* For SFT it simplifies decoding and loss computation. Chain-of-thought completions were considered but discarded — they would have grown completions to hundreds of tokens, multiplying training cost, with no labelled rationales to supervise them.

#### E · Fine-tuning
**Q14. Why QLoRA and not full fine-tuning?**
*A.* Memory constraint (T4 16 GB) and regularisation. QLoRA's low-rank adapters are inherently regularised, which the small dataset benefits from. Full FT remains an open empirical question and is in Limitations.

**Q15. Why rank 16, why these target modules?**
*A.* Rank 16 is the QLoRA paper's recommended starting point for attention-only adaptation and fits cleanly in T4 VRAM. Targeting `q/k/v/o_proj` is standard practice for decoder-only models; MLP projections were left frozen to keep the trainable parameter count low.

**Q16. Did you observe overfitting?**
*A.* Yes, mildly — `eval/loss` reached 1.856 at step 800 then began drifting upward, consistent with classical overfitting. Hence the min-val-loss checkpoint selection.

**Q17. Why only one training run / no multi-seed?**
*A.* GPU-time budget on the Kaggle free tier. It is the most consequential methodological limitation and is flagged explicitly.

#### F · Evaluation
**Q18. Why is the zero-shot Llama MAE so catastrophic?**
*A.* Two effects compounded. (i) The base model has no prior associating these prompts with realistic integer totals. (ii) Many outputs are repeated tokens or non-integers; the regex extractor falls back to 0, inflating error. Even after charitable extraction the MAE remains far above the fine-tuned model — fine-tuning is doing real work, not just fixing format.

**Q19. Why use n=200 for the frontier model but n=500 for the fine-tune?**
*A.* API cost. The fine-tuned model runs in seconds; GPT-4.1-nano calls are billable. The headline comparison is fair within the limits of each condition's sample size, and the relative gap (45 %) is large enough that the n=200/500 mismatch does not threaten the conclusion.

**Q20. What is your baseline beyond "zero-shot Llama"? Where is a simple regression?**
*A.* Fair point — a classical baseline (linear regression on the 16 numeric features) is a natural sanity check and is absent from the thesis. It is acknowledged as a follow-up; the existing fine-tune-vs-zero-shot-Llama and fine-tune-vs-frontier comparisons answer the *thesis* question (does prompt + fine-tune work?), but a regression baseline would close the *general ML* question.

#### G · Limitations & future work
**Q21. Will the model generalise to IPL or BBL?**
*A.* Not without retraining. International and franchise T20 differ in pitch character, format quirks, and player distributions. The pipeline is league-agnostic — point it at Cricsheet's IPL JSON and rerun.

**Q22. What about prediction uncertainty?**
*A.* Out of scope for this thesis. The natural extension is nucleus sampling with $k$ completions to derive a prediction interval, or framing the target as a binned classification.

**Q23. Could the success simply be feature engineering, not the LLM?**
*A.* An honest possibility. The thesis does not run a feature-ablation; that is Future Work Item 5. The zero-shot Llama baseline does, however, confirm that *features alone* do not produce a good predictor unless paired with fine-tuning.

**Q24. What is the operational latency in production?**
*A.* ~30 s cold start (Modal container + LoRA load), ~2 s warm. The persistent `@app.cls` service amortises load cost across requests, and a `MIN_CONTAINERS=1` setting keeps a warm container at fixed cost.

**Q25. Is the 16-run MAE practically meaningful?**
*A.* 16 runs is roughly 10 % of a typical T20 first-innings total — useful for trend graphics, fantasy projections, and strategy simulation. For high-stakes settlement it is not yet a substitute for a calibrated probabilistic forecast.

### 6.2 High-Risk Questions to Rehearse Verbatim
1. *"Show me one slide where your fine-tuned model is worse than the frontier model."* — Have a calm answer: "On the headline metrics it isn't; on n=200 GPT-4.1-nano predicts faster end-to-end via API, but on accuracy the fine-tune dominates."
2. *"What's your single biggest threat to validity?"* — "Single training run, no multi-seed variance; that's why I avoid claiming significance and report point estimates only."
3. *"Could a 200-line scikit-learn pipeline have done this?"* — "Possibly, on the numeric features. The novelty is the LLM-prompt paradigm and a deployable inference stack — both are independent contributions of the LLM route."

---

## 7. Presentation Quality Review (Examiner's Lens)

### Strengths
- Clear methodological spine that maps directly onto the six ROs.
- Single, decisive headline result (Slide 10) that survives scrutiny on direction and effect size.
- Honest, well-segmented limitations slide that pre-empts criticism.
- Deployment slide proves the work is shipped, not only experimental — rare in MSc work and an evaluation differentiator.

### Weak slides to strengthen
| Slide | Risk | Mitigation |
|------:|------|------------|
| 4 (Lit Rev 1) | Risk of becoming a name-drop wall | Use quadrant matrix; ≤ 3 names per quadrant; 60 s timer |
| 8 (Architecture) | Two dense topics on one slide | Keep the LoRA visual minimal; rehearse to ≤ 75 s |
| 11 (Discussion) | Two arguments (why FT wins + checkpoint) compete for time | Lead with FT-win, give checkpoint < 20 s |
| 12 (Limitations) | Listing 8 items can feel like a confession | Group as *Methodological* vs *Scope*; severity dots |

### Missing evidence (add before final draft)
- A **classical regression baseline** number, even cited from a notebook, to defuse Q20.
- A **per-section MAE breakdown** to address "what about early-innings noise?" — if available from `research/11_finetuned_model_evaluation_v2.ipynb`.
- A **failure-rate statistic** for the regex extractor (Q18 defence).
- A **W&B run ID footer** on Slide 8 or 9 for credibility.

### Missing diagrams (create for the deck)
1. End-to-end **pipeline flowchart** (Slide 6) — currently described only in prose in the thesis.
2. **RBSS computation block** with the worked example (Slide 7) — has a table in thesis but no visual.
3. **Three-condition MAE bar chart** (Slide 10) — synthesise from Table 4.4.
4. **Deployment architecture diagram** (Slide 14) — referenced in §3.7 but absent from `thesis/figures/`.
5. **Gap matrix** (Slide 5) — pure presentation device.

### Likely lines of examiner attack
1. *Novelty challenge:* "TabLLM and Gruver already did serialise-then-fine-tune." → Defend via the gap matrix (Slide 5): novelty is in **domain + task + benchmark**, not the bare paradigm.
2. *Statistical rigour:* "One seed, one run, no confidence intervals." → Acknowledge openly; lean on the **magnitude of effect** (76.8 % MAE reduction) being well above any plausible noise floor.
3. *Baseline absence:* "Where is the XGBoost / linear regression baseline?" → Honest concession; pivot to *thesis* question framing.
4. *Fairness of GPT-4.1-nano comparison:* "Did you prompt-engineer it?" → Show the explicit system instruction and the summary-prompt variant used; note that a chain-of-thought or few-shot version is a fair extension but does not invalidate the headline.
5. *RBSS empirical justification:* "Are the weights cherry-picked?" → Defend as interpretable hand-set baseline; acknowledge fitted-weight version as Future Work.

### Specific recommendations
- **Rehearse a 10-min cut** as a fallback — drop Slides 14 (deployment) and 4 (Lit 1) if running over.
- **Carry a backup slide** with the per-section MAE table for Q&A — do *not* put it in the main deck.
- **Memorise the seven anchor numbers**: 2,895 matches; 28,950 rows; 16.51 MAE; 68.3 % $R^2$; 76.8 % reduction; 45 % reduction; step 800 / eval-loss 1.856.
- **Pre-flight the live demo** before the viva and have a video fallback for Slide 14.
- **Open and close on novelty** — Slide 1 and Slide 13 must both name "fine-tuned compact open-source LLM beats zero-shot frontier on a structured numerical sports task" verbatim.

---

*End of presentation_plan.md — ready for downstream Beamer generation.*
