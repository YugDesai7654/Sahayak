import io
import logging
from typing import Optional, Dict
from PIL import Image

logger = logging.getLogger(__name__)


async def extract_fields_from_image(image_bytes: bytes) -> Dict[str, Optional[str]]:
    """
    OCR an Aadhaar/ration card image and extract fields.
    Returns extracted fields: name, dob, address, aadhaar_last4, gender.
    Gracefully degrades if Tesseract is not available.
    """
    from app.core.config import settings

    result = {
        "name": None,
        "dob": None,
        "address": None,
        "aadhaar_last4": None,
        "gender": None,
        "raw_text": ""
    }

    try:
        import pytesseract
        if settings.TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

        image = Image.open(io.BytesIO(image_bytes))
        # OCR with Hindi + English
        text = pytesseract.image_to_string(image, lang="hin+eng")
        result["raw_text"] = text

        # Simple field extraction heuristics
        lines = text.strip().split("\n")
        lines = [l.strip() for l in lines if l.strip()]

        for i, line in enumerate(lines):
            lower = line.lower()

            # Gender detection
            if "male" in lower and "female" not in lower:
                result["gender"] = "male"
            elif "female" in lower:
                result["gender"] = "female"

            # Aadhaar number pattern (last 4 digits)
            import re
            aadhaar_match = re.search(r'\d{4}\s?\d{4}\s?\d{4}', line)
            if aadhaar_match:
                full = aadhaar_match.group().replace(" ", "")
                result["aadhaar_last4"] = full[-4:]

            # DOB pattern
            dob_match = re.search(r'\d{2}[/-]\d{2}[/-]\d{4}', line)
            if dob_match:
                result["dob"] = dob_match.group()

            # Name heuristic: first text line that is not a label
            if not result["name"] and len(line) > 3 and not any(
                kw in lower for kw in ["government", "india", "aadhaar", "unique",
                                        "authority", "dob", "male", "female",
                                        "address", "vid", "download"]
            ):
                result["name"] = line

        return result

    except ImportError:
        logger.warning("pytesseract not installed. OCR unavailable.")
        return result
    except Exception as e:
        logger.error(f"OCR extraction failed: {e}")
        return result
