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
# MARKDOWN TO HTML CONVERTER
# =====================

import re

def markdown_to_html(text: str) -> str:
    """Convert markdown content to premium HTML with proper table support."""
    if not text:
        return ""
    
    lines = text.split('\n')
    html_parts = []
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Empty lines
        if not line:
            i += 1
            continue
        
        # Tables: detect rows starting with |
        if line.startswith('|') and '|' in line[1:]:
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                table_lines.append(lines[i].strip())
                i += 1
            html_parts.append(_parse_table(table_lines))
            continue
        
        # Headers
        if line.startswith('### '):
            html_parts.append(f'<h4>{_inline_format(line[4:])}</h4>')
            i += 1
            continue
        if line.startswith('## '):
            html_parts.append(f'<h3>{_inline_format(line[3:])}</h3>')
            i += 1
            continue
        if line.startswith('# '):
            html_parts.append(f'<h3>{_inline_format(line[2:])}</h3>')
            i += 1
            continue
        
        # Checkbox items
        if line.startswith('- [ ] '):
            html_parts.append(f'<div class="check-item"><span class="check-box">☐</span> {_inline_format(line[6:])}</div>')
            i += 1
            continue
        if line.startswith('- [x] ') or line.startswith('- [X] '):
            html_parts.append(f'<div class="check-item checked"><span class="check-box checked">☑</span> {_inline_format(line[6:])}</div>')
            i += 1
            continue
        
        # Bullet lists
        if line.startswith('- ') or line.startswith('• '):
            html_parts.append(f'<div class="list-item"><span class="bullet">●</span> {_inline_format(line[2:])}</div>')
            i += 1
            continue
        
        # Numbered lists
        num_match = re.match(r'^(\d+)\.\s+(.+)', line)
        if num_match:
            html_parts.append(f'<div class="num-item"><span class="num-badge">{num_match.group(1)}</span> {_inline_format(num_match.group(2))}</div>')
            i += 1
            continue
        
        # Regular paragraph
        html_parts.append(f'<p>{_inline_format(line)}</p>')
        i += 1
    
    return '\n'.join(html_parts)

def _inline_format(text: str) -> str:
    """Handle bold, italic inline formatting."""
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
    return text

def _parse_table(table_lines: list) -> str:
    """Convert markdown table lines to HTML table."""
    rows = []
    header = None
    
    for line in table_lines:
        # Skip separator rows (|---|---|)
        if re.match(r'^\|[\s\-:]+\|$', line.replace(' ', '')):
            continue
        
        cells = [c.strip() for c in line.split('|') if c.strip() or line.startswith('|')]
        # Remove empty first/last from split
        if line.startswith('|'):
            cells = [c.strip() for c in line.split('|')[1:-1]]
        
        if cells:
            if header is None:
                header = cells
            else:
                rows.append(cells)
    
    if not header:
        return ""
    
    # Build HTML table
    th_html = ''.join(f'<th>{_inline_format(h)}</th>' for h in header)
    tbody = ''
    for row in rows:
        td_html = ''
        for j, h in enumerate(header):
            val = row[j] if j < len(row) else '—'
            td_html += f'<td>{_inline_format(val)}</td>'
        tbody += f'<tr>{td_html}</tr>'
    
    return f'''<div class="table-wrap">
        <table>
            <thead><tr>{th_html}</tr></thead>
            <tbody>{tbody}</tbody>
        </table>
    </div>'''

# =====================
# DOCUMENT EXPORT (HTML) — Premium branded with PDF support
# =====================

