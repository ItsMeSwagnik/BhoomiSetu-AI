import sys
import os
import fitz
from fastapi.testclient import TestClient

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

print("=" * 70)
print("🧪 BHOOMISETU AI - API ENDPOINT & PORTAL UPLOAD TEST")
print("=" * 70)

from app.main import app

client = TestClient(app)

# 1. Test Root & Health
print("\n[STEP 1] Testing Root & Health Endpoints...")
r_root = client.get("/")
assert r_root.status_code == 200
print(f"  ✓ Root API: {r_root.json()}")

# 2. Generate a House / Land Record PDF
print("\n[STEP 2] Generating House / Land Record PDF...")
doc = fitz.open()
page = doc.new_page()

deed_content = """GOVERNMENT OF MAHARASHTRA
DEPARTMENT OF LAND RECORDS AND REVENUE
HOUSE / APARTMENT OWNERSHIP & CONVEYANCE DEED

PROPERTY DETAILS:
Deed Registration No: REG-MH-2023-77401
Registration Date: 2023-11-15
Tehsil / Taluk: Haveli
District: Pune
Village / Locality: Baner
Mouza: Baner Gaon

PARCEL IDENTIFIERS:
Survey No: CS-209
Plot / Flat No: Flat-402, Tower-B
Khasra No: 881
Khatian / Khata No: KH-104

DIMENSIONS & CLASSIFICATION:
Total Built-up Area: 1450.00 Sq. Feet
Land / Property Classification: Residential Land

OWNERSHIP & SHARE:
Transferee / Primary Owner: Ananya Sharma
Transferee / Co-Owner: Rohit Sharma
Ownership Share: 1/2 (50% each)
Transferor / Previous Owner: Shrikant Kulkarni

MUTATION DETAILS:
Mutation Order No: MUT-PUN-2024-0012
Mutation Date: 2024-02-10
"""
page.insert_text((40, 50), deed_content, fontsize=10)
pdf_bytes = doc.tobytes()
doc.close()
print(f"  ✓ Generated synthetic deed PDF ({len(pdf_bytes)} bytes)")

# 3. Test Ingestion & Upload via /api/documents/upload
print("\n[STEP 3] Uploading Deed to /api/documents/upload...")
files = {
    "file": ("House_Deed_Baner_Flat_402.pdf", pdf_bytes, "application/pdf")
}
r_upload = client.post("/api/documents/upload", files=files)
print(f"  ✓ Upload Response Status: {r_upload.status_code}")
assert r_upload.status_code == 200, f"Upload failed: {r_upload.text}"

data = r_upload.json()
assert data.get("success") is True
record = data.get("record", {})
doc_info = data.get("document", {})

print(f"  ✓ Document ID: {doc_info.get('id')}")
print(f"  ✓ Extracted Record ID: {record.get('id')}")
print(f"  ✓ Primary Owner: {record.get('owner')}")
print(f"  ✓ Co-Owner: {record.get('coOwner')}")
print(f"  ✓ Share: {record.get('share')}")
print(f"  ✓ Plot / Flat Number: {record.get('plotNumber')}")
print(f"  ✓ Area & Unit: {record.get('area')} {record.get('areaUnit')}")
print(f"  ✓ Classification: {record.get('landClassification')}")
print(f"  ✓ Confidence Score: {record.get('confidenceScore')}")

scorecard = record.get("validationScorecard")
assert scorecard is not None, "Validation scorecard was missing from upload response!"
print(f"\n[STEP 4] Validating Ground-Truth Scorecard in API Response...")
print(f"  ✓ Fidelity Grade: {scorecard.get('fidelityGrade')}")
print(f"  ✓ Overall Fidelity Score: {scorecard.get('overallFidelityScore')}%")
print(f"  ✓ Verified Fields: {scorecard.get('verifiedFieldsCount')} / {scorecard.get('totalFieldsChecked')}")
print(f"  ✓ Discrepancies: {len(scorecard.get('discrepancies', []))}")

# 4. Test Fetching Records via /api/records
print("\n[STEP 5] Querying /api/records Endpoint...")
r_records = client.get("/api/records")
assert r_records.status_code == 200
records_list = r_records.json()
print(f"  ✓ Total Land Records Retrieved: {len(records_list)}")
latest = records_list[0]
assert latest.get("validationScorecard") is not None, "validationScorecard missing in /api/records list item"
print(f"  ✓ Latest Record [{latest.get('owner')} - {latest.get('village')}]: Scorecard Grade {latest.get('validationScorecard', {}).get('fidelityGrade')}")

print("\n" + "=" * 70)
print("🎉 END-TO-END UPLOAD & PORTAL VALIDATION TEST COMPLETED SUCCESSFULLY!")
print("=" * 70)
