import os
import uuid
from datetime import datetime, timezone
from app.database import SessionLocal
from app.models import Document, LandRecord, CadastralMap, MapPlot

def seed_demo_dalils():
    db = SessionLocal()
    try:
        # Find the active Krishnapur cadastral map
        m = db.query(CadastralMap).first()
        if not m:
            print("[Seed] No CadastralMap found in DB to link to.")
            return

        print(f"[Seed] Targeting Mouza Map: {m.mouza_name} (JL {m.mouza_no}), Map ID: {m.id}")

        demo_deeds = [
            {
                "target_plot_number": "101",
                "filename": "Deed_Plot101_Animesh_Halder.pdf",
                "owner": "Animesh Halder",
                "co_owner": "Shipra Halder",
                "share": "16 Anna (100%)",
                "khatian_khata": "LR-1102",
                "khasra": "101",
                "plot_number": "101",
                "survey_number": "SN-42/101",
                "area": "14.2",
                "area_unit": "Decimal",
                "village": "Krishnapur",
                "mouza": "Krishnapur",
                "tehsil_taluk": "Nabadwip",
                "district": "Nadia",
                "land_classification": ["Bastu (Residential)"],
                "mutation_number": "MUT/2024/3310",
                "mutation_date": "10-Jan-2024",
                "registration_number": "I-040200871/2023",
                "registration_date": "14-Aug-2023",
                "previous_owner": "Gopal Chandra Das",
                "new_owner": "Animesh Halder",
                "status": "verified",
                "is_validated": True,
                "confidence_score": 0.98,
            },
            {
                "target_plot_number": "102",
                "filename": "Deed_Plot102_Subhas_Ghosh.pdf",
                "owner": "Subhas Chandra Ghosh",
                "co_owner": "Anima Ghosh",
                "share": "16 Anna (100%)",
                "khatian_khata": "LR-1402",
                "khasra": "102",
                "plot_number": "102",
                "survey_number": "SN-42/102",
                "area": "18.5",
                "area_unit": "Decimal",
                "village": "Krishnapur",
                "mouza": "Krishnapur",
                "tehsil_taluk": "Nabadwip",
                "district": "Nadia",
                "land_classification": ["Bastu (Residential)", "Garden Land"],
                "mutation_number": "MUT/2024/7821",
                "mutation_date": "14-Nov-2024",
                "registration_number": "I-040201889/2023",
                "registration_date": "12-Oct-2023",
                "previous_owner": "Biren Mondal",
                "new_owner": "Subhas Chandra Ghosh",
                "status": "verified",
                "is_validated": True,
                "confidence_score": 0.98,
            },
            {
                "target_plot_number": "103",
                "filename": "Deed_Plot103_Ratna_Bhattacharya.pdf",
                "owner": "Ratna Bhattacharya",
                "co_owner": "Sourav Bhattacharya",
                "share": "16 Anna (100%)",
                "khatian_khata": "LR-789",
                "khasra": "103",
                "plot_number": "103",
                "survey_number": "SN-42/103",
                "area": "21.0",
                "area_unit": "Decimal",
                "village": "Krishnapur",
                "mouza": "Krishnapur",
                "tehsil_taluk": "Nabadwip",
                "district": "Nadia",
                "land_classification": ["Sali (Agricultural)"],
                "mutation_number": "MUT/2023/6712",
                "mutation_date": "18-Sep-2023",
                "registration_number": "I-040202119/2022",
                "registration_date": "19-Nov-2022",
                "previous_owner": "Prabhat Sen",
                "new_owner": "Ratna Bhattacharya",
                "status": "verified",
                "is_validated": True,
                "confidence_score": 0.97,
            },
            {
                "target_plot_number": "104",
                "filename": "Deed_Plot104_Kalyan_Mitra.pdf",
                "owner": "Kalyan Kumar Mitra",
                "co_owner": None,
                "share": "16 Anna",
                "khatian_khata": "RS-342",
                "khasra": "104",
                "plot_number": "104",
                "survey_number": "SN-42/104",
                "area": "15.8",
                "area_unit": "Decimal",
                "village": "Krishnapur",
                "mouza": "Krishnapur",
                "tehsil_taluk": "Nabadwip",
                "district": "Nadia",
                "land_classification": ["Sali (Agricultural)"],
                "mutation_number": "MUT/2024/1190",
                "mutation_date": "04-Mar-2024",
                "registration_number": "I-040200452/2024",
                "registration_date": "15-Feb-2024",
                "previous_owner": "Sunil Baran Paul",
                "new_owner": "Kalyan Kumar Mitra",
                "status": "verified",
                "is_validated": True,
                "confidence_score": 0.95,
            },
            {
                "target_plot_number": "105",
                "filename": "Deed_Plot105_Debashis_Roy.pdf",
                "owner": "Debashis Roy Chowdhury",
                "co_owner": "Mousumi Roy Chowdhury",
                "share": "8 Anna (50%)",
                "khatian_khata": "LR-892",
                "khasra": "105",
                "plot_number": "105",
                "survey_number": "SN-42/105",
                "area": "24.0",
                "area_unit": "Decimal",
                "village": "Krishnapur",
                "mouza": "Krishnapur",
                "tehsil_taluk": "Nabadwip",
                "district": "Nadia",
                "land_classification": ["Sali (Agricultural)", "Orchard"],
                "mutation_number": "MUT/2023/4519",
                "mutation_date": "22-Aug-2023",
                "registration_number": "I-040201124/2022",
                "registration_date": "05-May-2022",
                "previous_owner": "Gopal Krishna Das",
                "new_owner": "Debashis Roy Chowdhury",
                "status": "verified",
                "is_validated": True,
                "confidence_score": 0.96,
            },
            {
                "target_plot_number": "106",
                "filename": "Deed_Plot106_Animesh_Halder.pdf",
                "owner": "Animesh Halder",
                "co_owner": "Shipra Halder",
                "share": "16 Anna (100%)",
                "khatian_khata": "LR-1102",
                "khasra": "106",
                "plot_number": "106",
                "survey_number": "SN-42/106",
                "area": "12.75",
                "area_unit": "Decimal",
                "village": "Krishnapur",
                "mouza": "Krishnapur",
                "tehsil_taluk": "Nabadwip",
                "district": "Nadia",
                "land_classification": ["Sali (Agricultural)"],
                "mutation_number": "MUT/2024/9912",
                "mutation_date": "02-Feb-2024",
                "registration_number": "I-040203381/2023",
                "registration_date": "19-Dec-2023",
                "previous_owner": "Sunil Baran Paul",
                "new_owner": "Animesh Halder",
                "status": "verified",
                "is_validated": True,
                "confidence_score": 0.97,
            },
            {
                "target_plot_number": "107",
                "filename": "Deed_Plot107_Aloke_Banerjee.pdf",
                "owner": "Aloke Nath Banerjee",
                "co_owner": "Soma Banerjee",
                "share": "16 Anna",
                "khatian_khata": "LR-2105",
                "khasra": "107",
                "plot_number": "107",
                "survey_number": "SN-42/107",
                "area": "16.2",
                "area_unit": "Decimal",
                "village": "Krishnapur",
                "mouza": "Krishnapur",
                "tehsil_taluk": "Nabadwip",
                "district": "Nadia",
                "land_classification": ["Sali (Agricultural)"],
                "mutation_number": "MUT/2024/1102",
                "mutation_date": "10-Jan-2024",
                "registration_number": "I-040200871/2023",
                "registration_date": "14-Aug-2023",
                "previous_owner": "Tarak Nath Sen",
                "new_owner": "Aloke Nath Banerjee",
                "status": "verified",
                "is_validated": True,
                "confidence_score": 0.95,
            },
            {
                "target_plot_number": "108",
                "filename": "Deed_Plot108_Nirmalendu_Sarkar.pdf",
                "owner": "Nirmalendu Sarkar",
                "co_owner": None,
                "share": "16 Anna",
                "khatian_khata": "LR-554",
                "khasra": "108",
                "plot_number": "108",
                "survey_number": "SN-42/108",
                "area": "10.5",
                "area_unit": "Decimal",
                "village": "Krishnapur",
                "mouza": "Krishnapur",
                "tehsil_taluk": "Nabadwip",
                "district": "Nadia",
                "land_classification": ["Bastu (Residential)"],
                "mutation_number": "MUT/2023/8821",
                "mutation_date": "05-Jul-2023",
                "registration_number": "I-040201990/2022",
                "registration_date": "28-Nov-2022",
                "previous_owner": "Rameshwar Sarkar",
                "new_owner": "Nirmalendu Sarkar",
                "status": "verified",
                "is_validated": True,
                "confidence_score": 0.96,
            },
            {
                "target_plot_number": "110",
                "filename": "Deed_Plot110_Sujata_Ganguly.pdf",
                "owner": "Sujata Ganguly",
                "co_owner": "Abhijit Ganguly",
                "share": "16 Anna (100%)",
                "khatian_khata": "LR-1845",
                "khasra": "110",
                "plot_number": "110",
                "survey_number": "SN-42/110",
                "area": "28.4",
                "area_unit": "Decimal",
                "village": "Krishnapur",
                "mouza": "Krishnapur",
                "tehsil_taluk": "Nabadwip",
                "district": "Nadia",
                "land_classification": ["Bastu (Residential)", "Commercial Pond"],
                "mutation_number": "MUT/2024/4401",
                "mutation_date": "19-Apr-2024",
                "registration_number": "I-040201205/2023",
                "registration_date": "20-Sep-2023",
                "previous_owner": "Dhiren Ganguly",
                "new_owner": "Sujata Ganguly",
                "status": "verified",
                "is_validated": True,
                "confidence_score": 0.98,
            },
        ]

        linked_count = 0

        for item in demo_deeds:
            plot_num = item["target_plot_number"]
            
            # 1. Create or find Document
            doc_id = str(uuid.uuid4())
            doc = Document(
                id=doc_id,
                filename=f"{doc_id}.pdf",
                original_filename=item["filename"],
                file_path=f"storage/documents/{doc_id}.pdf",
                file_url=f"/api/documents/{doc_id}/file",
                file_size=145200,
                mime_type="application/pdf",
                status="verified",
            )
            db.add(doc)
            db.flush()

            # 2. Create LandRecord
            record_id = str(uuid.uuid4())
            record = LandRecord(
                id=record_id,
                document_id=doc.id,
                owner=item["owner"],
                co_owner=item["co_owner"],
                share=item["share"],
                khatian_khata=item["khatian_khata"],
                khasra=item["khasra"],
                dag=item["khasra"],
                plot_number=item["plot_number"],
                survey_number=item["survey_number"],
                area=item["area"],
                area_unit=item["area_unit"],
                village=item["village"],
                mouza=item["mouza"],
                tehsil_taluk=item["tehsil_taluk"],
                district=item["district"],
                land_classification=item["land_classification"],
                mutation_number=item["mutation_number"],
                mutation_date=item["mutation_date"],
                registration_number=item["registration_number"],
                registration_date=item["registration_date"],
                previous_owner=item["previous_owner"],
                new_owner=item["new_owner"],
                raw_ocr_response={
                    "extracted_fields": {
                        "owner": item["owner"],
                        "dag": item["khasra"],
                        "khatian": item["khatian_khata"],
                        "area": f"{item['area']} {item['area_unit']}",
                        "deed_no": item["registration_number"],
                        "mouza": item["mouza"],
                    }
                },
                confidence_score=item["confidence_score"],
                ocr_model_used="groq/qwen/qwen3.8-27b",
                is_validated=item["is_validated"],
                status=item["status"],
            )
            db.add(record)
            db.flush()

            # 3. Find matching MapPlot and link it
            target_plot = db.query(MapPlot).filter(
                MapPlot.map_id == m.id,
                MapPlot.plot_number == plot_num
            ).first()

            if not target_plot:
                target_plot = db.query(MapPlot).filter(
                    MapPlot.map_id == m.id,
                    MapPlot.plot_number.ilike(f"%{plot_num}%")
                ).first()

            if target_plot:
                target_plot.dalil_id = record.id
                target_plot.status = "assigned"
                target_plot.confidence_score = 0.98
                target_plot.notes = f"Linked to Deed #{record.registration_number} ({record.owner})"
                linked_count += 1
                print(f"[Seed] Successfully linked Plot #{plot_num} (ID: {target_plot.id}) to Deed {record.registration_number} -> {record.owner}")
            else:
                print(f"[Seed] Notice: Plot #{plot_num} not found on map to link directly.")

        db.commit()
        print(f"[Seed] Complete! Seeded {len(demo_deeds)} Dalil records and linked {linked_count} parcels in Mouza {m.mouza_name}.")

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_dalils()
