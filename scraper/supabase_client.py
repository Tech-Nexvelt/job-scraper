import os
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

# Configure logging for diagnostics
logger = logging.getLogger("supabase_client")

# Load environment variables from .env file if it exists
load_dotenv()

def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")

    if not url or not key:
        # Check for common variants if primary ones are missing
        url = url or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        key = key or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

    # Clean the inputs (handle accidental whitespace in GitHub Secrets)
    url = url.strip()
    key = key.strip()

    # Masked diagnostics to help debug GitHub Actions issues
    masked_key = f"{key[:3]}...{key[-3:]}" if len(key) > 6 else "***"
    logger.info(f"Supabase Client Diagnostics: URL={url[:12]}..., KeyLength={len(key)}, KeyMask={masked_key}")

    # Validation check for key format
    if key.startswith("sb_secret_"):
        logger.warning("WARNING: SUPABASE_KEY starts with 'sb_secret_'. This usually indicates a Management API Key or PAT. "
                       "For the Database client, you should use the 'service_role' or 'anon' key (which start with 'eyJ').")

    try:
        return create_client(url, key)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        # Raise more descriptive error for "Invalid API key" common issue
        if "Invalid API key" in str(e):
            raise ValueError(
                f"Supabase rejected the API key (Length: {len(key)}). "
                "Ensure you are using the 'service_role' key (JWT format, starts with 'eyJ') "
                "from Project Settings -> API in the Supabase dashboard."
            ) from e
        raise

# Initialize the global instance
supabase: Client = get_supabase_client()
