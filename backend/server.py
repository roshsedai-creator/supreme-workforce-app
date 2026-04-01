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
# DOCUMENT EXPORT (HTML) — Premium branded
# =====================

@api_router.get("/documents/{doc_id}/export")
async def export_document(doc_id: str):
    """Export document as premium branded HTML"""
    doc = await db.documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = serialize_doc(doc)
    
    # Build sections HTML
    sections_html = ""
    for i, section in enumerate(doc.get("sections", [])):
        content = section.get("content", "")
        # Convert markdown-style formatting to HTML
        content = content.replace("\n\n", "</p><p>")
        content = content.replace("\n- [ ] ", "<br><span class='checkbox'>☐</span> ")
        content = content.replace("\n- [x] ", "<br><span class='checkbox checked'>☑</span> ")
        content = content.replace("\n- ", "<br>• ")
        content = content.replace("\n", "<br>")
        
        sections_html += f"""
        <div class="section">
            <div class="section-number">{i+1:02d}</div>
            <div class="section-body">
                <h2>{section.get('title', 'Section')}</h2>
                <div class="section-content"><p>{content}</p></div>
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
    elif doc_type == "checklist":
        doc_type_label = "COMPLIANCE CHECKLIST"
    else:
        doc_type_label = "STANDARD OPERATING PROCEDURE"
    
    created_date = ""
    if doc.get("created_at"):
        if isinstance(doc["created_at"], datetime):
            created_date = doc["created_at"].strftime("%d %B %Y")
        else:
            created_date = str(doc["created_at"])
    
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{doc.get('title', 'Document')} — Supreme Hospitality Services</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #1a1a2e;
            line-height: 1.7;
            background: #f8f7f4;
        }}
        
        .header {{
            background: linear-gradient(135deg, #0a0a14 0%, #1a1a2e 50%, #2d1b4e 100%);
            color: white;
            padding: 48px 40px 40px;
            position: relative;
            overflow: hidden;
        }}
        
        .header::before {{
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(123,45,142,0.15) 0%, transparent 70%);
            border-radius: 50%;
        }}
        
        .header::after {{
            content: '';
            position: absolute;
            bottom: -30%;
            left: -10%;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(196,162,101,0.1) 0%, transparent 70%);
            border-radius: 50%;
        }}
        
        .header-top {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
            position: relative;
            z-index: 1;
        }}
        
        .logo-area {{
            display: flex;
            align-items: center;
            gap: 16px;
        }}
        
        .logo-icon {{
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #7B2D8E, #9B4DB0);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: 900;
            color: #C4A265;
            border: 2px solid rgba(196,162,101,0.3);
        }}
        
        .company-name {{
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 3px;
            color: #C4A265;
            text-transform: uppercase;
        }}
        
        .company-sub {{
            font-size: 10px;
            color: rgba(196,162,101,0.6);
            letter-spacing: 2px;
            margin-top: 2px;
        }}
        
        .doc-ref {{
            text-align: right;
            font-size: 11px;
            color: rgba(255,255,255,0.4);
        }}
        
        .doc-ref strong {{
            color: rgba(196,162,101,0.7);
        }}
        
        .header-title {{
            position: relative;
            z-index: 1;
        }}
        
        .doc-type-badge {{
            display: inline-block;
            background: rgba(123,45,142,0.3);
            color: #d4a5e5;
            padding: 4px 16px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 2px;
            margin-bottom: 12px;
            border: 1px solid rgba(123,45,142,0.4);
        }}
        
        .header h1 {{
            font-size: 28px;
            font-weight: 800;
            line-height: 1.3;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }}
        
        .header-meta {{
            font-size: 13px;
            color: rgba(255,255,255,0.5);
            display: flex;
            gap: 24px;
            margin-top: 12px;
        }}
        
        .header-meta span {{
            display: flex;
            align-items: center;
            gap: 6px;
        }}
        
        .gold-line {{
            height: 3px;
            background: linear-gradient(90deg, #C4A265, transparent);
            margin-top: 24px;
            border-radius: 2px;
            position: relative;
            z-index: 1;
        }}
        
        .content {{
            max-width: 820px;
            margin: 0 auto;
            padding: 32px 24px;
        }}
        
        .summary {{
            background: linear-gradient(135deg, #f5f0ff, #faf8f5);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 28px;
            border-left: 4px solid #7B2D8E;
            font-size: 15px;
            color: #4a4a6a;
            font-style: italic;
            line-height: 1.8;
        }}
        
        .section {{
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }}
        
        .section-number {{
            flex-shrink: 0;
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #7B2D8E, #5a1d6e);
            color: #C4A265;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 800;
            margin-top: 4px;
        }}
        
        .section-body {{
            flex: 1;
            background: white;
            border-radius: 14px;
            padding: 24px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
            border: 1px solid #f0ede8;
        }}
        
        .section h2 {{
            font-size: 17px;
            font-weight: 700;
            color: #7B2D8E;
            margin-bottom: 14px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f5f0ff;
        }}
        
        .section-content {{
            font-size: 14px;
            color: #3a3a5a;
            line-height: 1.8;
        }}
        
        .section-content p {{
            margin-bottom: 8px;
        }}
        
        .checkbox {{
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 2px solid #7B2D8E;
            border-radius: 4px;
            margin-right: 8px;
            vertical-align: middle;
            text-align: center;
            line-height: 14px;
            font-size: 12px;
        }}
        
        .checkbox.checked {{
            background: #7B2D8E;
            color: white;
        }}
        
        .footer {{
            background: linear-gradient(135deg, #0a0a14, #1a1a2e);
            color: rgba(255,255,255,0.5);
            padding: 32px 40px;
            margin-top: 40px;
        }}
        
        .footer-content {{
            max-width: 820px;
            margin: 0 auto;
            text-align: center;
        }}
        
        .footer-brand {{
            font-size: 12px;
            font-weight: 700;
            color: #C4A265;
            letter-spacing: 3px;
            margin-bottom: 8px;
        }}
        
        .footer-confidential {{
            font-size: 11px;
            color: #E74C3C;
            font-weight: 600;
            margin-bottom: 12px;
            padding: 6px 20px;
            background: rgba(231,76,60,0.1);
            border-radius: 20px;
            display: inline-block;
        }}
        
        .footer-text {{
            font-size: 11px;
            line-height: 1.6;
            color: rgba(255,255,255,0.35);
        }}
        
        .footer-divider {{
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(196,162,101,0.2), transparent);
            margin: 16px 0;
        }}
        
        @media print {{
            body {{ background: white; }}
            .header {{ page-break-after: avoid; }}
            .section {{ page-break-inside: avoid; }}
            .section-body {{ box-shadow: none; border: 1px solid #e5e5e5; }}
            .footer {{ page-break-before: auto; }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <div class="header-top">
            <div class="logo-area">
                <div class="logo-icon">SH</div>
                <div>
                    <div class="company-name">Supreme Hospitality Services</div>
                    <div class="company-sub">Outsourced Housekeeping Excellence</div>
                </div>
            </div>
            <div class="doc-ref">
                <div><strong>Document ID:</strong> SHS-{doc.get('id', 'N/A')[:8].upper()}</div>
                <div><strong>Date:</strong> {created_date}</div>
                <div><strong>Status:</strong> {doc.get('status', 'Draft').upper()}</div>
            </div>
        </div>
        
        <div class="header-title">
            <div class="doc-type-badge">{doc_type_label}</div>
            <h1>{doc.get('title', 'Document')}</h1>
            <div class="header-meta">
                <span>📁 {category_name}</span>
                <span>📄 {len(doc.get('sections', []))} Sections</span>
                <span>📅 {created_date}</span>
            </div>
        </div>
        
        <div class="gold-line"></div>
    </div>
    
    <div class="content">
        {"<div class='summary'>" + doc.get('content', '') + "</div>" if doc.get('content') else ""}
        {sections_html}
    </div>
    
    <div class="footer">
        <div class="footer-content">
            <div class="footer-brand">SUPREME HOSPITALITY SERVICES</div>
            <div class="footer-confidential">CONFIDENTIAL — INTERNAL USE ONLY</div>
            <div class="footer-divider"></div>
            <div class="footer-text">
                This document is the property of Supreme Hospitality Services Pty Ltd.<br>
                Unauthorised reproduction, distribution, or modification is strictly prohibited.<br>
                For enquiries, contact management@supremehospitality.com.au
            </div>
            <div class="footer-divider"></div>
            <div class="footer-text">
                Generated on {created_date} | © {datetime.utcnow().year} Supreme Hospitality Services
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
