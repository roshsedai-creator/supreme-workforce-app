from fastapi import FastAPI, APIRouter, HTTPException, status, Body
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Create the main app
app = FastAPI(title="Supreme Hospitality Services — SOPs & Compliance Generator")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Helper to convert ObjectId to string
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

# =====================
# CATEGORIES — Housekeeping focused
# =====================
DOCUMENT_CATEGORIES = [
    {
        "id": "room_cleaning",
        "name": "Room Cleaning & Turndown",
        "icon": "bed-outline",
        "color": "#7B2D8E",
        "description": "Standard procedures for guest room cleaning, turndown service, and room preparation"
    },
    {
        "id": "laundry_linen",
        "name": "Laundry & Linen Management",
        "icon": "shirt-outline",
        "color": "#C4A265",
        "description": "Linen handling, laundry processing, inventory management, and quality standards"
    },
    {
        "id": "chemical_safety",
        "name": "Chemical Safety & MSDS",
        "icon": "flask-outline",
        "color": "#E74C3C",
        "description": "Safe handling, storage, and disposal of cleaning chemicals with MSDS compliance"
    },
    {
        "id": "deep_cleaning",
        "name": "Deep Cleaning & Sanitisation",
        "icon": "sparkles-outline",
        "color": "#2ECC71",
        "description": "Deep cleaning schedules, sanitisation protocols, and infection control procedures"
    },
    {
        "id": "public_areas",
        "name": "Public Area Cleaning",
        "icon": "business-outline",
        "color": "#3498DB",
        "description": "Lobby, corridor, elevator, restroom, and common area cleaning procedures"
    },
    {
        "id": "equipment_trolley",
        "name": "Equipment & Trolley Setup",
        "icon": "construct-outline",
        "color": "#F39C12",
        "description": "Trolley preparation, equipment maintenance, and supply management"
    },
    {
        "id": "quality_inspection",
        "name": "Quality Inspection & Audits",
        "icon": "checkbox-outline",
        "color": "#9B59B6",
        "description": "Room inspection checklists, quality audits, and compliance verification"
    },
    {
        "id": "staff_training",
        "name": "Staff Training & Induction",
        "icon": "school-outline",
        "color": "#1ABC9C",
        "description": "New employee induction, ongoing training programs, and competency assessments"
    },
    {
        "id": "whs_compliance",
        "name": "Health & Safety (WHS)",
        "icon": "medkit-outline",
        "color": "#E67E22",
        "description": "Workplace Health & Safety policies, hazard identification, and incident reporting"
    },
    {
        "id": "guest_requests",
        "name": "Guest Request Handling",
        "icon": "chatbubble-ellipses-outline",
        "color": "#8E44AD",
        "description": "Handling guest requests, complaints, lost & found, and special services"
    },
    {
        "id": "swms",
        "name": "Safe Work Method Statements",
        "icon": "shield-checkmark-outline",
        "color": "#C0392B",
        "description": "SWMS documents for high-risk activities, hazard controls, and safe work procedures"
    },
]

# =====================
# MODELS
# =====================

class LoginRequest(BaseModel):
    identifier: str
    pin: str

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: EmailStr
    role: str = "admin"
    pin: str = "1234"

class SiteCreate(BaseModel):
    name: str
    address: str = ""

class TemplateCreate(BaseModel):
    name: str
    category: str
    description: str = ""
    sections: list = []

class DocumentCreate(BaseModel):
    title: str
    category: str
    site_id: Optional[str] = None
    template_id: Optional[str] = None
    content: str = ""
    sections: list = []
    status: str = "draft"

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    sections: Optional[list] = None
    status: Optional[str] = None

class GenerateRequest(BaseModel):
    category: str
    document_type: str  # "sop", "checklist", or "swms"
    title: str
    site_name: Optional[str] = None
    specific_requirements: Optional[str] = ""
    sections_count: int = 5

# =====================
# AUTH ENDPOINTS
# =====================

