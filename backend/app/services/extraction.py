"""Field extraction from OCR results.

Strategy (layered):
  1. Regex + terminology map  — deterministic, handles "Label: Value" patterns
  2. spaCy NER               — catches PERSON, GPE, DATE, CARDINAL entities
                               when labels are absent (e.g. raw handwritten text)
  3. Position/layout heuristics — uses bbox y-coordinate ordering

Falls back gracefully if spaCy is not installed.
"""
import re
from dataclasses import dataclass, field
from typing import Optional
from app.services.ocr import OCRResult

# ---------------------------------------------------------------------------
# Terminology / state-aware field mapping
# ---------------------------------------------------------------------------
TERMINOLOGY_MAP = {
    # Plot / parcel identifiers
    "dag no": "plot_number", "dag no.": "plot_number", "dag number": "plot_number",
    "khasra no": "khasra_number", "khasra no.": "khasra_number", "khasra number": "khasra_number",
    "plot no": "plot_number", "plot no.": "plot_number", "plot number": "plot_number",
    "survey no": "survey_number", "survey no.": "survey_number", "survey number": "survey_number",
    # Khatian / Khata
    "khatiyan no": "khatian_number", "khatiyan no.": "khatian_number",
    "khatian no": "khatian_number", "khatian no.": "khatian_number",
    "khata no": "khatian_number", "khata no.": "khatian_number",
    "khata number": "khatian_number",
    # Owner
    "owner name": "owner", "owner": "owner", "malik": "owner",
    "bhumiswami": "owner", "khatedar": "owner",
    "previous owner": "previous_owner", "purana malik": "previous_owner",
    "new owner": "owner", "naya malik": "owner",
    # Location
    "village": "village", "gram": "village", "gaon": "village",
    "mouza": "mouza", "mauza": "mouza",
    "district": "district", "zila": "district", "jila": "district",
    "tehsil": "tehsil", "taluk": "tehsil", "taluka": "tehsil",
    "block": "tehsil", "mandal": "tehsil",
    "state": "state", "rajya": "state",
    # Area
    "area": "area", "land area": "area", "bhumi": "area",
    "rukba": "area", "raqba": "area", "bhumi kshetrafal": "area",
    # Classification
    "land classification": "land_classification",
    "classification": "land_classification",
    "land type": "land_classification",
    "bhumi prakar": "land_classification",
    "land use": "land_classification",
    # Mutation
    "mutation no": "mutation_number", "mutation no.": "mutation_number",
    "mutation number": "mutation_number",
    "dakhil kharij no": "mutation_number", "dakhil kharij no.": "mutation_number",
    "mutation date": "mutation_date",
    # Registration
    "registration no": "registration_number", "registration no.": "registration_number",
    "registration number": "registration_number",
    "deed no": "registration_number", "deed number": "registration_number",
    "registration date": "registration_date",
    # Co-owner / share
    "co-owner": "co_owner", "co owner": "co_owner", "sahbhagi": "co_owner",
    "share": "owner_share", "hissa": "owner_share",
}

AREA_PATTERN = re.compile(
    r"([\d.]+)\s*(acre|hectare|bigha|guntha|sq\.?\s*ft|sq\.?\s*m|biswa|katha|marla)",
    re.IGNORECASE,
)
DATE_PATTERN = re.compile(r"\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}")
SHARE_PATTERN = re.compile(r"(\d+(?:\.\d+)?)\s*%")
NUMBER_PATTERN = re.compile(r"\d+")


@dataclass
class ExtractedField:
    field_name: str
    extracted_value: str
    original_label: str
    confidence: float
    bbox: list
    page_number: int = 1
    source: str = "regex"   # "regex" | "ner" | "heuristic"


def normalize_label(raw_label: str) -> Optional[str]:
    key = raw_label.strip().lower().rstrip(":").strip()
    return TERMINOLOGY_MAP.get(key)


