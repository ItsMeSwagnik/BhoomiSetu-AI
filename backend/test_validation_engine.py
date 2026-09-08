import sys
import os
import fitz
import json

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

print("=" * 70)
print("🔍 BHOOMISETU AI - GROUND-TRUTH PDF VS LLM VALIDATION TEST SUITE")
print("=" * 70)

from app.services.validation import validation_service

# 1. Generate realistic Property Deed PDF
doc = fitz.open()
page = doc.new_page()

sample_deed_text = """GOVERNMENT OF UTTAR PRADESH
DEPARTMENT OF REGISTRATION AND REVENUE
REGISTERED SALE & CONVEYANCE DEED / KHATIAN PARCHA

DEED PARTICULARS:
Registration Deed No: IN-UP58892545961013U
Registration Date: 2022-04-05
Sub-Registrar / Tehsil: Sadar-1st, Ghaziabad
District: Ghaziabad

PARCEL & LOCATION IDENTIFIERS:
Village / Locality: Crossing Republik
Mouza: Dundahera
Khatian / Khata No: 582/B
Khasra No: 1409
Dag No: 882
Plot / House Unit: GH-06 (Flat M-2102)
Survey / CS No: CS-4402

LAND AREA & USAGE CLASSIFICATION:
Total Recorded Area: 162.57 Sq. Meters
Land Classification: Residential Land (Group Housing)

TITLE CHAIN & OWNERSHIP PARTICULARS:
Transferor / Previous Owner: Devendra Prasad Singh, Sunita Singh
Transferee / Primary Owner: Rajeev Arora
Transferee / Co-Owner: Kavita Arora
Ownership Share: 1/2 (50% each)

MUTATION RECORD:
Mutation Case No: MUT-UP-2022-99104
Mutation Order Date: 2022-06-18
"""

page.insert_text((50, 60), sample_deed_text, fontsize=10)
pdf_bytes = doc.tobytes()
doc.close()

print("\n[TEST 1] Testing Raw PDF Text Extraction & Token Indexing...")
lines = validation_service.extract_pdf_ground_truth_lines(pdf_bytes)
assert len(lines) > 10, f"Expected >10 lines from PDF, got {len(lines)}"
print(f"  ✓ Successfully parsed {len(lines)} ground-truth lines from PDF")

print("\n[TEST 2] Testing Ground-Truth Cross-Validation with Perfect LLM Extraction...")
extracted_data_clean = {
    "owner": "Rajeev Arora",
    "co_owner": "Kavita Arora",
    "share": "1/2 (50% each)",
    "khatian_khata": "582/B",
    "khasra": "1409",
    "dag": "882",
    "plot_number": "GH-06",
    "survey_number": "CS-4402",
    "area": "162.57",
    "area_unit": "Sq. Meters",
    "village": "Crossing Republik",
    "mouza": "Dundahera",
    "tehsil_taluk": "Sadar-1st, Ghaziabad",
    "district": "Ghaziabad",
    "land_classification": ["Residential Land"],
    "mutation_number": "MUT-UP-2022-99104",
    "mutation_date": "2022-06-18",
    "registration_number": "IN-UP58892545961013U",
    "registration_date": "2022-04-05",
    "previous_owner": "Devendra Prasad Singh, Sunita Singh",
    "new_owner": "Rajeev Arora, Kavita Arora",
    "confidence_score": 0.98,
}

scorecard = validation_service.validate_against_pdf(extracted_data_clean, pdf_bytes, "Test_Deed.pdf")
print(f"  ✓ Overall Fidelity Score: {scorecard['overallFidelityScore']}%")
print(f"  ✓ Fidelity Grade: {scorecard['fidelityGrade']}")
print(f"  ✓ Verified Fields: {scorecard['verifiedFieldsCount']}/{scorecard['totalFieldsChecked']}")
print(f"  ✓ Text Layer Available: {scorecard['isPdfTextLayerAvailable']}")
print(f"  ✓ Discrepancies Count: {len(scorecard['discrepancies'])}")

assert scorecard["overallFidelityScore"] >= 90.0, "Expected >=90% fidelity score for matching deed"
assert scorecard["fidelityGrade"] in ["A+", "A"], "Expected grade A or A+"
assert len(scorecard["discrepancies"]) == 0, "Expected 0 discrepancies for clean extraction"

print("\n  Field-by-Field Verification Samples:")
for fv in scorecard["fieldVerifications"][:6]:
    print(f"    • {fv['label']:28}: [{fv['matchStatus']}] Score: {int(fv['matchScore']*100)}% -> \"{fv['pdfContextSnippet']}\"")

print("\n[TEST 3] Testing Anomaly & Discrepancy Detection (Contradictory Extraction)...")
extracted_with_errors = dict(extracted_data_clean)
extracted_with_errors["registration_date"] = "2024-01-01"  # Error: registration after mutation (2022-06-18)
extracted_with_errors["previous_owner"] = "Rajeev Arora"    # Error: seller and buyer identical
extracted_with_errors["area"] = "-50.0"                    # Error: negative area

error_scorecard = validation_service.validate_against_pdf(extracted_with_errors, pdf_bytes, "Test_Deed.pdf")
print(f"  ✓ Flagged Discrepancies Detected ({len(error_scorecard['discrepancies'])}):")
for d in error_scorecard["discrepancies"]:
    print(f"    ! {d}")

assert len(error_scorecard["discrepancies"]) >= 2, "Expected anomaly warnings to be flagged"

print("\n" + "=" * 70)
print("🎯 ALL TESTS PASSED: VALIDATION ENGINE IS FULLY OPERATIONAL!")
print("=" * 70)
