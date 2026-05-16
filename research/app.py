"""
T20 First-Innings Score Predictor — Gradio app for Hugging Face Spaces.

Secrets required (set in HF Space Settings → Variables and secrets):
  HF_TOKEN       — your Hugging Face token (needed by Modal)
  MODAL_TOKEN_ID — Modal token ID  (ak-...)
  MODAL_TOKEN_SECRET — Modal token secret  (as-...)

The prediction is served by the deployed Modal service "t20-scorer-service".
Run `modal deploy -m t20_scorer_service` once before starting this app.
"""

import json
import os

import gradio as gr
import modal

# ── Connect to the deployed Modal service ────────────────────────────────────
Scorer = modal.Cls.from_name("t20-scorer-service", "Scorer")
scorer = Scorer()

# ── Batting strength weights (from 05_data_processing_remaining_depth.ipynb) ─
BATTING_WEIGHTS = {
    "batter": 1.0,
    "all_rounder": 0.8,
    "utility_player": 0.65,
    "bowler": 0.3,
    "unknown": 0.45,  # INSUFFICIENT_DATA default
}


def calculate_batting_strength(
    remaining_batters: int,
    remaining_all_rounders: int,
    remaining_utility_players: int,
    remaining_bowlers: int,
    remaining_unknown: int,
) -> float:
    score = (
        remaining_batters * BATTING_WEIGHTS["batter"]
        + remaining_all_rounders * BATTING_WEIGHTS["all_rounder"]
        + remaining_utility_players * BATTING_WEIGHTS["utility_player"]
        + remaining_bowlers * BATTING_WEIGHTS["bowler"]
        + remaining_unknown * BATTING_WEIGHTS["unknown"]
    )
    return round(score, 2)


def build_prompt(
    venue, par_score, batting_team,
    overs_completed, balls_remaining,
    runs_scored, wickets_lost,
    runs_last_2_overs, dot_balls_total, dot_balls_last_2,
    fours, sixes, powerplay_completed,
    remaining_batters, remaining_all_rounders,
    remaining_utility_players, remaining_bowlers, remaining_unknown,
) -> tuple[str, float, float]:
    run_rate = round(runs_scored / overs_completed, 2) if overs_completed > 0 else 0.0
    batting_strength = calculate_batting_strength(
        remaining_batters, remaining_all_rounders,
        remaining_utility_players, remaining_bowlers, remaining_unknown,
    )
    powerplay_str = "Yes" if powerplay_completed else "No"
    prompt = (
        f"Match type: T20\n"
        f"Venue: {venue}\n"
        f"Venue par score: {par_score}\n"
        f"Batting team: {batting_team}\n"
        f"\n"
        f"Overs completed: {overs_completed}\n"
        f"Balls remaining: {int(balls_remaining)}\n"
        f"Runs scored: {int(runs_scored)}\n"
        f"Wickets lost: {int(wickets_lost)}\n"
        f"Current run rate: {run_rate}\n"
        f"\n"
        f"Runs in last 2 overs: {int(runs_last_2_overs)}\n"
        f"Dot balls so far: {int(dot_balls_total)}\n"
        f"Dot balls in last 2 overs: {int(dot_balls_last_2)}\n"
        f"\n"
        f"Fours hit: {int(fours)}\n"
        f"Sixes hit: {int(sixes)}\n"
        f"\n"
        f"Powerplay completed: {powerplay_str}\n"
        f"\n"
        f"Remaining Batting Strength Score: {batting_strength}\n"
        f"\n"
        f"Final 1st innings score:"
    )
    return prompt, run_rate, batting_strength


def predict_score(
    venue, par_score, batting_team,
    overs_completed, balls_remaining,
    runs_scored, wickets_lost,
    runs_last_2_overs, dot_balls_total, dot_balls_last_2,
    fours, sixes, powerplay_completed,
    remaining_batters, remaining_all_rounders,
    remaining_utility_players, remaining_bowlers, remaining_unknown,
):
    prompt, run_rate, batting_strength = build_prompt(
        venue, par_score, batting_team,
        overs_completed, balls_remaining,
        runs_scored, wickets_lost,
        runs_last_2_overs, dot_balls_total, dot_balls_last_2,
        fours, sixes, powerplay_completed,
        remaining_batters, remaining_all_rounders,
        remaining_utility_players, remaining_bowlers, remaining_unknown,
    )
    info = f"Run rate: {run_rate:.2f}  |  Batting Strength Score: {batting_strength}"
    try:
        score = scorer.predict.remote(prompt)
        return f"**Predicted Final Score: {score:.0f} runs**", info, prompt
    except Exception as e:
        return f"Error: {e}", info, prompt


# ── JSON upload helpers ───────────────────────────────────────────────────────
# Keys must match the order of all_inputs in the UI below
JSON_KEYS = [
    "venue", "par_score", "batting_team",
    "overs_completed", "balls_remaining",
    "runs_scored", "wickets_lost",
    "runs_last_2_overs", "dot_balls_total", "dot_balls_last_2",
    "fours", "sixes", "powerplay_completed",
    "remaining_batters", "remaining_all_rounders",
    "remaining_utility", "remaining_bowlers", "remaining_unknown",
]


