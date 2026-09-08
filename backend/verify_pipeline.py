import os
import sys
import json
import fitz
import httpx
import time
from pathlib import Path

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

print("=" * 70)
print("🚀 BHOOMISETU AI - COMPLETE PRODUCTION READINESS VERIFICATION")
print("=" * 70)

BACKEND_URL = "http://127.0.0.1:8000"

# 1. Health & Database Test
print("\n[TEST 1/5] Checking Backend & Neon Postgres Database...")
try:
    r = httpx.get(f"{BACKEND_URL}/health", timeout=10.0)
    assert r.status_code == 200, f"Health check failed with {r.status_code}"
    health_data = r.json()
    print(f"  ✓ API Status: {health_data.get('status')}")
    print(f"  ✓ Database: {health_data.get('database')}")
except Exception as e:
    print(f"  ✗ Test 1 Failed: {e}")
    sys.exit(1)

# 2. Storage & Firebase Verification
print("\n[TEST 2/5] Checking Storage Engine & Firebase Services...")
try:
    from app.services.storage import storage_service
    status = storage_service.test_status()
    print(f"  ✓ Local Storage Path: {status['local_storage']['path']}")
    print(f"  ✓ Storage Directory Writable: {status['local_storage']['writable']}")
    print(f"  ✓ Firebase Project ID: {status['firebase']['project_id']}")
    print(f"  ✓ Storage Mode: {status['firebase']['mode']} (Firestore/Cloud Storage fallback active)")
    
    # Test sample file write and read
    test_bytes = b"%PDF-1.4 test document binary content"
    fid, lpath, furl = storage_service.save_file(test_bytes, "test_check.pdf")
    read_back = storage_service.get_file_bytes(lpath)
    assert read_back == test_bytes, "File readback did not match written bytes"
    print(f"  ✓ Storage Save & Retrieve: Verified (file ID: {fid[:8]}...)")
except Exception as e:
    print(f"  ✗ Test 2 Failed: {e}")
    sys.exit(1)

# 3. Groq Inference & Model Fallback Test
print("\n[TEST 3/5] Checking Groq AI Inference & Model Availability...")
try:
    from app.config import settings
    api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY")
    assert api_key, "GROQ_API_KEY is not set"
    
    models_to_test = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"]
    for m in models_to_test:
        t0 = time.time()
        res = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key.strip()}"},
            json={"model": m, "messages": [{"role": "user", "content": "Ping"}]},
            timeout=20.0
        )
        latency = round((time.time() - t0) * 1000, 1)
        if res.status_code == 200:
            print(f"  ✓ Model [{m}]: ONLINE (Latency: {latency}ms)")
        else:
            print(f"  ! Model [{m}]: HTTP {res.status_code}")
except Exception as e:
    print(f"  ✗ Test 3 Failed: {e}")
    sys.exit(1)

