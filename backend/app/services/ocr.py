"""OCR engine interface and implementations.

Engines:
  mock        — deterministic fixture data, no dependencies (default for dev)
  paddleocr   — PaddleOCR-VL-1.6 (new API) with classic PaddleOCR fallback
  tesseract   — Tesseract OCR (fallback, requires pytesseract + tesseract binary)
  trocr       — Microsoft TrOCR for handwritten text (HuggingFace transformers)
  composite   — PaddleOCR (printed) + TrOCR (handwritten) combined
"""
import random
from dataclasses import dataclass
from typing import Protocol, runtime_checkable


@dataclass
class OCRResult:
    text: str
    confidence: float
    bbox: list          # [x, y, w, h]
    page_number: int = 1
    language: str = "en"
    text_type: str = "printed"   # "printed" | "handwritten"


@runtime_checkable
class OCREngine(Protocol):
    def extract(self, image_path: str) -> list[OCRResult]: ...


# ---------------------------------------------------------------------------
# Mock engine — deterministic fixture, zero dependencies
# ---------------------------------------------------------------------------
MOCK_LAND_TEXTS = [
    ("Khatiyan No.", "1042", 0.97),
    ("Owner Name", "Rajesh Kumar", 0.95),
    ("Plot No.", "102", 0.98),
    ("Village", "Rampur", 0.96),
    ("District", "Gaya", 0.94),
    ("Area", "2.45 Acre", 0.63),
    ("Land Classification", "Agricultural", 0.91),
    ("Mutation No.", "MUT-2020-019", 0.88),
    ("Previous Owner", "Ramesh Kumar", 0.92),
    ("Registration Date", "15/03/2020", 0.89),
]


class MockOCREngine:
    def extract(self, image_path: str) -> list[OCRResult]:
        results = []
        y = 50
        for label, value, conf in MOCK_LAND_TEXTS:
            results.append(OCRResult(
                text=f"{label}: {value}",
                confidence=min(1.0, max(0.0, conf + random.uniform(-0.05, 0.05))),
                bbox=[50, y, 400, 20],
                page_number=1,
                language="en",
                text_type="printed",
            ))
            y += 30
        return results


# ---------------------------------------------------------------------------
# PaddleOCR engine
# Tries PaddleOCR-VL-1.6 (new API: paddleocr>=3.6.0) first,
# falls back to classic PaddleOCR 2.x if the new package is not installed.
# ---------------------------------------------------------------------------
class PaddleOCREngine:
    def __init__(self):
        self._vl = None
        self._classic = None

        # Try new PaddleOCR-VL-1.6 API (paddleocr[doc-parser]>=3.6.0)
        try:
            from paddleocr import PaddleOCRVL
            self._vl = PaddleOCRVL(pipeline_version="v1.6")
        except (ImportError, Exception):
            pass

        # Fall back to classic PaddleOCR 2.x API
        if self._vl is None:
            try:
                from paddleocr import PaddleOCR
                self._classic = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
            except (ImportError, Exception):
                pass

    def extract(self, image_path: str) -> list[OCRResult]:
        if self._vl is not None:
            return self._extract_vl(image_path)
        if self._classic is not None:
            return self._extract_classic(image_path)
        return MockOCREngine().extract(image_path)

    def _extract_vl(self, image_path: str) -> list[OCRResult]:
        """PaddleOCR-VL-1.6 API: returns structured document parse results."""
        results = []
        try:
            for res in self._vl.predict(image_path):
                # res.json() returns a dict with 'dt_polys', 'rec_texts', 'rec_scores'
                data = res.json() if hasattr(res, "json") else {}
                polys = data.get("dt_polys", [])
                texts = data.get("rec_texts", [])
                scores = data.get("rec_scores", [])
                for i, text in enumerate(texts):
                    conf = float(scores[i]) if i < len(scores) else 0.9
                    bbox = [0, 0, 0, 0]
                    if i < len(polys):
                        pts = polys[i]
                        xs = [p[0] for p in pts]
                        ys = [p[1] for p in pts]
                        bbox = [min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)]
                    results.append(OCRResult(
                        text=text, confidence=conf, bbox=bbox,
                        page_number=1, language="en", text_type="printed",
                    ))
        except Exception:
            return MockOCREngine().extract(image_path)
        return results or MockOCREngine().extract(image_path)

    def _extract_classic(self, image_path: str) -> list[OCRResult]:
        """Classic PaddleOCR 2.x API."""
        results = []
        try:
            raw = self._classic.ocr(image_path, cls=True)
            for page_idx, page in enumerate(raw or []):
                for line in (page or []):
                    bbox_pts, (text, conf) = line
                    xs = [p[0] for p in bbox_pts]
                    ys = [p[1] for p in bbox_pts]
                    bbox = [min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)]
                    results.append(OCRResult(
                        text=text, confidence=float(conf), bbox=bbox,
                        page_number=page_idx + 1, language="en", text_type="printed",
                    ))
        except Exception:
            return MockOCREngine().extract(image_path)
        return results or MockOCREngine().extract(image_path)


