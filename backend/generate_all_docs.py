#!/usr/bin/env python3
"""
Supreme Compliance — Complete Housekeeping Document Library Generator
Generates ALL SOPs, SWMS, and Compliance Checklists for deployment.
"""

import asyncio
import httpx
import json
import time
import sys

BASE_URL = "http://localhost:8001/api"

# ========================================================
# COMPLETE HOUSEKEEPING DOCUMENT LIBRARY
# ========================================================

DOCUMENTS = [
    # =====================================================
    # STANDARD OPERATING PROCEDURES (SOPs)
    # =====================================================
    
    # --- Room Cleaning & Turndown ---
    {
        "category": "room_cleaning",
        "document_type": "sop",
        "title": "Guest Room Cleaning — Checkout & Departure Procedure",
        "specific_requirements": "Cover full departure clean process: stripping beds, bathroom deep clean, vacuuming, dusting, restocking amenities, minibar check, final quality check. Include time standards (30 min target). Cover DND protocol, lost & found check, and damage reporting.",
        "sections_count": 7
    },
    {
        "category": "room_cleaning",
        "document_type": "sop",
        "title": "Guest Room Cleaning — Stayover & Occupied Room Servicing",
        "specific_requirements": "Cover occupied room servicing: knock & announce procedure, bed making (with/without guest present), bathroom refresh, towel replacement, amenity replenishment, trash removal, vacuuming. Include privacy considerations, guest belongings handling, DND procedures.",
        "sections_count": 6
    },
    {
        "category": "room_cleaning",
        "document_type": "sop",
        "title": "Turndown Service Procedure",
        "specific_requirements": "Evening turndown service standards: bed preparation, dimming lights, closing curtains, placing amenities (chocolates, slippers, water), bathroom refresh, removing service items. Include timing (6pm-9pm window), VIP variations.",
        "sections_count": 5
    },
    {
        "category": "room_cleaning",
        "document_type": "sop",
        "title": "Bathroom Cleaning & Sanitisation Standards",
        "specific_requirements": "Detailed bathroom cleaning procedure: toilet, shower/bath, basin, mirror, floor, ventilation. Include sanitisation standards, chemical usage (which chemicals for which surface), limescale removal, grout cleaning. Include infection control standards.",
        "sections_count": 6
    },
    {
        "category": "room_cleaning",
        "document_type": "sop",
        "title": "Bed Making & Linen Standards",
        "specific_requirements": "Professional bed making technique: hospital corners, pillow arrangement, duvet/quilt placement. Cover king, queen, twin, and rollaway setups. Include linen inspection for stains/damage, linen change frequency standards, and allergy-friendly options.",
        "sections_count": 5
    },

    # --- Laundry & Linen ---
    {
        "category": "laundry_linen",
        "document_type": "sop",
        "title": "Laundry Collection, Sorting & Processing Procedure",
        "specific_requirements": "Full laundry cycle: collection from floors, sorting by type/colour/soil level, washing temperatures, drying, folding, quality inspection, distribution. Include contaminated linen handling, guest personal laundry. Cover infection control protocols for laundry.",
        "sections_count": 7
    },
    {
        "category": "laundry_linen",
        "document_type": "sop",
        "title": "Linen Inventory Management & Par Level Standards",
        "specific_requirements": "Par level calculations, stocktake procedures, linen lifecycle tracking, ordering thresholds, storage standards (temperature, humidity), rotation system (FIFO), condemning criteria for worn linen. Include cost management and waste reduction.",
        "sections_count": 6
    },
    {
        "category": "laundry_linen",
        "document_type": "sop",
        "title": "Linen Quality Control & Rejection Standards",
        "specific_requirements": "Quality inspection criteria: stains, tears, discolouration, pilling, elasticity loss. Grading system (A/B/C/Reject). Include rewash procedures, supplier quality feedback process, guest complaint handling for linen issues.",
        "sections_count": 5
    },

    # --- Chemical Safety ---
    {
        "category": "chemical_safety",
        "document_type": "sop",
        "title": "Chemical Handling, Dilution & Safe Storage Procedure",
        "specific_requirements": "Chemical safety protocols: reading SDS/MSDS, proper dilution ratios, PPE requirements per chemical, storage segregation rules (acids vs bases), spill procedures, ventilation requirements. Cover common housekeeping chemicals: all-purpose cleaner, glass cleaner, bathroom cleaner, bleach, disinfectant.",
        "sections_count": 7
    },
    {
        "category": "chemical_safety",
        "document_type": "sop",
        "title": "Safety Data Sheet (SDS) Compliance & Chemical Register Management",
        "specific_requirements": "SDS management: maintaining the chemical register, where to store SDS, how to read SDS sections, training requirements, emergency information accessibility, annual review process. Include regulatory requirements under WHS Act and Safe Work Australia standards.",
        "sections_count": 6
    },

    # --- Deep Cleaning ---
    {
        "category": "deep_cleaning",
        "document_type": "sop",
        "title": "Scheduled Deep Cleaning Procedures & Protocols",
        "specific_requirements": "Room deep cleaning schedule (quarterly/bi-annual): behind furniture, under beds, curtain/blind cleaning, carpet shampooing, upholstery cleaning, air vent cleaning, light fixture cleaning. Include scheduling matrix, resource allocation, and quality sign-off process.",
        "sections_count": 7
    },
    {
        "category": "deep_cleaning",
        "document_type": "sop",
        "title": "Carpet Cleaning, Stain Removal & Floor Care",
        "specific_requirements": "Carpet maintenance: daily vacuuming, spot cleaning, hot water extraction, bonnet cleaning. Stain identification chart (coffee, wine, blood, ink, grease) with specific removal methods. Hard floor care: mopping, buffing, sealing. Include drying times and safety barriers.",
        "sections_count": 6
    },
    {
        "category": "deep_cleaning",
        "document_type": "sop",
        "title": "Mattress Cleaning, Inspection & Rotation Program",
        "specific_requirements": "Mattress care: inspection for bed bugs, stains, sagging. Cleaning methods (steam, UV, chemical). Rotation schedule (flip/rotate quarterly). Mattress protector management. Replacement criteria and lifecycle tracking. Bed bug detection and response protocol.",
        "sections_count": 5
    },

    # --- Public Areas ---
    {
        "category": "public_areas",
        "document_type": "sop",
        "title": "Lobby, Foyer & Corridor Cleaning Procedure",
        "specific_requirements": "High-traffic area cleaning: entrance mats, lobby floor (marble/tile), furniture dusting, glass doors/windows, elevator surrounds, signage. Frequency schedules (hourly touch-up, daily deep clean). Include guest-facing presentation standards and noise management during operational hours.",
        "sections_count": 6
    },
    {
        "category": "public_areas",
        "document_type": "sop",
        "title": "Public Restroom Cleaning & Hygiene Maintenance",
        "specific_requirements": "Public restroom standards: hourly check schedule, cleaning log sheet, restocking consumables (soap, paper, hand sanitiser), fixture cleaning, floor cleaning, mirror/glass, odour management. Include COVID-era touchpoint disinfection and compliance signage.",
        "sections_count": 6
    },
    {
        "category": "public_areas",
        "document_type": "sop",
        "title": "Elevator, Stairwell & Car Park Cleaning",
        "specific_requirements": "Elevator cleaning: door tracks, button panels, mirrors, floor, ceiling. Stairwell: steps, handrails, landings, fire doors. Car park: sweeping, spill cleanup, signage. Include frequency schedules and safety protocols for working near elevators.",
        "sections_count": 5
    },
    {
        "category": "public_areas",
        "document_type": "sop",
        "title": "Conference & Meeting Room Setup and Servicing",
        "specific_requirements": "Conference room turnaround: table setup, chair arrangement, AV equipment check, whiteboard cleaning, rubbish removal, water/refreshment setup, carpet vacuuming. Include various room configurations (boardroom, theatre, U-shape, classroom). Post-event cleaning procedure.",
        "sections_count": 6
    },
    {
        "category": "public_areas",
        "document_type": "sop",
        "title": "Pool, Gym & Recreation Area Cleaning",
        "specific_requirements": "Wet area cleaning: pool surrounds, change rooms, showers, sauna. Gym equipment wipe-down, mirror cleaning, floor mopping. Recreation areas. Include slip-hazard management, chemical safety near pool, and health department compliance requirements.",
        "sections_count": 6
    },

    # --- Equipment & Trolley ---
    {
        "category": "equipment_trolley",
        "document_type": "sop",
        "title": "Housekeeping Trolley Setup, Stocking & Maintenance",
        "specific_requirements": "Trolley layout and stocking standards: linen compartments, chemical caddy, amenity tray, equipment hooks. Daily setup checklist, par levels per trolley, end-of-shift cleanup. Include ergonomic loading guidelines and corridor parking standards.",
        "sections_count": 6
    },
    {
        "category": "equipment_trolley",
        "document_type": "sop",
        "title": "Equipment Operation, Care & Maintenance Schedule",
        "specific_requirements": "Cover all housekeeping equipment: vacuum cleaners, floor polishers/scrubbers, steam cleaners, carpet extractors. Daily care, weekly maintenance, fault reporting, electrical safety (RCD testing, tag & test). Include equipment logbook management.",
        "sections_count": 6
    },

    # --- Quality Inspection ---
    {
        "category": "quality_inspection",
        "document_type": "sop",
        "title": "Supervisor Room Inspection & Quality Audit Procedure",
        "specific_requirements": "Room inspection methodology: 200-point check system, grading criteria, common defects, photography for evidence, corrective action process. Include random vs scheduled inspections, daily inspection targets, and reporting to management. Performance tracking by room attendant.",
        "sections_count": 7
    },
    {
        "category": "quality_inspection",
        "document_type": "sop",
        "title": "Housekeeping Quality Standards & Brand Compliance",
        "specific_requirements": "Define quality benchmarks across all housekeeping areas: room presentation, bathroom standards, public area standards, linen quality, amenity presentation. Include client/hotel brand-specific requirements, mystery guest audit preparation, continuous improvement process.",
        "sections_count": 6
    },

    # --- Guest Requests ---
    {
        "category": "guest_requests",
        "document_type": "sop",
        "title": "Guest Request & Complaint Handling Procedure",
        "specific_requirements": "Handle guest requests professionally: extra pillows/blankets, iron/ironing board, rollaway bed, special amenities. Complaint resolution: listen, apologise, act, follow-up. Escalation matrix. Include response time standards (15-minute rule). Cover VIP guest handling.",
        "sections_count": 6
    },
    {
        "category": "guest_requests",
        "document_type": "sop",
        "title": "Lost & Found Management Procedure",
        "specific_requirements": "Lost & found protocol: room attendant discovery, logging, storage, guest notification, claiming process, unclaimed item disposal timeline (90 days). Include valuable items procedure, police reporting thresholds, and digital logging system.",
        "sections_count": 5
    },
    {
        "category": "guest_requests",
        "document_type": "sop",
        "title": "Do Not Disturb (DND) & Refused Service Protocol",
        "specific_requirements": "DND management: response procedures, welfare check after 24 hours, communication with front desk, documentation. Refused service protocol. Include safety/welfare considerations, escalation to duty manager, and privacy compliance.",
        "sections_count": 5
    },

    # --- Staff Training ---
    {
        "category": "staff_training",
        "document_type": "sop",
        "title": "New Employee Induction & Orientation Program",
        "specific_requirements": "Comprehensive induction for new housekeeping staff: Day 1-5 program, uniform & PPE issue, property tour, department introduction, WHS induction, buddy system, competency assessment schedule. Include probation review milestones and training documentation.",
        "sections_count": 7
    },
    {
        "category": "staff_training",
        "document_type": "sop",
        "title": "On-the-Job Training & Competency Assessment",
        "specific_requirements": "Training methodology: demonstrate, practice, assess. Competency matrix for all housekeeping tasks. Assessment criteria, re-training triggers, training records management. Include cross-training program and career progression pathway.",
        "sections_count": 6
    },

    # --- WHS Compliance ---
    {
        "category": "whs_compliance",
        "document_type": "sop",
        "title": "Workplace Hazard Identification & Risk Reporting",
        "specific_requirements": "WHS hazard identification: common housekeeping hazards, risk assessment methodology (likelihood x consequence), reporting procedures, hazard register maintenance. Include near-miss reporting, corrective action tracking, and monthly safety walks.",
        "sections_count": 6
    },
    {
        "category": "whs_compliance",
        "document_type": "sop",
        "title": "Incident, Injury & Near-Miss Reporting Procedure",
        "specific_requirements": "Incident management: immediate response, first aid, reporting (within 24 hours), investigation process, root cause analysis, corrective actions. Include notifiable incidents (SafeWork), workers compensation process, return to work program.",
        "sections_count": 7
    },
    {
        "category": "whs_compliance",
        "document_type": "sop",
        "title": "Fire Safety & Emergency Evacuation Procedure",
        "specific_requirements": "Fire safety for housekeeping: fire prevention, fire extinguisher types & usage, evacuation routes, assembly points, warden duties. Include housekeeping-specific risks (irons, chemicals), floor-by-floor sweep responsibilities, guest assistance procedures.",
        "sections_count": 6
    },
    {
        "category": "whs_compliance",
        "document_type": "sop",
        "title": "Personal Protective Equipment (PPE) Usage & Requirements",
        "specific_requirements": "PPE for housekeeping: gloves (types for different tasks), eye protection, masks/respirators, non-slip footwear, aprons. When to use, how to don/doff, inspection, replacement. Include task-specific PPE matrix and supplier information.",
        "sections_count": 5
    },
    {
        "category": "whs_compliance",
        "document_type": "sop",
        "title": "Infection Control & Pandemic Response Protocols",
        "specific_requirements": "Infection control: hand hygiene, surface disinfection, isolation room cleaning procedure, PPE for infectious situations. Pandemic protocols: enhanced cleaning, social distancing, guest quarantine room servicing, staff health monitoring. Include COVID-19 lessons learned.",
        "sections_count": 7
    },

    # =====================================================
    # SAFE WORK METHOD STATEMENTS (SWMS)
    # =====================================================
    {
        "category": "swms",
        "document_type": "swms",
        "title": "SWMS — Chemical Handling, Mixing & Storage in Housekeeping",
        "specific_requirements": "Cover chemical hazards specific to housekeeping: mixing cleaning solutions, decanting, using spray bottles, cleaning chemical spills. Risk assessment with likelihood x consequence matrix. Control measures following hierarchy of controls. PPE requirements. Emergency procedures for chemical exposure (eyes, skin, inhalation, ingestion).",
        "sections_count": 9
    },
    {
        "category": "swms",
        "document_type": "swms",
        "title": "SWMS — Working at Heights: High Dusting, Curtain & Light Fixture Cleaning",
        "specific_requirements": "Covers using step ladders, step stools for high dusting, curtain removal/hanging, cleaning light fixtures, ceiling vents, high windows. Risk assessment including falls, dropped objects. Control measures: 3-point contact, ladder inspection, spotter requirements. Include restricted height limits for housekeeping staff.",
        "sections_count": 9
    },
    {
        "category": "swms",
        "document_type": "swms",
        "title": "SWMS — Slip, Trip & Fall Prevention in Housekeeping Operations",
        "specific_requirements": "Covers wet floor hazards during mopping, bathroom cleaning, spills. Trip hazards from power cords, trolleys, rugs. Fall hazards on stairs. Risk matrix with specific housekeeping scenarios. Control measures: wet floor signs, proper footwear, cable management, lighting checks. Include statistics on slips/trips in hospitality.",
        "sections_count": 9
    },
    {
        "category": "swms",
        "document_type": "swms",
        "title": "SWMS — Blood & Bodily Fluid Cleanup (Biohazard Response)",
        "specific_requirements": "Biohazard cleanup in hotel rooms/public areas: blood, vomit, faeces, urine, needles. PPE requirements (full: gloves, gown, mask, eye protection). Cleanup methodology, waste disposal (biohazard bags), surface disinfection, incident reporting. Include hepatitis and bloodborne pathogen information.",
        "sections_count": 9
    },
    {
        "category": "swms",
        "document_type": "swms",
        "title": "SWMS — Electrical Equipment Operation (Vacuums, Polishers, Steamers)",
        "specific_requirements": "Electrical safety for housekeeping equipment: pre-use inspection, RCD testing, cord management, wet area restrictions. Cover vacuum cleaners, floor polishers, steam cleaners, carpet extractors, irons. Fault reporting, tag and test requirements. Emergency procedures for electric shock.",
        "sections_count": 9
    },
    {
        "category": "swms",
        "document_type": "swms",
        "title": "SWMS — Hot Water & Steam Cleaning Equipment Operation",
        "specific_requirements": "Burns and scalds risks from steam cleaners, hot water extractors, irons, steamers. Temperature hazards, pressure risks. PPE: heat-resistant gloves, closed footwear. Safe operating procedures, cool-down periods, water fill procedures. Emergency first aid for burns.",
        "sections_count": 9
    },
    {
        "category": "swms",
        "document_type": "swms",
        "title": "SWMS — Sharps & Needle Disposal in Guest Rooms",
        "specific_requirements": "Found needle/syringe protocol: do not touch with bare hands, use tongs/sharps container, PPE (puncture-resistant gloves), disposal in AS 4031 compliant sharps container. Needlestick injury response: wash, report, medical attention, pathology testing. Include legal reporting requirements.",
        "sections_count": 9
    },
    {
        "category": "swms",
        "document_type": "swms",
        "title": "SWMS — Working Alone & Isolated Work Procedures",
        "specific_requirements": "Lone worker safety for room attendants working on floors alone: communication devices, check-in procedures, duress alarms, buddy system. Risk assessment for late shifts, isolated floors, aggressive guests. Emergency procedures, personal safety training. Include fatigue management.",
        "sections_count": 9
    },
    {
        "category": "swms",
        "document_type": "swms",
        "title": "SWMS — Ergonomic Risks: Bed Making, Lifting & Repetitive Tasks",
        "specific_requirements": "Musculoskeletal injury prevention: proper lifting technique, bed making ergonomics, trolley pushing/pulling, repetitive strain from cleaning motions. Risk assessment for each task type. Control measures: job rotation, micro-breaks, stretching programs, mechanical aids. Include pre-existing injury accommodation.",
        "sections_count": 9
    },

    # =====================================================
    # COMPLIANCE CHECKLISTS
    # =====================================================
    {
        "category": "quality_inspection",
        "document_type": "checklist",
        "title": "Daily Guest Room Cleaning Quality Checklist",
        "specific_requirements": "Comprehensive room inspection checklist with checkbox items: entrance/door, bedroom (bed, furniture, floor, windows, curtains), bathroom (toilet, shower, basin, mirror, floor, amenities), general (TV, aircon, minibar, lights, smell, overall presentation). Include pass/fail criteria and scoring system.",
        "sections_count": 6
    },
    {
        "category": "deep_cleaning",
        "document_type": "checklist",
        "title": "Deep Cleaning Compliance Checklist",
        "specific_requirements": "Deep clean verification checklist: behind/under all furniture, inside drawers/wardrobes, curtain tracks, air vents, skirting boards, light fixtures, upholstery, mattress, carpet edges, window frames, balcony. Include sign-off for supervisor verification.",
        "sections_count": 5
    },
    {
        "category": "chemical_safety",
        "document_type": "checklist",
        "title": "Chemical Safety & SDS Compliance Checklist",
        "specific_requirements": "Chemical safety audit checklist: SDS availability, chemical register current, storage compliance (segregation, ventilation, spill containment), labelling correct, dilution charts displayed, PPE available, spill kits accessible, staff training records current, first aid accessible.",
        "sections_count": 5
    },
    {
        "category": "whs_compliance",
        "document_type": "checklist",
        "title": "PPE Compliance & Inspection Checklist",
        "specific_requirements": "PPE audit checklist: gloves (latex, rubber, cut-resistant) available, eye protection available, masks/respirators available and in-date, non-slip footwear compliant, aprons available, hearing protection available. Include condition checks, replacement dates, training verification.",
        "sections_count": 5
    },
    {
        "category": "whs_compliance",
        "document_type": "checklist",
        "title": "Fire Safety & Emergency Preparedness Checklist",
        "specific_requirements": "Monthly fire safety checklist: extinguishers inspected and in-date, exit signs illuminated, fire doors unobstructed, evacuation plans posted, emergency numbers displayed, first aid kits stocked, fire warden list current, drill records up to date. Include housekeeping-specific items.",
        "sections_count": 5
    },
    {
        "category": "whs_compliance",
        "document_type": "checklist",
        "title": "Monthly WHS Compliance Audit Checklist",
        "specific_requirements": "Comprehensive WHS audit: hazard register current, risk assessments reviewed, incident reports filed, training records current, SWMS available, PPE compliant, first aid supplies stocked, emergency procedures posted, consultation records maintained, return-to-work plans active.",
        "sections_count": 6
    },
    {
        "category": "staff_training",
        "document_type": "checklist",
        "title": "New Employee Induction Completion Checklist",
        "specific_requirements": "Induction verification checklist: employment paperwork, uniform issued, PPE issued, property tour completed, department introductions, WHS induction done, fire/emergency training, chemical safety training, equipment training, buddy assigned, first week assessment scheduled. Each item requires sign-off and date.",
        "sections_count": 5
    },
    {
        "category": "laundry_linen",
        "document_type": "checklist",
        "title": "Linen & Laundry Quality Assurance Checklist",
        "specific_requirements": "Laundry quality checklist: wash temperature correct, detergent levels correct, items sorted properly, stains pre-treated, linen inspected post-wash, folding standards met, par levels maintained, condemn bin reviewed, storage clean/dry, pest control compliant.",
        "sections_count": 5
    },
    {
        "category": "public_areas",
        "document_type": "checklist",
        "title": "Public Area Cleaning & Presentation Checklist",
        "specific_requirements": "Public area checklist by zone: lobby (floor, furniture, windows, plants), corridors (carpet, walls, lights), elevators (doors, buttons, floor, mirror), restrooms (fixtures, consumables, odour, floor), car park (swept, signage, spills). Include hourly/daily/weekly frequencies.",
        "sections_count": 5
    },
    {
        "category": "equipment_trolley",
        "document_type": "checklist",
        "title": "Equipment & Trolley Daily Inspection Checklist",
        "specific_requirements": "Daily equipment checklist: trolley clean and stocked, wheels functional, chemical caddy secure, vacuum cleaner (bag/filter, cord, suction), mop and bucket clean, cleaning cloths colour-coded, PPE on trolley, key card working. End-of-shift return checklist.",
        "sections_count": 5
    },
]

