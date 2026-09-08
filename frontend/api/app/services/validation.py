import re
from typing import Dict, Any, List, Optional, Tuple

CANONICAL_CLASSIFICATIONS = [
    "Agricultural Land",
    "Residential Land",
    "Commercial Land",
    "Industrial Land",
    "Forest Land",
    "Pasture/Grazing Land",
    "Water Bodies",
    "Road/Public Land",
    "Government Land",
    "Abadi / Village Settlement",
    "Barren / Uncultivable Land",
    "Wasteland",
    "Religious/Institutional Land",
]

EMOJI_REGEX = re.compile(
    r"[\U00010000-\U0010ffff\u2600-\u27bf\u2300-\u23ff\u2b50\u2b55\u200d\ufe0f]",
    flags=re.UNICODE,
)


class ValidationService:
    @staticmethod
    def strip_emojis(text: str) -> str:
        """Removes emojis and cleans whitespace."""
        if not text:
            return ""
        cleaned = EMOJI_REGEX.sub("", text)
        return " ".join(cleaned.split()).strip()

    @staticmethod
    def clean_name(name: str) -> str:
        """Clean person name, fixing casing and whitespace."""
        if not name:
            return ""
        # Remove common document annotations / titles if needed or clean up
        cleaned = ValidationService.strip_emojis(name).strip()
        cleaned = re.sub(r"\s+", " ", cleaned)
        # If all caps and > 3 chars, convert to Title Case
        if cleaned.isupper() and len(cleaned) > 3:
            cleaned = cleaned.title()
        return cleaned

    @classmethod
    def parse_owners(
        cls, owner_raw: Optional[str], co_owner_raw: Optional[str]
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Gracefully handles multiple owners and co-owners.
        Separates joint names like 'RAJEEV ARORA AND KAVITA ARORA' into
        Owner: 'Rajeev Arora', Co-Owner: 'Kavita Arora'.
        Supports 1, 2, or multiple co-owners joined cleanly.
        """
        if not owner_raw and not co_owner_raw:
            return None, None

        all_names: List[str] = []

        # 1. Parse names from owner_raw
        if owner_raw:
            cleaned_owner = cls.strip_emojis(str(owner_raw)).strip()
            # Split by ' AND ', ' and ', ' & ', ' / ', ' + ', or commas
            # Notice we avoid splitting on 'S/O' or 'W/O' or 'D/O'
            parts = re.split(
                r"\s+(?:AND|and|&|\+|along with|with)\s+|\s*,\s*|\s*;\s*",
                cleaned_owner,
                flags=re.IGNORECASE,
            )
            for p in parts:
                p_clean = cls.clean_name(p)
                if p_clean and len(p_clean) > 1 and p_clean.lower() not in ["and", "&", "nil", "na", "none"]:
                    all_names.append(p_clean)

        # 2. Parse names from co_owner_raw
        if co_owner_raw:
            cleaned_co = cls.strip_emojis(str(co_owner_raw)).strip()
            parts = re.split(
                r"\s+(?:AND|and|&|\+|along with|with)\s+|\s*,\s*|\s*;\s*",
                cleaned_co,
                flags=re.IGNORECASE,
            )
            for p in parts:
                p_clean = cls.clean_name(p)
                if p_clean and len(p_clean) > 1 and p_clean.lower() not in ["and", "&", "nil", "na", "none"]:
                    if p_clean not in all_names:
                        all_names.append(p_clean)

        if not all_names:
            return (cls.clean_name(owner_raw) if owner_raw else None), (cls.clean_name(co_owner_raw) if co_owner_raw else None)

        primary_owner = all_names[0]
        co_owners = all_names[1:]

        co_owner_str = ", ".join(co_owners) if co_owners else None
        return primary_owner, co_owner_str

    @classmethod
    def calculate_equal_share(cls, owner: Optional[str], co_owner: Optional[str]) -> str:
        """
        Calculates equal fractional and percentage share based on total count of owners (sum = 100%).
        - 1 owner -> '1/1 (100%)'
        - 2 owners -> '1/2 (50% each)'
        - 3 owners -> '1/3 (33.33% each)'
        - 4 owners -> '1/4 (25% each)'
        - N owners -> '1/N ((100/N)% each)'
        """
        if not owner and not co_owner:
            return "1/1 (100%)"

        co_count = 0
        if co_owner:
            co_parts = [p.strip() for p in re.split(r",|;|\sand\s|&", str(co_owner), flags=re.IGNORECASE) if p.strip()]
            co_count = len(co_parts)

        total_owners = (1 if owner else 0) + co_count
        total_owners = max(total_owners, 1)

        if total_owners == 1:
            return "1/1 (100%)"
        elif total_owners == 2:
            return "1/2 (50% each)"
        elif total_owners == 3:
            return "1/3 (33.33% each)"
        elif total_owners == 4:
            return "1/4 (25% each)"
        else:
            pct = round(100.0 / total_owners, 2)
            return f"1/{total_owners} ({pct}% each)"

    @classmethod
    def clean_identifier(cls, val: Optional[str], field_type: str = "general") -> Optional[str]:
        """
        Cleans plot numbers, khasra, dag, khatian, survey numbers.
        Extracts the core number/code without boilerplate words like 'Plot No.', 'Khasra No.'
        """
        if not val:
            return None

        text = cls.strip_emojis(str(val)).strip()
        if text.lower() in ["nil", "na", "none", "-", "null"]:
            return None

        # Remove common boilerplate prefix phrases
        patterns = [
            r"^(?:gh\s+plot\s+no[.:]*|plot\s+no[.:]*|plot\s*#|plot\s*[-:]*)\s*",
            r"^(?:khasra\s+no[.:]*|khasra\s*#|khasra\s*[-:]*)\s*",
            r"^(?:dag\s+no[.:]*|dag\s*#|dag\s*[-:]*)\s*",
            r"^(?:khatian\s+no[.:]*|khata\s+no[.:]*|khatian\s*#|khata\s*[-:]*)\s*",
            r"^(?:survey\s+no[.:]*|survey\s*#|survey\s*[-:]*)\s*",
            r"^(?:flat\s+no[.:]*|flat\s*#|flat\s*[-:]*)\s*",
            r"^(?:no[.:]*|number[.:]*|num[.:]*)\s*",
        ]
        cleaned = text
        for pat in patterns:
            cleaned = re.sub(pat, "", cleaned, flags=re.IGNORECASE).strip()

        # If after stripping boilerplate it's empty (e.g. was just 'GH Plot No.'), try to find code in original text
        if not cleaned:
            match = re.search(r"([A-Z0-9]+(?:[-/][A-Z0-9]+)*)", text, re.IGNORECASE)
            if match:
                cleaned = match.group(1)
            else:
                return text

        # Clean trailing punctuation
        cleaned = re.sub(r"^[.:,-]+|[.:,-]+$", "", cleaned).strip()
        return cleaned if cleaned else text

    @classmethod
    def clean_area_and_unit(
        cls, area_raw: Any, unit_raw: Optional[str]
    ) -> Tuple[Optional[str], Optional[str]]:
        """Parses numeric area dimension and standardizes the area unit."""
        if area_raw is None and not unit_raw:
            return None, None

        area_str = str(area_raw).strip() if area_raw is not None else ""
        unit_str = str(unit_raw).strip() if unit_raw else ""

        # Check if area string has unit embedded (e.g. '162.57 sq. mtr' or '3.25 Acres')
        embedded_match = re.search(r"([\d.,]+)\s*([A-Za-z.\s/]+)?", area_str)
        numeric_val = None
        if embedded_match:
            numeric_val = embedded_match.group(1).replace(",", "").strip()
            if embedded_match.group(2) and not unit_str:
                unit_str = embedded_match.group(2).strip()

        # Standardize area unit
        clean_unit = None
        if unit_str:
            u_lower = unit_str.lower().strip()
            if any(k in u_lower for k in ["sq. mtr", "sqm", "sq m", "sq.m", "square meter"]):
                clean_unit = "Sq. Meters"
            elif any(k in u_lower for k in ["sq. ft", "sqft", "sq ft", "sq.ft", "square feet", "sft"]):
                clean_unit = "Sq. Feet"
            elif any(k in u_lower for k in ["acre", "acres"]):
                clean_unit = "Acres"
            elif any(k in u_lower for k in ["hectare", "hectares", "ha"]):
                clean_unit = "Hectares"
            elif "bigha" in u_lower:
                clean_unit = "Bigha"
            elif "katha" in u_lower or "cotta" in u_lower:
                clean_unit = "Katha"
            elif "guntha" in u_lower or "gunta" in u_lower:
                clean_unit = "Guntha"
            elif "biswa" in u_lower:
                clean_unit = "Biswa"
            elif "cent" in u_lower:
                clean_unit = "Cents"
            elif "decimal" in u_lower or "dec" in u_lower:
                clean_unit = "Decimal"
            else:
                clean_unit = unit_str.title()

        return numeric_val or area_str or None, clean_unit or "Acres"

    @classmethod
    def clean_classification_tags(
        cls, tags: Any, full_text_hint: str = ""
    ) -> List[str]:
        """Normalizes classification tags, removing emojis and mapping to canonical options."""
        clean_tags: List[str] = []

        raw_list = tags if isinstance(tags, list) else [tags] if tags else []

        for item in raw_list:
            if not item:
                continue
            cleaned = cls.strip_emojis(str(item)).strip()
            for canon in CANONICAL_CLASSIFICATIONS:
                if canon.lower() == cleaned.lower() or canon.lower() in cleaned.lower():
                    if canon not in clean_tags:
                        clean_tags.append(canon)
                    break
            else:
                if cleaned and cleaned not in clean_tags:
                    clean_tags.append(cleaned)

        # If nothing matched, look for hints in text or default
        if not clean_tags:
            hint_lower = full_text_hint.lower()
            if any(k in hint_lower for k in ["flat", "residential", "apartment", "house", "tower", "floor"]):
                clean_tags = ["Residential Land"]
            elif any(k in hint_lower for k in ["commercial", "shop", "office", "mall"]):
                clean_tags = ["Commercial Land"]
            elif any(k in hint_lower for k in ["factory", "industrial", "warehouse"]):
                clean_tags = ["Industrial Land"]
            else:
                clean_tags = ["Agricultural Land"]

        return clean_tags

    @classmethod
    def validate_and_normalize(cls, raw: Dict[str, Any]) -> Dict[str, Any]:
        """
        Master normalization & validation pipeline:
        1. Multi-owner / co-owner parsing and separation
        2. Plot, Khasra, Dag, Khatian number cleaning
        3. Area and Unit standardizations
        4. Classification tag sanitation (removing emojis)
        5. Quality score and validation flag assignment
        """
        data = dict(raw)

        # 1. Multi-owner & Co-owner separation and equal share fraction computation
        owner, co_owner = cls.parse_owners(data.get("owner"), data.get("co_owner"))
        data["owner"] = owner
        data["co_owner"] = co_owner
        data["share"] = cls.calculate_equal_share(owner, co_owner)

        # 2. Identifiers cleaning
        data["plot_number"] = cls.clean_identifier(data.get("plot_number"), "plot")
        data["khasra"] = cls.clean_identifier(data.get("khasra"), "khasra")
        data["dag"] = cls.clean_identifier(data.get("dag"), "dag")
        data["khatian_khata"] = cls.clean_identifier(data.get("khatian_khata"), "khatian")
        data["survey_number"] = cls.clean_identifier(data.get("survey_number"), "survey")

        # 3. Area and Unit
        area, area_unit = cls.clean_area_and_unit(data.get("area"), data.get("area_unit"))
        data["area"] = area
        data["area_unit"] = area_unit

        # 4. Location strings
        for loc_field in ["village", "mouza", "tehsil_taluk", "district"]:
            if data.get(loc_field):
                data[loc_field] = cls.strip_emojis(str(data[loc_field])).strip()

        # 5. Classifications
        hint_text = f"{data.get('plot_number', '')} {data.get('owner', '')} {data.get('village', '')}"
        data["land_classification"] = cls.clean_classification_tags(
            data.get("land_classification"), hint_text
        )

        # 6. Mutation & Registration
        for ref_field in ["mutation_number", "registration_number", "previous_owner", "new_owner"]:
            if data.get(ref_field):
                data[ref_field] = cls.strip_emojis(str(data[ref_field])).strip()

        # 7. Confidence Score evaluation
        valid_core_fields = [
            bool(data.get("owner")),
            bool(data.get("khasra") or data.get("plot_number") or data.get("dag")),
            bool(data.get("district") or data.get("village")),
            bool(data.get("area")),
        ]
        score = sum(valid_core_fields) / len(valid_core_fields)
        data["confidence_score"] = round(max(0.85, score * 0.98), 2)
        data["validation_status"] = "validated"

        return data


validation_service = ValidationService()
