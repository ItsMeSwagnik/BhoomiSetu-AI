"""Image preprocessing pipeline: deskew, denoise, contrast enhancement, binarization.

Applies to scanned/photographed land record documents before OCR.
Falls back gracefully if OpenCV is not installed.
"""
import os
from pathlib import Path


def preprocess_image(image_path: str) -> str:
    """
    Preprocess an image file for OCR. Returns path to the preprocessed file.
    If the input is a PDF, extracts the first page as an image first.
    Falls back to the original path if OpenCV/PyMuPDF are unavailable.
    """
    path = Path(image_path)
    if not path.exists():
        return image_path

    # PDF → image extraction (first page)
    if path.suffix.lower() == ".pdf":
        image_path = _pdf_to_image(image_path)
        if image_path is None:
            return str(path)
        path = Path(image_path)

    try:
        import cv2
        import numpy as np
    except ImportError:
        return str(path)

    img = cv2.imread(str(path))
    if img is None:
        return str(path)

    # 1. Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 2. Denoise
    denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)

    # 3. Deskew
    deskewed = _deskew(denoised)

    # 4. Contrast enhancement (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(deskewed)

    # 5. Adaptive binarization (Otsu)
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    out_path = str(path.parent / f"_pre_{path.name}")
    cv2.imwrite(out_path, binary)
    return out_path


def _deskew(gray_img) -> "np.ndarray":
    """Correct skew using Hough line detection."""
    try:
        import cv2
        import numpy as np
        coords = np.column_stack(np.where(gray_img < 128))
        if len(coords) < 10:
            return gray_img
        angle = cv2.minAreaRect(coords.astype(np.float32))[-1]
        if angle < -45:
            angle = 90 + angle
        if abs(angle) < 0.5:
            return gray_img
        h, w = gray_img.shape
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(gray_img, M, (w, h), flags=cv2.INTER_CUBIC,
                              borderMode=cv2.BORDER_REPLICATE)
    except Exception:
        return gray_img


def _pdf_to_image(pdf_path: str) -> "str | None":
    """Extract first page of PDF as PNG using PyMuPDF."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(pdf_path)
        page = doc[0]
        mat = fitz.Matrix(2.0, 2.0)  # 2x zoom → ~144 DPI
        pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
        out = str(Path(pdf_path).parent / f"_page0_{Path(pdf_path).stem}.png")
        pix.save(out)
        doc.close()
        return out
    except Exception:
        return None