def load_from_json(file):
    if file is None:
        return [None] * len(JSON_KEYS)
    try:
        with open(file, "r") as f:
            data = json.load(f)
        return [data.get(k) for k in JSON_KEYS]
    except Exception as e:
        raise gr.Error(f"Could not parse JSON file: {e}")


# ── Gradio UI ─────────────────────────────────────────────────────────────────
with gr.Blocks(title="T20 Score Predictor") as demo:
    gr.Markdown("# T20 First-Innings Score Predictor")
    gr.Markdown(
        "Enter the raw match state, or **upload a JSON file** to populate all fields at once. "
        "The app calculates **Current Run Rate** and **Remaining Batting Strength Score** "
        "automatically before calling the model."
    )

    # JSON upload
    with gr.Row():
        with gr.Column(scale=2):
            json_upload = gr.File(
                label="Upload match state JSON (optional)",
                file_types=[".json"],
                file_count="single",
            )
        with gr.Column(scale=3):
            gr.Markdown(
                "**Expected JSON keys:**\n"
                "`venue`, `par_score`, `batting_team`, `overs_completed`, `balls_remaining`, "
                "`runs_scored`, `wickets_lost`, `runs_last_2_overs`, `dot_balls_total`, "
                "`dot_balls_last_2`, `fours`, `sixes`, `powerplay_completed` *(bool)*, "
                "`remaining_batters`, `remaining_all_rounders`, `remaining_utility`, "
                "`remaining_bowlers`, `remaining_unknown`"
            )

    gr.Markdown("---")

    # Venue & Innings State
    with gr.Row():
        with gr.Column():
            gr.Markdown("### Venue & Teams")
            venue        = gr.Textbox(label="Venue")
            par_score    = gr.Number(label="Venue Par Score", precision=0)
            batting_team = gr.Textbox(label="Batting Team")

        with gr.Column():
            gr.Markdown("### Innings State")
            overs_completed = gr.Slider(label="Overs Completed", minimum=0, maximum=20, step=1)
            balls_remaining = gr.Number(label="Balls Remaining", precision=0)
            runs_scored     = gr.Number(label="Runs Scored", precision=0)
            wickets_lost    = gr.Slider(label="Wickets Lost", minimum=0, maximum=10, step=1)

    # Recent play & Batting lineup
    with gr.Row():
        with gr.Column():
            gr.Markdown("### Recent Play")
            runs_last_2_overs   = gr.Number(label="Runs in Last 2 Overs", precision=0)
            dot_balls_total     = gr.Number(label="Dot Balls So Far", precision=0)
            dot_balls_last_2    = gr.Number(label="Dot Balls in Last 2 Overs", precision=0)
            fours               = gr.Number(label="Fours Hit", precision=0)
            sixes               = gr.Number(label="Sixes Hit", precision=0)
            powerplay_completed = gr.Checkbox(label="Powerplay Completed")

        with gr.Column():
            gr.Markdown("### Remaining Batting Lineup")
            gr.Markdown(
                "Count players **not yet dismissed** by role. "
                "Strength score weights: Batter=1.0 · All-rounder=0.8 · Utility=0.65 · Bowler=0.3 · Unknown=0.45"
            )
            remaining_batters      = gr.Slider(label="Specialist Batters remaining", minimum=0, maximum=11, step=1)
            remaining_all_rounders = gr.Slider(label="All-rounders remaining",       minimum=0, maximum=11, step=1)
            remaining_utility      = gr.Slider(label="Utility players remaining",    minimum=0, maximum=11, step=1)
            remaining_bowlers      = gr.Slider(label="Bowlers remaining",            minimum=0, maximum=11, step=1)
            remaining_unknown      = gr.Slider(label="Unknown / insufficient data",  minimum=0, maximum=11, step=1)

    predict_btn = gr.Button("Predict Score", variant="primary")

    score_output = gr.Markdown(label="Prediction")

    with gr.Accordion("Calculated values", open=False):
        calc_output = gr.Textbox(interactive=False, show_label=False)

    with gr.Accordion("Prompt sent to model", open=False):
        prompt_output = gr.Textbox(lines=22, interactive=False, show_label=False)

    all_inputs = [
        venue, par_score, batting_team,
        overs_completed, balls_remaining,
        runs_scored, wickets_lost,
        runs_last_2_overs, dot_balls_total, dot_balls_last_2,
        fours, sixes, powerplay_completed,
        remaining_batters, remaining_all_rounders,
        remaining_utility, remaining_bowlers, remaining_unknown,
    ]

    json_upload.upload(fn=load_from_json, inputs=[json_upload], outputs=all_inputs)

    predict_btn.click(
        fn=predict_score,
        inputs=all_inputs,
        outputs=[score_output, calc_output, prompt_output],
    )

if __name__ == "__main__":
    demo.launch()
