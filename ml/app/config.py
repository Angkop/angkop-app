import os

from dotenv import load_dotenv

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME", "all-MiniLM-L6-v2")
NCF_WEIGHTS_PATH = os.getenv("NCF_WEIGHTS_PATH", "./weights/ncf.pt")
NCF_ID_MAPPING_PATH = os.getenv("NCF_ID_MAPPING_PATH", "./weights/id_mappings.json")

# Lets a retrained model ship by uploading to this bucket + restarting the service,
# instead of committing weights to git or redeploying code — see DEPLOYMENT.md Phase 4.
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
NCF_WEIGHTS_BUCKET = os.getenv("NCF_WEIGHTS_BUCKET", "ml-weights")

# Weight given to the collaborative score in the hybrid blend ramps up with how much
# interaction history a user has, per the thesis's stated design (cold-start users lean
# on the semantic score; established users lean more on collaborative signal).
COLLABORATIVE_WEIGHT_FLOOR = 0.1
COLLABORATIVE_WEIGHT_CEILING = 0.6
COLLABORATIVE_WEIGHT_STEP_PER_INTERACTION = 0.05

# A user/job pair the NCF model has never seen (cold start) gets a neutral collaborative
# score rather than a fabricated confident one.
COLD_START_COLLABORATIVE_SCORE = 0.5

# Below this per-skill cosine similarity, a job's required skill is considered a gap.
SKILL_GAP_SIMILARITY_THRESHOLD = 0.5