@api_router.post("/auth/login")
async def login(request: LoginRequest):
    """Login with phone/email and PIN"""
    user = await db.users.find_one({
        "$or": [
            {"phone": request.identifier},
            {"email": request.identifier}
        ],
        "status": "active"
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("pin") != request.pin:
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    user = serialize_doc(user)
    return {
        "success": True,
        "user": user,
        "token": f"token_{user['id']}"
    }

@api_router.post("/auth/register")
async def register(registration: dict):
    """Register a new user"""
    existing = await db.users.find_one({
        "$or": [
            {"phone": registration.get("phone", "")},
            {"email": registration.get("email", "")}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="User with this phone or email already exists")
    
    user_doc = {
        "first_name": registration.get("first_name", ""),
        "last_name": registration.get("last_name", ""),
        "phone": registration.get("phone", ""),
        "email": registration.get("email", ""),
        "role": registration.get("role", "admin"),
        "pin": registration.get("pin", "1234"),
        "status": "active",
        "created_at": datetime.utcnow(),
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)
    
    return {
        "success": True,
        "user": user_doc,
        "token": f"token_{user_doc['id']}"
    }

# =====================
# USER ENDPOINTS
# =====================

@api_router.get("/users")
async def get_users(role: Optional[str] = None):
    query = {}
    if role:
        query["role"] = role
    users = await db.users.find(query).to_list(1000)
    return [serialize_doc(u) for u in users]

@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_doc(user)

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, update_data: dict):
    update_data.pop("id", None)
    update_data.pop("_id", None)
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    return serialize_doc(user)

# =====================
# SITE ENDPOINTS
# =====================

@api_router.post("/sites")
async def create_site(site: SiteCreate):
    site_doc = {
        "name": site.name,
        "address": site.address,
        "created_at": datetime.utcnow()
    }
    result = await db.sites.insert_one(site_doc)
    site_doc["id"] = str(result.inserted_id)
    return serialize_doc(site_doc)

@api_router.get("/sites")
async def get_sites():
    sites = await db.sites.find().to_list(1000)
    return [serialize_doc(s) for s in sites]

@api_router.delete("/sites/{site_id}")
async def delete_site(site_id: str):
    result = await db.sites.delete_one({"_id": ObjectId(site_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Site not found")
    return {"success": True}

# =====================
# CATEGORIES ENDPOINT
# =====================

@api_router.get("/categories")
async def get_categories():
    return DOCUMENT_CATEGORIES

# =====================
# TEMPLATE ENDPOINTS
# =====================

@api_router.post("/templates")
async def create_template(template: TemplateCreate):
    template_doc = {
        "name": template.name,
        "category": template.category,
        "description": template.description,
        "sections": template.sections,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.sop_templates.insert_one(template_doc)
    template_doc["id"] = str(result.inserted_id)
    return serialize_doc(template_doc)

@api_router.get("/templates")
async def get_templates(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    templates = await db.sop_templates.find(query).sort("created_at", -1).to_list(1000)
    return [serialize_doc(t) for t in templates]

@api_router.get("/templates/{template_id}")
async def get_template(template_id: str):
    template = await db.sop_templates.find_one({"_id": ObjectId(template_id)})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return serialize_doc(template)

@api_router.put("/templates/{template_id}")
async def update_template(template_id: str, update_data: dict):
    update_data.pop("id", None)
    update_data.pop("_id", None)
    update_data["updated_at"] = datetime.utcnow()
    result = await db.sop_templates.update_one(
        {"_id": ObjectId(template_id)},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    template = await db.sop_templates.find_one({"_id": ObjectId(template_id)})
    return serialize_doc(template)

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    result = await db.sop_templates.delete_one({"_id": ObjectId(template_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"success": True}

# =====================
# DOCUMENT ENDPOINTS
# =====================

@api_router.post("/documents")
async def create_document(doc: DocumentCreate):
    doc_data = {
        "title": doc.title,
        "category": doc.category,
        "site_id": doc.site_id,
        "template_id": doc.template_id,
        "content": doc.content,
        "sections": doc.sections,
        "status": doc.status,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.documents.insert_one(doc_data)
    doc_data["id"] = str(result.inserted_id)
    return serialize_doc(doc_data)

@api_router.get("/documents")
async def get_documents(
    category: Optional[str] = None,
    status: Optional[str] = None,
    site_id: Optional[str] = None,
    search: Optional[str] = None,
):
    query = {}
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    if site_id:
        query["site_id"] = site_id
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    
    docs = await db.documents.find(query).sort("updated_at", -1).to_list(1000)
    return [serialize_doc(d) for d in docs]

@api_router.get("/documents/{doc_id}")
async def get_document(doc_id: str):
    doc = await db.documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return serialize_doc(doc)

@api_router.put("/documents/{doc_id}")
async def update_document(doc_id: str, update_data: dict):
    update_data.pop("id", None)
    update_data.pop("_id", None)
    update_data["updated_at"] = datetime.utcnow()
    result = await db.documents.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    doc = await db.documents.find_one({"_id": ObjectId(doc_id)})
    return serialize_doc(doc)

@api_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    result = await db.documents.delete_one({"_id": ObjectId(doc_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True}

# =====================
# AI DOCUMENT GENERATION
# =====================

@api_router.post("/documents/generate")
async def generate_document(request: GenerateRequest):
    """Generate an SOP, Checklist, or SWMS document using AI"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY", "")
        if not api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        session_id = f"sop_gen_{uuid.uuid4().hex[:12]}"
        
        # Build category display name
        category_name = request.category
        for cat in DOCUMENT_CATEGORIES:
            if cat["id"] == request.category:
                category_name = cat["name"]
                break
        
        site_context = ""
        if request.site_name:
            site_context = f" for {request.site_name}"
        
        # Determine document type label
        if request.document_type == "swms":
            doc_type_label = "Safe Work Method Statement (SWMS)"
        elif request.document_type == "checklist":
            doc_type_label = "Compliance Checklist"
        else:
            doc_type_label = "Standard Operating Procedure (SOP)"
        
        # Build SWMS-specific instructions
        swms_instructions = ""
        if request.document_type == "swms":
            swms_instructions = """
For SWMS documents, you MUST include these specific sections:
1. Activity/Task Description
2. Hazard Identification (list all hazards)
3. Risk Assessment (use a risk matrix: Likelihood x Consequence = Risk Level)
4. Control Measures (Hierarchy of Controls: Elimination > Substitution > Engineering > Administrative > PPE)
5. PPE Requirements
6. Emergency Procedures
7. Responsible Persons
8. Training Requirements
9. Review Date and Sign-off

Format risk assessments as tables where possible. Each hazard must have: Hazard Description, Potential Harm, Risk Level (High/Medium/Low), and Control Measures."""

        checklist_instructions = ""
        if request.document_type == "checklist":
            checklist_instructions = "For checklists, format content as checkbox items using - [ ] prefix for each item. Group items logically and include pass/fail criteria."

        sop_instructions = ""
        if request.document_type == "sop":
            sop_instructions = "For SOPs, include numbered steps, responsibilities, required materials/equipment, time estimates, quality standards, and any relevant safety notes. Each section should be comprehensive and actionable."

        system_message = f"""You are an expert consultant specialising in creating professional {doc_type_label} documents for outsourced housekeeping services in the hotel and hospitality industry.

You create documents for Supreme Hospitality Services, a premium outsourced housekeeping company operating across multiple hotel properties in Australia.

Your documents must be:
- Professional, industry-standard, and premium quality
- Compliant with Australian WHS (Work Health & Safety) regulations and Safe Work Australia standards
- Practical and actionable for housekeeping staff and supervisors
- Well-structured with clear sections, steps, responsibilities, and quality standards
- Specific to hotel housekeeping operations (room attendants, supervisors, housekeeping managers)

{swms_instructions}
{checklist_instructions}
{sop_instructions}

Format your response as a JSON object with this exact structure:
{{
  "title": "Document title",
  "sections": [
    {{
      "title": "Section title",
      "content": "Section content with detailed steps, numbered lists, bullet points etc. Use markdown formatting.",
      "order": 1
    }}
  ],
  "summary": "A brief 1-2 sentence summary of this document"
}}

Include approximately {request.sections_count} sections. Each section should be comprehensive with actionable, industry-specific content."""
        
        user_prompt = f"""Create a professional {doc_type_label} document{site_context}.

Category: {category_name}
Title: {request.title}
Company: Supreme Hospitality Services (outsourced housekeeping)
Industry: Hotel housekeeping services
Region: Australia
{"Additional Requirements: " + request.specific_requirements if request.specific_requirements else ""}

Generate a comprehensive, premium-quality document with detailed, actionable content suitable for use in a professional hotel housekeeping operation. Return ONLY the JSON object, no additional text."""

        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message
        )
        chat.with_model("openai", "gpt-4.1")
        
        user_message = UserMessage(text=user_prompt)
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        import json
        
        clean_response = response.strip()
        if clean_response.startswith("```json"):
            clean_response = clean_response[7:]
        if clean_response.startswith("```"):
            clean_response = clean_response[3:]
        if clean_response.endswith("```"):
            clean_response = clean_response[:-3]
        clean_response = clean_response.strip()
        
        try:
            parsed = json.loads(clean_response)
        except json.JSONDecodeError:
            parsed = {
                "title": request.title,
                "sections": [
                    {"title": "Generated Content", "content": response, "order": 1}
                ],
                "summary": f"AI-generated {doc_type_label} for {category_name}"
            }
        
        # Save the generated document
        doc_data = {
            "title": parsed.get("title", request.title),
            "category": request.category,
            "site_id": None,
            "template_id": None,
            "content": parsed.get("summary", ""),
            "sections": parsed.get("sections", []),
            "status": "draft",
            "document_type": request.document_type,
            "ai_generated": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        result = await db.documents.insert_one(doc_data)
        doc_data["id"] = str(result.inserted_id)
        
        return {
            "success": True,
            "document": serialize_doc(doc_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI Generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate document: {str(e)}")

# =====================
# DASHBOARD STATS
# =====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    total_documents = await db.documents.count_documents({})
    published_documents = await db.documents.count_documents({"status": "published"})
    draft_documents = await db.documents.count_documents({"status": "draft"})
    total_templates = await db.sop_templates.count_documents({})
    
    category_counts = {}
    for cat in DOCUMENT_CATEGORIES:
        count = await db.documents.count_documents({"category": cat["id"]})
        category_counts[cat["id"]] = count
    
    recent_docs = await db.documents.find().sort("updated_at", -1).to_list(5)
    
    return {
        "total_documents": total_documents,
        "published_documents": published_documents,
        "draft_documents": draft_documents,
        "total_templates": total_templates,
        "category_counts": category_counts,
        "recent_documents": [serialize_doc(d) for d in recent_docs]
    }

# =====================
# MARKDOWN TO HTML CONVERTER (using Python markdown library)
# =====================

import re
import markdown as md

def markdown_to_html(text: str) -> str:
    """Convert markdown content to premium HTML using the Python markdown library."""
    if not text:
        return ""
    
    # Pre-process: convert checkbox syntax to HTML before markdown processes it
    lines = text.split('\n')
    processed_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('- [ ] '):
            processed_lines.append(f'<div class="check-item"><span class="check-box">☐</span> {stripped[6:]}</div>')
        elif stripped.startswith('- [x] ') or stripped.startswith('- [X] '):
            processed_lines.append(f'<div class="check-item checked"><span class="check-box checked">☑</span> {stripped[6:]}</div>')
        else:
            processed_lines.append(line)
    
    processed_text = '\n'.join(processed_lines)
    
    # Convert using Python markdown library with extensions
    html = md.markdown(
        processed_text,
        extensions=['tables', 'sane_lists', 'smarty'],
        output_format='html5'
    )
    
    # Post-process: wrap tables in styled container
    html = html.replace('<table>', '<div class="table-wrap"><table>')
    html = html.replace('</table>', '</table></div>')
    
    # Post-process: strip any remaining raw --- (horizontal rules already become <hr>)
    
    return html

# =====================
# DOCUMENT EXPORT (HTML) — Premium branded with PDF support
# =====================

@api_router.get("/documents/{doc_id}/export")
async def export_document(doc_id: str):
    """Export document as premium branded HTML with Save as PDF — sign-off ready"""
    doc = await db.documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = serialize_doc(doc)
    
    # Build table of contents + sections HTML
    toc_html = ""
    sections_html = ""
    for i, section in enumerate(doc.get("sections", [])):
        content = section.get("content", "")
        parsed_content = markdown_to_html(content)
        sec_title = section.get('title', f'Section {i+1}')
        
        toc_html += f'<div class="toc-item"><span class="toc-num">{i+1:02d}</span><span class="toc-title">{sec_title}</span><span class="toc-dots"></span><span class="toc-page">{i+1}</span></div>'
        
        sections_html += f"""
        <div class="section" id="section-{i+1}">
            <div class="section-number">{i+1:02d}</div>
            <div class="section-body">
                <h2>{sec_title}</h2>
                <div class="section-content">{parsed_content}</div>
            </div>
        </div>"""
    
    # Get category name
    category_name = doc.get("category", "")
    for cat in DOCUMENT_CATEGORIES:
        if cat["id"] == doc.get("category"):
            category_name = cat["name"]
            break
    
    # Get doc type label
    doc_type = doc.get("document_type", "sop")
    if doc_type == "swms":
        doc_type_label = "SAFE WORK METHOD STATEMENT"
        doc_type_short = "SWMS"
    elif doc_type == "checklist":
        doc_type_label = "COMPLIANCE CHECKLIST"
        doc_type_short = "CHK"
    else:
        doc_type_label = "STANDARD OPERATING PROCEDURE"
        doc_type_short = "SOP"
    
    created_date = ""
    if doc.get("created_at"):
        if isinstance(doc["created_at"], datetime):
            created_date = doc["created_at"].strftime("%d %B %Y")
        else:
            created_date = str(doc["created_at"])
    
    doc_ref = f"SHS-{doc_type_short}-{doc.get('id', 'N/A')[:8].upper()}"
    current_year = datetime.utcnow().year
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{doc.get('title', 'Document')} — Supreme Compliance</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        :root {{
            --purple: #7B2D8E;
            --purple-dark: #5a1d6e;
            --purple-light: #f5f0ff;
            --gold: #C4A265;
            --gold-muted: rgba(196,162,101,0.6);
            --dark: #0a0a14;
            --dark-mid: #1a1a2e;
            --text: #1a1a2e;
            --text-light: #4a4a6a;
            --text-muted: #6b7280;
            --border: #e5e0d8;
            --bg: #f8f7f4;
            --white: #ffffff;
        }}
        
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: var(--text);
            line-height: 1.7;
            background: var(--bg);
            font-size: 14px;
        }}
        
        /* ===== TOOLBAR (hidden on print) ===== */
        .toolbar {{
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 100;
            background: var(--dark);
            padding: 10px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid rgba(196,162,101,0.25);
        }}
        .toolbar-left {{
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        .toolbar-logo {{
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, var(--purple), #9B4DB0);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 900;
            color: var(--gold);
        }}
        .toolbar-text {{
            color: var(--gold);
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 1px;
        }}
        .toolbar-actions {{
            display: flex;
            gap: 10px;
        }}
        .pdf-btn {{
            background: linear-gradient(135deg, var(--purple), #9B4DB0);
            color: white;
            border: none;
            padding: 10px 32px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            letter-spacing: 0.5px;
            transition: transform 0.15s, box-shadow 0.15s;
            box-shadow: 0 2px 8px rgba(123,45,142,0.3);
        }}
        .pdf-btn:hover {{ transform: translateY(-1px); box-shadow: 0 4px 12px rgba(123,45,142,0.4); }}
        .toolbar-spacer {{ height: 58px; }}
        
        /* ===== PAGE WRAPPER ===== */
        .page-wrapper {{
            max-width: 900px;
            margin: 0 auto;
            background: var(--white);
            box-shadow: 0 0 40px rgba(0,0,0,0.08);
        }}
        
        /* ===== HEADER / COVER ===== */
        .header {{
            background: linear-gradient(145deg, var(--dark) 0%, var(--dark-mid) 60%, #2d1b4e 100%);
            color: white;
            padding: 48px 48px 40px;
            position: relative;
            overflow: hidden;
        }}
        .header::before {{
            content: '';
            position: absolute;
            top: -60%;
            right: -15%;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(123,45,142,0.12) 0%, transparent 70%);
            border-radius: 50%;
        }}
        .header::after {{
            content: '';
            position: absolute;
            bottom: -40%;
            left: -10%;
            width: 350px;
            height: 350px;
            background: radial-gradient(circle, rgba(196,162,101,0.06) 0%, transparent 70%);
            border-radius: 50%;
        }}
        .header-top {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 36px;
            position: relative;
            z-index: 1;
        }}
        .logo-area {{
            display: flex;
            align-items: center;
            gap: 16px;
        }}
        .logo-icon {{
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, var(--purple), #9B4DB0);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            font-weight: 900;
            color: var(--gold);
            border: 2px solid rgba(196,162,101,0.3);
            box-shadow: 0 4px 16px rgba(123,45,142,0.3);
        }}
        .company-name {{
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 3.5px;
            color: var(--gold);
        }}
        .company-sub {{
            font-size: 10px;
            color: var(--gold-muted);
            letter-spacing: 2px;
            margin-top: 3px;
            text-transform: uppercase;
        }}
        .doc-control {{
            text-align: right;
            position: relative;
            z-index: 1;
        }}
        .doc-control-item {{
            font-size: 10px;
            color: rgba(255,255,255,0.4);
            margin-bottom: 3px;
            letter-spacing: 0.5px;
        }}
        .doc-control-item strong {{
            color: rgba(196,162,101,0.8);
            font-weight: 700;
        }}
        .header-title {{
            position: relative;
            z-index: 1;
        }}
        .doc-type-badge {{
            display: inline-block;
            background: rgba(123,45,142,0.35);
            color: #d4a5e5;
            padding: 5px 20px;
            border-radius: 24px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 2.5px;
            margin-bottom: 14px;
            border: 1px solid rgba(123,45,142,0.5);
        }}
        .header h1 {{
            font-size: 30px;
            font-weight: 900;
            line-height: 1.25;
            margin-bottom: 6px;
            letter-spacing: -0.5px;
        }}
        .header-meta {{
            font-size: 12px;
            color: rgba(255,255,255,0.45);
            display: flex;
            gap: 20px;
            margin-top: 14px;
            flex-wrap: wrap;
        }}
        .header-meta span {{
            display: flex;
            align-items: center;
            gap: 5px;
        }}
        .gold-line {{
            height: 3px;
            background: linear-gradient(90deg, var(--gold), rgba(196,162,101,0.2), transparent);
            margin-top: 28px;
            border-radius: 2px;
            position: relative;
            z-index: 1;
        }}
        
        /* ===== DOCUMENT CONTROL BOX ===== */
        .doc-control-box {{
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            border: 1px solid var(--border);
            border-radius: 0;
            margin: 0;
            background: #faf9f7;
        }}
        .dc-cell {{
            padding: 12px 16px;
            border-right: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
        }}
        .dc-cell:nth-child(4n) {{ border-right: none; }}
        .dc-cell:nth-last-child(-n+4) {{ border-bottom: none; }}
        .dc-label {{
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: var(--purple);
            margin-bottom: 4px;
        }}
        .dc-value {{
            font-size: 12px;
            font-weight: 600;
            color: var(--text);
        }}
        
        /* ===== TABLE OF CONTENTS ===== */
        .toc {{
            padding: 28px 48px;
            border-bottom: 1px solid var(--border);
        }}
        .toc-heading {{
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: var(--purple);
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--purple-light);
        }}
        .toc-item {{
            display: flex;
            align-items: center;
            padding: 6px 0;
            font-size: 13px;
            color: var(--text-light);
        }}
        .toc-num {{
            font-weight: 800;
            color: var(--purple);
            width: 28px;
            font-size: 11px;
        }}
        .toc-title {{
            font-weight: 500;
        }}
        .toc-dots {{
            flex: 1;
            border-bottom: 1px dotted #ccc;
            margin: 0 8px;
            min-width: 20px;
        }}
        .toc-page {{
            font-weight: 600;
            color: var(--text-muted);
            font-size: 11px;
        }}
        
        /* ===== CONTENT AREA ===== */
        .content {{
            padding: 36px 48px;
        }}
        
        .summary {{
            background: linear-gradient(135deg, var(--purple-light), #faf8f5);
            border-radius: 12px;
            padding: 20px 24px;
            margin-bottom: 32px;
            border-left: 4px solid var(--purple);
            font-size: 14px;
            color: var(--text-light);
            font-style: italic;
            line-height: 1.8;
        }}
        
        .section {{
            display: flex;
            gap: 18px;
            margin-bottom: 24px;
            page-break-inside: avoid;
        }}
        .section-number {{
            flex-shrink: 0;
            width: 42px;
            height: 42px;
            background: linear-gradient(135deg, var(--purple), var(--purple-dark));
            color: var(--gold);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 800;
            margin-top: 2px;
        }}
        .section-body {{
            flex: 1;
            background: var(--white);
            border-radius: 12px;
            padding: 24px 28px;
            border: 1px solid #eee;
        }}
        .section h2 {{
            font-size: 16px;
            font-weight: 800;
            color: var(--purple);
            margin-bottom: 14px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--purple-light);
            letter-spacing: -0.2px;
        }}
        .section-content {{
            font-size: 13.5px;
            color: #3a3a5a;
            line-height: 1.85;
        }}
        .section-content p {{ margin-bottom: 10px; }}
        .section-content h1 {{ font-size: 16px; font-weight: 800; color: var(--text); margin: 18px 0 10px; }}
        .section-content h2 {{ font-size: 15px; font-weight: 700; color: var(--text); margin: 16px 0 8px; border: none; padding: 0; }}
        .section-content h3 {{ font-size: 14px; font-weight: 700; color: var(--text); margin: 14px 0 6px; }}
        .section-content h4 {{ font-size: 13px; font-weight: 600; color: #374151; margin: 10px 0 6px; }}
        .section-content hr {{ border: none; border-top: 2px solid var(--border); margin: 16px 0; }}
        .section-content strong {{ font-weight: 700; color: var(--text); }}
        .section-content em {{ font-style: italic; }}
        
        /* Lists from markdown library */
        .section-content ul {{ 
            list-style: none; 
            padding-left: 4px; 
            margin: 8px 0;
        }}
        .section-content ul li {{
            position: relative;
            padding-left: 18px;
            margin-bottom: 4px;
            line-height: 1.75;
        }}
        .section-content ul li::before {{
            content: '';
            position: absolute;
            left: 0;
            top: 9px;
            width: 6px;
            height: 6px;
            background: var(--purple);
            border-radius: 50%;
        }}
        .section-content ol {{
            padding-left: 4px;
            margin: 8px 0;
            counter-reset: ol-counter;
            list-style: none;
        }}
        .section-content ol li {{
            position: relative;
            padding-left: 30px;
            margin-bottom: 6px;
            line-height: 1.75;
            counter-increment: ol-counter;
        }}
        .section-content ol li::before {{
            content: counter(ol-counter);
            position: absolute;
            left: 0;
            top: 2px;
            width: 22px;
            height: 22px;
            background: rgba(123,45,142,0.1);
            color: var(--purple);
            border-radius: 5px;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            line-height: 22px;
        }}
        
        /* Tables */
        .table-wrap {{
            margin: 16px 0;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid var(--border);
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }}
        thead tr {{
            background: linear-gradient(135deg, var(--purple), var(--purple-dark));
        }}
        th {{
            color: white;
            padding: 10px 14px;
            text-align: left;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.7px;
            border-right: 1px solid rgba(255,255,255,0.12);
        }}
        th:last-child {{ border-right: none; }}
        td {{
            padding: 9px 14px;
            border-bottom: 1px solid #f0ede8;
            border-right: 1px solid #f0ede8;
            color: #3a3a5a;
            line-height: 1.5;
        }}
        td:last-child {{ border-right: none; }}
        tbody tr:nth-child(even) {{ background: #faf8f5; }}
        tbody tr:nth-child(odd) {{ background: var(--white); }}
        tbody tr:last-child td {{ border-bottom: none; }}
        
        /* Checkboxes (pre-processed) */
        .check-item {{
            padding: 5px 0 5px 4px;
            display: flex;
            align-items: flex-start;
            gap: 10px;
            line-height: 1.6;
        }}
        .check-box {{
            display: inline-flex;
            width: 18px;
            height: 18px;
            border: 2px solid var(--purple);
            border-radius: 3px;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            flex-shrink: 0;
            margin-top: 2px;
        }}
        .check-box.checked {{
            background: var(--purple);
            color: white;
        }}
        .check-item.checked {{ color: #9ca3af; }}
        
        /* ===== SIGN-OFF / APPROVAL SECTION ===== */
        .signoff {{
            padding: 36px 48px;
            border-top: 2px solid var(--border);
            page-break-inside: avoid;
        }}
        .signoff-heading {{
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: var(--purple);
            margin-bottom: 20px;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--purple-light);
        }}
        .signoff-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: hidden;
        }}
        .signoff-block {{
            padding: 20px 24px;
            border-right: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
        }}
        .signoff-block:nth-child(2n) {{ border-right: none; }}
        .signoff-block:nth-last-child(-n+2) {{ border-bottom: none; }}
        .signoff-role {{
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: var(--purple);
            margin-bottom: 16px;
        }}
        .signoff-line {{
            border-bottom: 1px solid #ccc;
            padding-bottom: 4px;
            margin-bottom: 10px;
            min-height: 24px;
        }}
        .signoff-label {{
            font-size: 9px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }}
        .signoff-note {{
            font-size: 11px;
            color: var(--text-muted);
            font-style: italic;
            margin-top: 16px;
            padding: 12px 16px;
            background: #faf9f7;
            border-radius: 6px;
            border-left: 3px solid var(--gold);
            line-height: 1.6;
        }}
        
        /* ===== REVISION HISTORY ===== */
        .revision {{
            padding: 0 48px 36px;
            page-break-inside: avoid;
        }}
        .revision-heading {{
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: var(--purple);
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--purple-light);
        }}
        .revision table {{
            font-size: 11px;
        }}
        .revision th {{
            font-size: 9px;
        }}
        
        /* ===== FOOTER ===== */
        .footer {{
            background: linear-gradient(145deg, var(--dark), var(--dark-mid));
            color: rgba(255,255,255,0.5);
            padding: 36px 48px;
        }}
        .footer-content {{
            text-align: center;
        }}
        .footer-brand {{
            font-size: 13px;
            font-weight: 800;
            color: var(--gold);
            letter-spacing: 4px;
            margin-bottom: 4px;
        }}
        .footer-company {{
            font-size: 10px;
            color: var(--gold-muted);
            letter-spacing: 2px;
            margin-bottom: 14px;
        }}
        .footer-confidential {{
            font-size: 10px;
            color: #ef4444;
            font-weight: 700;
            margin-bottom: 14px;
            padding: 6px 22px;
            background: rgba(239,68,68,0.08);
            border: 1px solid rgba(239,68,68,0.15);
            border-radius: 20px;
            display: inline-block;
            letter-spacing: 2px;
        }}
        .footer-divider {{
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(196,162,101,0.2), transparent);
            margin: 14px 0;
        }}
        .footer-text {{
            font-size: 10px;
            line-height: 1.7;
            color: rgba(255,255,255,0.3);
        }}
        .footer-ref {{
            font-size: 10px;
            color: rgba(255,255,255,0.25);
            margin-top: 10px;
            font-weight: 500;
        }}
        
        /* ===== PRINT STYLES ===== */
        @media print {{
            .toolbar, .toolbar-spacer {{ display: none !important; }}
            
            body {{ 
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }}
            
            .page-wrapper {{
                box-shadow: none;
                max-width: 100%;
            }}
            
            .header {{
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                page-break-after: avoid;
            }}
            
            .section {{
                page-break-inside: avoid;
            }}
            
            .section-body {{
                border: 1px solid #ddd;
            }}
            
            .section-number {{
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }}
            
            thead tr {{
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }}
            
            .doc-type-badge {{
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }}
            
            .signoff {{
                page-break-before: auto;
                page-break-inside: avoid;
            }}
            
            .signoff-block {{
                min-height: 100px;
            }}
            
            .footer {{
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }}
            
            .gold-line {{
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }}
            
            .doc-control-box {{
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }}

            .section-content ul li::before {{
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }}
            
            .section-content ol li::before {{
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }}

            .check-box {{
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }}
            
            @page {{
                margin: 12mm 10mm;
                size: A4;
            }}
        }}
    </style>
</head>
<body>
    <!-- Save as PDF Toolbar (hidden when printing) -->
    <div class="toolbar">
        <div class="toolbar-left">
            <div class="toolbar-logo">SC</div>
            <span class="toolbar-text">SUPREME COMPLIANCE</span>
        </div>
        <div class="toolbar-actions">
            <button class="pdf-btn" onclick="window.print()">
                &#128196; Save as PDF
            </button>
        </div>
    </div>
    <div class="toolbar-spacer"></div>

    <div class="page-wrapper">
        <!-- HEADER / COVER -->
        <div class="header">
            <div class="header-top">
                <div class="logo-area">
                    <div class="logo-icon">SC</div>
                    <div>
                        <div class="company-name">SUPREME COMPLIANCE</div>
                        <div class="company-sub">Supreme Hospitality Services Pty Ltd</div>
                    </div>
                </div>
                <div class="doc-control">
                    <div class="doc-control-item"><strong>Reference:</strong> {doc_ref}</div>
                    <div class="doc-control-item"><strong>Version:</strong> 1.0</div>
                    <div class="doc-control-item"><strong>Date:</strong> {created_date}</div>
                    <div class="doc-control-item"><strong>Status:</strong> {doc.get('status', 'Draft').upper()}</div>
                </div>
            </div>
            
            <div class="header-title">
                <div class="doc-type-badge">{doc_type_label}</div>
                <h1>{doc.get('title', 'Document')}</h1>
                <div class="header-meta">
                    <span>&#128193; {category_name}</span>
                    <span>&#128196; {len(doc.get('sections', []))} Sections</span>
                    <span>&#128197; {created_date}</span>
                    <span>&#128203; Ref: {doc_ref}</span>
                </div>
            </div>
            
            <div class="gold-line"></div>
        </div>
        
        <!-- DOCUMENT CONTROL INFO -->
        <div class="doc-control-box">
            <div class="dc-cell">
                <div class="dc-label">Document Reference</div>
                <div class="dc-value">{doc_ref}</div>
            </div>
            <div class="dc-cell">
                <div class="dc-label">Version</div>
                <div class="dc-value">1.0</div>
            </div>
            <div class="dc-cell">
                <div class="dc-label">Issue Date</div>
                <div class="dc-value">{created_date}</div>
            </div>
            <div class="dc-cell">
                <div class="dc-label">Review Date</div>
                <div class="dc-value">As Required</div>
            </div>
            <div class="dc-cell">
                <div class="dc-label">Document Type</div>
                <div class="dc-value">{doc_type_label.title()}</div>
            </div>
            <div class="dc-cell">
                <div class="dc-label">Category</div>
                <div class="dc-value">{category_name}</div>
            </div>
            <div class="dc-cell">
                <div class="dc-label">Prepared By</div>
                <div class="dc-value">Supreme Compliance</div>
            </div>
            <div class="dc-cell">
                <div class="dc-label">Classification</div>
                <div class="dc-value">Internal / Confidential</div>
            </div>
        </div>
        
        <!-- TABLE OF CONTENTS -->
        <div class="toc">
            <div class="toc-heading">Table of Contents</div>
            {toc_html}
        </div>
        
        <!-- MAIN CONTENT -->
        <div class="content">
            {"<div class='summary'>" + doc.get('content', '') + "</div>" if doc.get('content') else ""}
            {sections_html}
        </div>
        
        <!-- SIGN-OFF / APPROVAL SECTION -->
        <div class="signoff">
            <div class="signoff-heading">Document Approval &amp; Sign-Off</div>
            <div class="signoff-grid">
                <div class="signoff-block">
                    <div class="signoff-role">Prepared By</div>
                    <div class="signoff-line"></div>
                    <div class="signoff-label">Name</div>
                    <div class="signoff-line" style="margin-top:12px"></div>
                    <div class="signoff-label">Signature &amp; Date</div>
                </div>
                <div class="signoff-block">
                    <div class="signoff-role">Reviewed By</div>
                    <div class="signoff-line"></div>
                    <div class="signoff-label">Name</div>
                    <div class="signoff-line" style="margin-top:12px"></div>
                    <div class="signoff-label">Signature &amp; Date</div>
                </div>
                <div class="signoff-block">
                    <div class="signoff-role">Approved By (Site Manager)</div>
                    <div class="signoff-line"></div>
                    <div class="signoff-label">Name</div>
                    <div class="signoff-line" style="margin-top:12px"></div>
                    <div class="signoff-label">Signature &amp; Date</div>
                </div>
                <div class="signoff-block">
                    <div class="signoff-role">Authorised By (Operations Director)</div>
                    <div class="signoff-line"></div>
                    <div class="signoff-label">Name</div>
                    <div class="signoff-line" style="margin-top:12px"></div>
                    <div class="signoff-label">Signature &amp; Date</div>
                </div>
            </div>
            <div class="signoff-note">
                By signing above, the authorised persons confirm that this document has been reviewed, 
                is accurate, and is approved for distribution and implementation within Supreme Hospitality Services operations.
                This document must be reviewed and re-approved following any significant changes to procedures, legislation, or operational requirements.
            </div>
        </div>
        
        <!-- REVISION HISTORY -->
        <div class="revision">
            <div class="revision-heading">Revision History</div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Version</th>
                            <th>Date</th>
                            <th>Author</th>
                            <th>Description of Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1.0</td>
                            <td>{created_date}</td>
                            <td>Supreme Compliance (AI)</td>
                            <td>Initial version — document generated and issued</td>
                        </tr>
                        <tr>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- FOOTER -->
        <div class="footer">
            <div class="footer-content">
                <div class="footer-brand">SUPREME COMPLIANCE</div>
                <div class="footer-company">Supreme Hospitality Services Pty Ltd</div>
                <div class="footer-confidential">CONFIDENTIAL &mdash; INTERNAL USE ONLY</div>
                <div class="footer-divider"></div>
                <div class="footer-text">
                    This document is the property of Supreme Hospitality Services Pty Ltd.<br>
                    Unauthorised reproduction, distribution, or modification is strictly prohibited.<br>
                    For enquiries contact: management@supremehospitality.com.au
                </div>
                <div class="footer-divider"></div>
                <div class="footer-ref">
                    {doc_ref} &bull; Version 1.0 &bull; Issued {created_date} &bull; &copy; {current_year} Supreme Hospitality Services
                </div>
            </div>
        </div>
    </div>
</body>
</html>"""
    
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=html)

# =====================
# SEED DATA
# =====================

@api_router.post("/seed")
async def seed_data():
    admin = await db.users.find_one({"phone": "0457802302"})
    if not admin:
        await db.users.insert_one({
            "first_name": "John",
            "last_name": "Admin",
            "phone": "0457802302",
            "email": "admin@supremehospitality.com.au",
            "role": "admin",
            "pin": "1234",
            "status": "active",
            "created_at": datetime.utcnow(),
        })
    
    admin2 = await db.users.find_one({"phone": "0433708550"})
    if not admin2:
        await db.users.insert_one({
            "first_name": "Happy",
            "last_name": "Kafle",
            "phone": "0433708550",
            "email": "happy@supremehospitality.com.au",
            "role": "admin",
            "pin": "1234",
            "status": "active",
            "created_at": datetime.utcnow(),
        })
    
    return {"success": True, "message": "Seed data created"}

# =====================
# ROOT
# =====================

@api_router.get("/")
async def root():
    return {
        "message": "Supreme Hospitality Services — SOPs & Compliance Generator API",
        "version": "2.1.0"
    }

# Include the router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    try:
        admin = await db.users.find_one({"phone": "0457802302"})
        if not admin:
            await db.users.insert_one({
                "first_name": "John",
                "last_name": "Admin",
                "phone": "0457802302",
                "email": "admin@supremehospitality.com.au",
                "role": "admin",
                "pin": "1234",
                "status": "active",
                "created_at": datetime.utcnow(),
            })
            logger.info("Admin user seeded")
        
        admin2 = await db.users.find_one({"phone": "0433708550"})
        if not admin2:
            await db.users.insert_one({
                "first_name": "Happy",
                "last_name": "Kafle",
                "phone": "0433708550",
                "email": "happy@supremehospitality.com.au",
                "role": "admin",
                "pin": "1234",
                "status": "active",
                "created_at": datetime.utcnow(),
            })
            logger.info("Admin user 2 seeded")
    except Exception as e:
        logger.error(f"Startup seed error: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