async def generate_document(client: httpx.AsyncClient, doc_config: dict, index: int, total: int):
    """Generate a single document via the AI API."""
    doc_type_label = {
        "sop": "SOP",
        "swms": "SWMS",
        "checklist": "Checklist"
    }.get(doc_config["document_type"], "Doc")
    
    print(f"\n[{index}/{total}] 🔄 Generating {doc_type_label}: {doc_config['title'][:60]}...")
    
    start = time.time()
    try:
        response = await client.post(
            f"{BASE_URL}/documents/generate",
            json=doc_config,
            timeout=120.0
        )
        elapsed = time.time() - start
        
        if response.status_code == 200:
            data = response.json()
            doc_id = data.get("document", {}).get("id", "?")
            sections = len(data.get("document", {}).get("sections", []))
            print(f"    ✅ Generated in {elapsed:.1f}s — ID: {doc_id} — {sections} sections")
            
            # Auto-publish the document
            await client.put(
                f"{BASE_URL}/documents/{doc_id}",
                json={"status": "published"},
                timeout=10.0
            )
            print(f"    📋 Published")
            return True
        else:
            print(f"    ❌ Failed ({response.status_code}): {response.text[:100]}")
            return False
    except Exception as e:
        elapsed = time.time() - start
        print(f"    ❌ Error after {elapsed:.1f}s: {str(e)[:100]}")
        return False

async def main():
    total = len(DOCUMENTS)
    print(f"=" * 70)
    print(f"  SUPREME COMPLIANCE — Document Library Generator")
    print(f"  Generating {total} documents (SOPs, SWMS, Checklists)")
    print(f"=" * 70)
    
    success = 0
    failed = 0
    
    async with httpx.AsyncClient() as client:
        for i, doc_config in enumerate(DOCUMENTS, 1):
            result = await generate_document(client, doc_config, i, total)
            if result:
                success += 1
            else:
                failed += 1
            
            # Brief pause between generations to avoid overwhelming the AI
            if i < total:
                await asyncio.sleep(2)
    
    print(f"\n{'=' * 70}")
    print(f"  GENERATION COMPLETE")
    print(f"  ✅ Success: {success}/{total}")
    if failed:
        print(f"  ❌ Failed:  {failed}/{total}")
    print(f"{'=' * 70}")

if __name__ == "__main__":
    asyncio.run(main())
