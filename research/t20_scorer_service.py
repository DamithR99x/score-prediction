import modal
from modal import Volume, Image

# Setup

app = modal.App("t20-scorer-service")
image = Image.debian_slim().pip_install(
    "torch", "transformers", "bitsandbytes", "accelerate", "peft"
)
secrets = [modal.Secret.from_name("huggingface-secret")]

# Constants

GPU = "T4"
BASE_MODEL = "meta-llama/Llama-3.2-3B"
FINETUNED_MODEL = "ratnayakatilanka/t20_score_prediction_keggle-2026-04-18_04.16.40-lite"
REVISION = "00be3f3f2cb4af3cd727c68284ca3dcbad7656a4"  # step-800, min eval/loss = 1.85624
CACHE_DIR = "/cache"

# Change to 1 to keep a container always warm (uses credits continuously)
MIN_CONTAINERS = 0

hf_cache_volume = Volume.from_name("hf-hub-cache", create_if_missing=True)


@app.cls(
    image=image.env({"HF_HUB_CACHE": CACHE_DIR}),
    secrets=secrets,
    gpu=GPU,
    timeout=1800,
    min_containers=MIN_CONTAINERS,
    volumes={CACHE_DIR: hf_cache_volume},
)
class Scorer:
    @modal.enter()
    def setup(self):
        """Load the base model and apply LoRA adapters once at container start."""
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
        from peft import PeftModel

        quant_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_type="nf4",
        )

        self.tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
        self.tokenizer.pad_token = self.tokenizer.eos_token
        self.tokenizer.padding_side = "right"

        base_model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL,
            quantization_config=quant_config,
            device_map="auto",
        )

        self.fine_tuned_model = PeftModel.from_pretrained(
            base_model, FINETUNED_MODEL, revision=REVISION
        )
        self.fine_tuned_model.eval()

    @modal.method()
    def predict(self, prompt: str) -> float:
        """Predict the T20 first-innings final score from a structured match-state prompt.

        The prompt should follow the format produced by build_prompt() in
        06_data_processing_prompt_generation.ipynb, ending with 'Final 1st innings score:'.
        Returns the predicted score as a float, or 0.0 if parsing fails.
        """
        import re
        import torch
        from transformers import set_seed

        set_seed(42)
        inputs = self.tokenizer(prompt, return_tensors="pt").to("cuda")
        prompt_len = inputs["input_ids"].shape[1]

        with torch.no_grad():
            output_ids = self.fine_tuned_model.generate(**inputs, max_new_tokens=8)

        generated_ids = output_ids[0, prompt_len:]
        generated_text = self.tokenizer.decode(generated_ids, skip_special_tokens=True)

        match = re.search(r"\b\d{2,3}\b", generated_text)
        return float(match.group()) if match else 0.0
