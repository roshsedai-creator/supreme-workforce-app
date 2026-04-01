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
app = FastAPI(title="Supreme Hospitality SOPs & Compliance Generator")

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
# CATEGORIES
# =====================
DOCUMENT_CATEGORIES = [
    {
        "id": "housekeeping",
        "name": "Housekeeping SOPs",
        "icon": "bed-outline",
        "color": "#6366f1",
        "description": "Standard operating procedures for housekeeping and room maintenance"
    },
    {
        "id": "food_beverage",
        "name": "Food & Beverage SOPs",
        "icon": "restaurant-outline",
        "color": "#ec4899",
        "description": "Procedures for food handling, kitchen operations, and beverage service"
    },
    {
        "id": "front_office",
        "name": "Front Office SOPs",
        "icon": "desktop-outline",
        "color": "#f59e0b",
        "description": "Check-in, check-out, reservations, and guest services procedures"
    },
    {
        "id": "health_safety",
        "name": "Health & Safety Compliance",
        "icon": "medkit-outline",
        "color": "#10b981",
        "description": "Workplace health and safety standards and compliance checklists"
    },
    {
        "id": "fire_safety",
        "name": "Fire Safety",
        "icon": "flame-outline",
        "color": "#ef4444",
        "description": "Fire prevention, evacuation procedures, and emergency protocols"
    },
    {
        "id": "hr_employment",
        "name": "HR & Employment",
        "icon": "people-outline",
        "color": "#8b5cf6",
        "description": "Employment compliance, onboarding, training, and HR procedures"
    },
    {
        "id": "general_operations",
        "name": "General Operations",
        "icon": "settings-outline",
        "color": "#06b6d4",
        "description": "General operational procedures, maintenance, and facility management"
    },
    {
        "id": "guest_experience",
        "name": "Guest Experience",
        "icon": "star-outline",
        "color": "#f97316",
        "description": "Guest satisfaction, complaint handling, and service excellence standards"
    }
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
    sections: list = []  # [{title, content, order}]

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
    document_type: str  # "sop" or "checklist"
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
    # Check for existing user
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
    """Generate an SOP or Compliance document using AI"""
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
        
        doc_type_label = "Standard Operating Procedure (SOP)" if request.document_type == "sop" else "Compliance Checklist"
        
        system_message = f"""You are an expert hospitality industry consultant specializing in creating professional {doc_type_label} documents for hotels and hospitality businesses.

You create documents for Supreme Hospitality, a premium hospitality management company.

Your documents must be:
- Professional and industry-standard
- Compliant with Australian hospitality regulations and Work Health & Safety (WHS) standards
- Practical and actionable for hotel staff
- Well-structured with clear sections, steps, and responsibilities

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

Include approximately {request.sections_count} sections. Each section should be comprehensive with actionable steps.
{"For checklists, format content as checkbox items using - [ ] prefix for each item." if request.document_type == "checklist" else "For SOPs, include numbered steps, responsibilities, and any relevant safety notes."}"""
        
        user_prompt = f"""Create a professional {doc_type_label} document{site_context}.

Category: {category_name}
Title: {request.title}
{"Additional Requirements: " + request.specific_requirements if request.specific_requirements else ""}

Generate a comprehensive, industry-standard document with detailed, actionable content. Return ONLY the JSON object, no additional text."""

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
        
        # Clean response - remove markdown code blocks if present
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
            # If JSON parsing fails, create a structured document from raw text
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
    
    # Get category counts
    category_counts = {}
    for cat in DOCUMENT_CATEGORIES:
        count = await db.documents.count_documents({"category": cat["id"]})
        category_counts[cat["id"]] = count
    
    # Recent documents
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
# DOCUMENT EXPORT (HTML)
# =====================

@api_router.get("/documents/{doc_id}/export")
async def export_document(doc_id: str):
    """Export document as branded HTML"""
    doc = await db.documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = serialize_doc(doc)
    
    # Build HTML
    sections_html = ""
    for i, section in enumerate(doc.get("sections", [])):
        content = section.get("content", "").replace("\n", "<br>")
        sections_html += f"""
        <div class="section">
            <h2>{i+1}. {section.get('title', 'Section')}</h2>
            <div class="section-content">{content}</div>
        </div>"""
    
    # Get category name
    category_name = doc.get("category", "")
    for cat in DOCUMENT_CATEGORIES:
        if cat["id"] == doc.get("category"):
            category_name = cat["name"]
            break
    
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
    <title>{doc.get('title', 'Document')}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.6; background: #f9fafb; }}
        .header {{ background: linear-gradient(135deg, #0f0f23, #1a1a3e); color: white; padding: 40px 32px; text-align: center; }}
        .header h1 {{ font-size: 28px; margin-bottom: 8px; font-weight: 800; }}
        .header .brand {{ font-size: 18px; color: #a5b4fc; margin-bottom: 4px; }}
        .header .meta {{ font-size: 14px; color: #c7d2fe; }}
        .badge {{ display: inline-block; background: rgba(99,102,241,0.3); color: #c7d2fe; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-top: 12px; }}
        .content {{ max-width: 800px; margin: 0 auto; padding: 32px 24px; }}
        .section {{ background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #6366f1; }}
        .section h2 {{ font-size: 18px; color: #6366f1; margin-bottom: 12px; font-weight: 700; }}
        .section-content {{ font-size: 14px; color: #374151; }}
        .footer {{ text-align: center; padding: 24px; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; margin-top: 32px; }}
        .footer .confidential {{ color: #ef4444; font-weight: 600; margin-bottom: 4px; }}
        @media print {{
            body {{ background: white; }}
            .section {{ box-shadow: none; border: 1px solid #e5e7eb; page-break-inside: avoid; }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">SUPREME HOSPITALITY</div>
        <h1>{doc.get('title', 'Document')}</h1>
        <div class="meta">{category_name} | {created_date}</div>
        <span class="badge">{doc.get('document_type', 'SOP').upper()}</span>
    </div>
    <div class="content">
        {sections_html}
    </div>
    <div class="footer">
        <div class="confidential">CONFIDENTIAL — SUPREME HOSPITALITY</div>
        <div>This document is the property of Supreme Hospitality. Unauthorized distribution is prohibited.</div>
        <div>Generated on {created_date}</div>
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
    """Seed initial data for the app"""
    # Check if admin exists
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
        "message": "Supreme Hospitality SOPs & Compliance Generator API",
        "version": "2.0.0"
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
    """Seed data on startup"""
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