# ---------------------------------------------------------------------------
# Layer 1: Regex + terminology map
# ---------------------------------------------------------------------------
def _extract_by_regex(ocr_results: list[OCRResult]) -> list[ExtractedField]:
    fields = []
    for result in ocr_results:
        text = result.text.strip()
        if ":" not in text:
            continue
        parts = text.split(":", 1)
        raw_label = parts[0].strip()
        value = parts[1].strip()
        field_name = normalize_label(raw_label)
        if not field_name or not value:
            continue

        # Post-process value by field type
        if field_name == "area":
            m = AREA_PATTERN.search(value)
            value = m.group(0) if m else value
        elif field_name in ("mutation_date", "registration_date"):
            m = DATE_PATTERN.search(value)
            value = m.group(0) if m else value
        elif field_name == "owner_share":
            m = SHARE_PATTERN.search(value)
            value = m.group(1) if m else value

        fields.append(ExtractedField(
            field_name=field_name,
            extracted_value=value,
            original_label=raw_label,
            confidence=result.confidence,
            bbox=result.bbox,
            page_number=result.page_number,
            source="regex",
        ))
    return fields


# ---------------------------------------------------------------------------
# Layer 2: spaCy NER — fills gaps when labels are absent
# ---------------------------------------------------------------------------
_nlp = None


def _get_nlp():
    """Lazy-load spaCy model. Returns None if spaCy is not installed."""
    global _nlp
    if _nlp is not None:
        return _nlp
    try:
        import spacy
        # Try small English model first, fall back to blank
        try:
            _nlp = spacy.load("en_core_web_sm")
        except OSError:
            _nlp = spacy.blank("en")
    except ImportError:
        _nlp = None
    return _nlp


def _extract_by_ner(
    ocr_results: list[OCRResult],
    already_found: set[str],
) -> list[ExtractedField]:
    """Use spaCy NER to extract PERSON, GPE, DATE, CARDINAL from raw text
    for fields not already found by the regex layer."""
    nlp = _get_nlp()
    if nlp is None:
        return []

    fields = []
    for result in ocr_results:
        text = result.text.strip()
        if not text:
            continue
        doc = nlp(text)
        for ent in doc.ents:
            label = ent.label_
            value = ent.text.strip()
            if not value:
                continue

            # Map spaCy entity types to our field names
            if label == "PERSON" and "owner" not in already_found:
                fields.append(ExtractedField(
                    field_name="owner",
                    extracted_value=value,
                    original_label=label,
                    confidence=result.confidence * 0.85,  # NER is less certain
                    bbox=result.bbox,
                    page_number=result.page_number,
                    source="ner",
                ))
                already_found.add("owner")

            elif label in ("GPE", "LOC") and "village" not in already_found:
                fields.append(ExtractedField(
                    field_name="village",
                    extracted_value=value,
                    original_label=label,
                    confidence=result.confidence * 0.80,
                    bbox=result.bbox,
                    page_number=result.page_number,
                    source="ner",
                ))
                already_found.add("village")

            elif label == "DATE" and "mutation_date" not in already_found:
                m = DATE_PATTERN.search(value)
                if m:
                    fields.append(ExtractedField(
                        field_name="mutation_date",
                        extracted_value=m.group(0),
                        original_label=label,
                        confidence=result.confidence * 0.80,
                        bbox=result.bbox,
                        page_number=result.page_number,
                        source="ner",
                    ))
                    already_found.add("mutation_date")

            elif label == "CARDINAL" and "area" not in already_found:
                # Only treat as area if it looks like a measurement
                m = AREA_PATTERN.search(text)
                if m:
                    fields.append(ExtractedField(
                        field_name="area",
                        extracted_value=m.group(0),
                        original_label=label,
                        confidence=result.confidence * 0.75,
                        bbox=result.bbox,
                        page_number=result.page_number,
                        source="ner",
                    ))
                    already_found.add("area")

    return fields


# ---------------------------------------------------------------------------
# Layer 3: Layout / position heuristic
# Sorts results by y-coordinate (top-to-bottom reading order)
# ---------------------------------------------------------------------------
def _sort_by_position(ocr_results: list[OCRResult]) -> list[OCRResult]:
    return sorted(ocr_results, key=lambda r: (r.page_number, r.bbox[1] if r.bbox else 0))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def extract_fields(ocr_results: list[OCRResult]) -> list[ExtractedField]:
    """
    Extract structured land record fields from OCR results.
    Uses regex (primary) + spaCy NER (gap-filling) + position ordering.
    """
    # Sort by reading order first
    ordered = _sort_by_position(ocr_results)

    # Layer 1: regex
    regex_fields = _extract_by_regex(ordered)
    found_field_names = {f.field_name for f in regex_fields}

    # Layer 2: NER for any fields not found by regex
    ner_fields = _extract_by_ner(ordered, found_field_names)

    return regex_fields + ner_fields
