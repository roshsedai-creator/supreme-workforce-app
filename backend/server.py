from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import resend


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure Resend API
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Company email - where enquiries are sent
COMPANY_EMAIL = os.environ.get('COMPANY_EMAIL', 'info@supremehospitality.com.au')

# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Contact Form Model
class ContactForm(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    message: str

# Quote Form Model
class QuoteForm(BaseModel):
    businessName: str
    contactName: str
    email: EmailStr
    phone: str
    industry: str
    numberOfRooms: Optional[str] = None
    servicesRequired: List[str] = []
    additionalInfo: Optional[str] = None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.post("/contact")
async def submit_contact_form(form: ContactForm):
    """Handle contact form submission and store in database"""
    try:
        # Store in database
        contact_doc = {
            "id": str(uuid.uuid4()),
            "name": form.name,
            "email": form.email,
            "phone": form.phone,
            "company": form.company,
            "message": form.message,
            "type": "contact",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "new"
        }
        await db.enquiries.insert_one(contact_doc)
        
        logger.info(f"Contact form submitted by {form.name} ({form.email})")
        
        return {
            "success": True,
            "message": "Thank you for your enquiry. Our team will contact you shortly.",
            "reference": contact_doc["id"]
        }
    except Exception as e:
        logger.error(f"Error processing contact form: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit enquiry. Please try again.")

@api_router.post("/quote")
async def submit_quote_form(form: QuoteForm):
    """Handle quote request submission and store in database"""
    try:
        # Store in database
        quote_doc = {
            "id": str(uuid.uuid4()),
            "businessName": form.businessName,
            "contactName": form.contactName,
            "email": form.email,
            "phone": form.phone,
            "industry": form.industry,
            "numberOfRooms": form.numberOfRooms,
            "servicesRequired": form.servicesRequired,
            "additionalInfo": form.additionalInfo,
            "type": "quote",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "new"
        }
        await db.enquiries.insert_one(quote_doc)
        
        logger.info(f"Quote request submitted by {form.contactName} from {form.businessName}")
        
        return {
            "success": True,
            "message": "Thank you for your quote request. Our team will review your requirements and contact you within 24-48 hours.",
            "reference": quote_doc["id"]
        }
    except Exception as e:
        logger.error(f"Error processing quote form: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit quote request. Please try again.")

@api_router.get("/enquiries")
async def get_enquiries():
    """Get all enquiries (for admin purposes)"""
    enquiries = await db.enquiries.find({}, {"_id": 0}).to_list(1000)
    return enquiries

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()