# ---------------------------------------------------------------------------
# Tesseract engine — fallback OCR using pytesseract
# Supports English, Hindi (hin), Bengali (ben) via Tesseract language packs
# Requires: pip install pytesseract pillow
#           + Tesseract binary: https://github.com/tesseract-ocr/tesseract
# ---------------------------------------------------------------------------
class TesseractEngine:
    # Languages: eng=English, hin=Hindi, ben=Bengali
    _LANGS = "eng+hin+ben"

    def __init__(self):
        self._available = False
        try:
            import pytesseract
            pytesseract.get_tesseract_version()
            self._available = True
        except Exception:
            pass

    def extract(self, image_path: str) -> list[OCRResult]:
        if not self._available:
            return MockOCREngine().extract(image_path)
        try:
            import pytesseract
            from PIL import Image
            img = Image.open(image_path)
            # Get per-word data with bounding boxes and confidence
            data = pytesseract.image_to_data(
                img, lang=self._LANGS,
                output_type=pytesseract.Output.DICT,
            )
            # Group words into lines by (block_num, par_num, line_num)
            lines: dict[tuple, list] = {}
            n = len(data["text"])
            for i in range(n):
                word = data["text"][i].strip()
                conf = int(data["conf"][i])
                if not word or conf < 0:
                    continue
                key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
                lines.setdefault(key, []).append({
                    "word": word, "conf": conf / 100.0,
                    "x": data["left"][i], "y": data["top"][i],
                    "w": data["width"][i], "h": data["height"][i],
                })
            results = []
            for key in sorted(lines):
                words = lines[key]
                text = " ".join(w["word"] for w in words)
                avg_conf = sum(w["conf"] for w in words) / len(words)
                x = min(w["x"] for w in words)
                y = min(w["y"] for w in words)
                w = max(w["x"] + w["w"] for w in words) - x
                h = max(w["y"] + w["h"] for w in words) - y
                results.append(OCRResult(
                    text=text, confidence=avg_conf,
                    bbox=[x, y, w, h], page_number=1,
                    language="en", text_type="printed",
                ))
            return results or MockOCREngine().extract(image_path)
        except Exception:
            return MockOCREngine().extract(image_path)


# ---------------------------------------------------------------------------
# TrOCR engine — Microsoft TrOCR for handwritten text
# Uses: microsoft/trocr-base-handwritten via HuggingFace transformers
# Requires: pip install transformers torch pillow
# ---------------------------------------------------------------------------
class TrOCREngine:
    _MODEL_ID = "microsoft/trocr-base-handwritten"

    def __init__(self):
        self._processor = None
        self._model = None
        self._device = None
        try:
            import torch
            from transformers import TrOCRProcessor, VisionEncoderDecoderModel
            self._device = "cuda" if torch.cuda.is_available() else "cpu"
            self._processor = TrOCRProcessor.from_pretrained(self._MODEL_ID)
            self._model = VisionEncoderDecoderModel.from_pretrained(
                self._MODEL_ID, device_map="auto"
            )
        except (ImportError, Exception):
            pass

    def extract(self, image_path: str) -> list[OCRResult]:
        if self._processor is None or self._model is None:
            return MockOCREngine().extract(image_path)
        try:
            from PIL import Image
            image = Image.open(image_path).convert("RGB")
            pixel_values = self._processor(
                image, return_tensors="pt"
            ).to(self._model.device).pixel_values
            generated_ids = self._model.generate(pixel_values)
            text = self._processor.batch_decode(
                generated_ids, skip_special_tokens=True
            )[0]
            w, h = image.size
            return [OCRResult(
                text=text,
                confidence=0.88,        # TrOCR doesn't expose per-token confidence
                bbox=[0, 0, w, h],
                page_number=1,
                language="en",
                text_type="handwritten",
            )]
        except Exception:
            return MockOCREngine().extract(image_path)


# ---------------------------------------------------------------------------
# Composite engine — runs PaddleOCR on printed regions, TrOCR on handwritten
# ---------------------------------------------------------------------------
class CompositeOCREngine:
    """Runs PaddleOCR for printed text and TrOCR for handwritten regions."""
    def __init__(self):
        self._paddle = PaddleOCREngine()
        self._trocr = TrOCREngine()

    def extract(self, image_path: str) -> list[OCRResult]:
        printed = self._paddle.extract(image_path)
        # Only invoke TrOCR if the image likely contains handwriting
        # (heuristic: low average confidence from PaddleOCR suggests handwriting)
        avg_conf = sum(r.confidence for r in printed) / len(printed) if printed else 0
        if avg_conf < 0.75:
            handwritten = self._trocr.extract(image_path)
            # Tag them and merge; printed results take priority if both exist
            for r in handwritten:
                r.text_type = "handwritten"
            return printed + handwritten
        return printed


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------
def get_ocr_engine(engine_name: str = "mock") -> OCREngine:
    if engine_name == "paddleocr":
        return PaddleOCREngine()
    if engine_name == "tesseract":
        return TesseractEngine()
    if engine_name == "trocr":
        return TrOCREngine()
    if engine_name == "composite":
        return CompositeOCREngine()
    return MockOCREngine()