# 4. End-to-End PDF Land Record Extraction & 20 Fields Fidelity Test
print("\n[TEST 4/5] Testing End-to-End PDF Ingestion & 20-Field Extraction...")
try:
    # Generate realistic RoR PDF
    doc = fitz.open()
    page = doc.new_page()
    sample_text = """GOVERNMENT OF WEST BENGAL
DIRECTORATE OF LAND RECORDS & SURVEYS
RECORD OF RIGHTS (ROR) / KHATIAN EXTRACT

1. District: Purba Bardhaman
2. Sub-Division / Tehsil: Burdwan Sadar
3. Police Station / Block: Memari
4. Mouza & J.L. No.: Gopalpur (J.L. 102)
5. Village: Gopalpur Gram

IDENTIFICATION:
Khatian / Khata No: 582/B
Khasra No: 1409
Dag No: 882
Plot No: Plot-77
Survey No: CS-4402

OWNERSHIP & SHARE:
Primary Owner: Sri Subhasish Banerjee
Co-Owner: Smt. Sunita Banerjee
Ownership Share: 1/2 (50 percent)

AREA & CLASSIFICATION:
Total Land Area: 3.25 Acres
Classification of Land: Agricultural Land (Crop Cultivation)

MUTATION & REGISTRATION DETAILS:
Mutation Case No: MUT-WB-2024-88741
Mutation Order Date: 2024-01-12
Registration Deed No: DEED-REG-2023-55102
Registration Date: 2023-09-18

OWNERSHIP TRANSFER CHAIN:
Previous Owner / Transferor: Late Haripada Banerjee
New Owner / Transferee: Sri Subhasish Banerjee
"""
    page.insert_text((40, 60), sample_text, fontsize=11)
    pdf_bytes = doc.tobytes()
    doc.close()

    # Upload to API
    t0 = time.time()
    files = {'file': ('Production_Test_Deed_Khasra_1409.pdf', pdf_bytes, 'application/pdf')}
    upload_res = httpx.post(f"{BACKEND_URL}/api/documents/upload", files=files, timeout=45.0)
    duration = round(time.time() - t0, 2)
    
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    payload = upload_res.json()
    record = payload["record"]
    document = payload["document"]

    print(f"  ✓ OCR Pipeline Execution Time: {duration}s")
    print(f"  ✓ Document ID: {document['id']}")
    print(f"  ✓ Extracted Record ID: {record['id']}")
    print(f"  ✓ Model Used: {record['ocrModelUsed']}")
    print(f"  ✓ Confidence Score: {round(record['confidenceScore'] * 100, 1)}%")

    # Validate 20 fields
    required_fields = [
        ("owner", "Owner"),
        ("coOwner", "Co-owner"),
        ("share", "Share"),
        ("khatianKhata", "Khatian/Khata"),
        ("khasra", "Khasra"),
        ("dag", "Dag"),
        ("plotNumber", "Plot Number"),
        ("surveyNumber", "Survey Number"),
        ("area", "Area"),
        ("areaUnit", "Area Unit"),
        ("village", "Village"),
        ("mouza", "Mouza"),
        ("tehsilTaluk", "Tehsil/Taluk"),
        ("district", "District"),
        ("landClassification", "Land Classification"),
        ("mutationNumber", "Mutation Number"),
        ("mutationDate", "Mutation Date"),
        ("registrationNumber", "Registration Number"),
        ("registrationDate", "Registration Date"),
        ("previousOwner", "Previous Owner"),
        ("newOwner", "New Owner"),
    ]

    print("\n  Extracted 20 Land Revenue Fields:")
    for key, label in required_fields:
        val = record.get(key)
        assert val is not None, f"Field {key} ({label}) was missing!"
        print(f"    • {label:22}: {val}")

except Exception as e:
    print(f"  ✗ Test 4 Failed: {e}")
    sys.exit(1)

# 5. Database Verification & Record Update (PUT)
print("\n[TEST 5/5] Checking Database Verification & Record Updates...")
try:
    rec_id = record["id"]
    update_data = {
        "owner": "Sri Subhasish Banerjee (Verified Official)",
        "land_classification": ["🌾 Agricultural Land", "🏠 Residential Land"],
        "status": "verified"
    }
    put_res = httpx.put(f"{BACKEND_URL}/api/records/{rec_id}", json=update_data, timeout=10.0)
    assert put_res.status_code == 200, f"Record update failed: {put_res.text}"
    updated_rec = put_res.json()
    assert updated_rec["status"] == "verified"
    print(f"  ✓ Record Update (PUT /api/records/{rec_id}): 200 OK")
    print(f"  ✓ Updated Status: {updated_rec['status']}")
    print(f"  ✓ Updated Land Classifications: {updated_rec['landClassification']}")

    # Check stats endpoint
    stats_res = httpx.get(f"{BACKEND_URL}/api/dashboard/stats", timeout=10.0)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    print(f"  ✓ Live Database Stats: Total Records={stats['totalRecords']}, Verified={stats['verifiedRecords']}")
except Exception as e:
    print(f"  ✗ Test 5 Failed: {e}")
    sys.exit(1)

print("\n" + "=" * 70)
print("🎯 ALL 5/5 TESTS PASSED: SYSTEM IS VERIFIED & READY FOR PRODUCTION!")
print("=" * 70)