@api_router.get("/documents/{doc_id}/export")
async def export_document(doc_id: str):
    """Export document as premium branded HTML with Save as PDF"""
    doc = await db.documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = serialize_doc(doc)
    
    # Build sections HTML with proper markdown parsing
    sections_html = ""
    for i, section in enumerate(doc.get("sections", [])):
        content = section.get("content", "")
        parsed_content = markdown_to_html(content)
        
        sections_html += f"""
        <div class="section">
            <div class="section-number">{i+1:02d}</div>
            <div class="section-body">
                <h2>{section.get('title', 'Section')}</h2>
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
    <title>{doc.get('title', 'Document')} — Supreme Compliance</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #1a1a2e;
            line-height: 1.7;
            background: #f8f7f4;
        }}
        
        /* Save as PDF toolbar */
        .toolbar {{
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 100;
            background: #0a0a14;
            padding: 12px 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 16px;
            border-bottom: 1px solid rgba(196,162,101,0.2);
        }}
        
        .toolbar-text {{
            color: #C4A265;
            font-size: 13px;
            font-weight: 600;
        }}
        
        .pdf-btn {{
            background: linear-gradient(135deg, #7B2D8E, #9B4DB0);
            color: white;
            border: none;
            padding: 10px 28px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'Inter', sans-serif;
        }}
        
        .pdf-btn:hover {{
            opacity: 0.9;
        }}
        
        .toolbar-spacer {{
            height: 56px;
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
        
        .doc-ref strong {{ color: rgba(196,162,101,0.7); }}
        
        .header-title {{ position: relative; z-index: 1; }}
        
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
        }}
        
        .header-meta {{
            font-size: 13px;
            color: rgba(255,255,255,0.5);
            display: flex;
            gap: 24px;
            margin-top: 12px;
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
        
        .section-content p {{ margin-bottom: 8px; }}
        .section-content h3 {{ font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 14px 0 8px; }}
        .section-content h4 {{ font-size: 14px; font-weight: 600; color: #374151; margin: 10px 0 6px; }}
        
        /* Tables */
        .table-wrap {{
            margin: 16px 0;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid #e5e0d8;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }}
        
        thead tr {{
            background: linear-gradient(135deg, #7B2D8E, #5a1d6e);
        }}
        
        th {{
            color: white;
            padding: 10px 14px;
            text-align: left;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-right: 1px solid rgba(255,255,255,0.15);
        }}
        
        th:last-child {{ border-right: none; }}
        
        td {{
            padding: 10px 14px;
            border-bottom: 1px solid #f0ede8;
            border-right: 1px solid #f0ede8;
            color: #3a3a5a;
        }}
        
        td:last-child {{ border-right: none; }}
        
        tbody tr:nth-child(even) {{ background: #faf8f5; }}
        tbody tr:nth-child(odd) {{ background: white; }}
        tbody tr:last-child td {{ border-bottom: none; }}
        
        /* Lists */
        .list-item {{
            padding: 4px 0 4px 8px;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }}
        
        .bullet {{
            color: #7B2D8E;
            font-size: 8px;
            margin-top: 6px;
            flex-shrink: 0;
        }}
        
        .num-item {{
            padding: 4px 0;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }}
        
        .num-badge {{
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 24px;
            height: 24px;
            background: rgba(123,45,142,0.1);
            color: #7B2D8E;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            flex-shrink: 0;
            margin-top: 2px;
        }}
        
        /* Checkboxes */
        .check-item {{
            padding: 6px 0 6px 8px;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }}
        
        .check-box {{
            display: inline-flex;
            width: 20px;
            height: 20px;
            border: 2px solid #7B2D8E;
            border-radius: 4px;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            flex-shrink: 0;
            margin-top: 2px;
        }}
        
        .check-box.checked {{
            background: #7B2D8E;
            color: white;
        }}
        
        .check-item.checked {{ color: #9ca3af; }}
        
        /* Footer */
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
            .toolbar {{ display: none !important; }}
            .toolbar-spacer {{ display: none !important; }}
            body {{ background: white; }}
            .header {{ page-break-after: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
            .section {{ page-break-inside: avoid; }}
            .section-body {{ box-shadow: none; border: 1px solid #e5e5e5; }}
            .section-number {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
            thead tr {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
            .doc-type-badge {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
            .footer {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; page-break-before: auto; }}
            .gold-line {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
        }}
    </style>
</head>
<body>
    <!-- Save as PDF Toolbar -->
    <div class="toolbar">
        <span class="toolbar-text">Supreme Compliance — {doc.get('title', 'Document')}</span>
        <button class="pdf-btn" onclick="window.print()">
            📥 Save as PDF
        </button>
    </div>
    <div class="toolbar-spacer"></div>

    <div class="header">
        <div class="header-top">
            <div class="logo-area">
                <div class="logo-icon">SH</div>
                <div>
                    <div class="company-name">SUPREME COMPLIANCE</div>
                    <div class="company-sub">Supreme Hospitality Services</div>
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
            <div class="footer-brand">SUPREME COMPLIANCE</div>
            <div class="footer-confidential">CONFIDENTIAL — INTERNAL USE ONLY</div>
            <div class="footer-divider"></div>
            <div class="footer-text">
                This document is the property of Supreme Hospitality Services Pty Ltd.<br>
                Unauthorised reproduction, distribution, or modification is strictly prohibited.<br>
                For enquiries, contact management@supremehospitality.com.au
            </div>
            <div class="footer-divider"></div>
            <div class="footer-text">
                Generated on {created_date} | © {datetime.utcnow().year} Supreme Compliance
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
