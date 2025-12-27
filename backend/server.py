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
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure Resend API
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Configure LLM for chatbot
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Company email - where enquiries are sent
COMPANY_EMAIL = os.environ.get('COMPANY_EMAIL', 'info@supremehospitality.com.au')

# Chatbot system message
CHATBOT_SYSTEM_MESSAGE = """You are a helpful customer service assistant for Supreme Hospitality Services, a premium hospitality cleaning and housekeeping company based in Melbourne, Australia.

About Supreme Hospitality Services:
- Phone: 03 9221 6236
- Email: info@supremehospitality.com.au
- Address: Level 27, 101 Collins St, Melbourne 3000
- Team: 500+ trained professionals
- Clients: 20+ including Accor, Novotel, Quest, Ibis, and more
- Services: 700+ service hours delivered weekly

Our Services:
1. Hotel & Resort Housekeeping - Daily room servicing, turndown service, deep cleaning, linen management
2. Commercial Facility Cleaning - Office cleaning, retail spaces, sanitization
3. Educational & Student Living - University and student accommodation cleaning
4. Kitchen Stewarding - Dishwashing, equipment cleaning, hygiene compliance
5. Healthcare Facility Support - Aged care, hospitals with infection control
6. Serviced Apartments - Guest turnovers, linen services

Key Features:
- $20M Public Liability Insurance
- ISSA Certified Professionals
- ISO 9001 Quality Standards
- Eco-Friendly Green Cleaning
- 24/7 Availability
- 99% Client Satisfaction Rate

Be friendly, professional, and helpful. If someone wants a quote, direct them to the Get a Quote page or offer to have someone call them back. Keep responses concise but informative."""

# Store chat sessions in memory (for production, use database)
chat_sessions = {}

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
    """Handle contact form submission, store in database and send email"""
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
        
        # Send email notification via Resend
        if resend.api_key:
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #703493;">New Contact Form Submission</h2>
                <hr style="border: 1px solid #D4B37A;">
                <p><strong>Name:</strong> {form.name}</p>
                <p><strong>Email:</strong> {form.email}</p>
                <p><strong>Phone:</strong> {form.phone or 'Not provided'}</p>
                <p><strong>Company:</strong> {form.company or 'Not provided'}</p>
                <h3 style="color: #703493;">Message:</h3>
                <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">{form.message}</p>
                <hr style="border: 1px solid #D4B37A;">
                <p style="color: #666; font-size: 12px;">This email was sent from the Supreme Hospitality Services contact form.</p>
            </div>
            """
            
            params = {
                "from": SENDER_EMAIL,
                "to": [COMPANY_EMAIL],
                "subject": f"New Contact Enquiry from {form.name}",
                "html": html_content,
                "reply_to": form.email
            }
            
            try:
                # Run sync SDK in thread to keep FastAPI non-blocking
                await asyncio.to_thread(resend.Emails.send, params)
                logger.info(f"Email sent successfully for contact form from {form.name}")
            except Exception as email_error:
                logger.error(f"Failed to send email: {str(email_error)}")
                # Don't fail the request if email fails - data is still stored
        else:
            logger.warning("RESEND_API_KEY not configured - email not sent")
        
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
    """Handle quote request submission, store in database and send email"""
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
        
        # Send email notification via Resend
        if resend.api_key:
            services_list = ', '.join(form.servicesRequired) if form.servicesRequired else 'Not specified'
            
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #703493;">New Quote Request</h2>
                <hr style="border: 1px solid #D4B37A;">
                <h3 style="color: #703493;">Business Details</h3>
                <p><strong>Business Name:</strong> {form.businessName}</p>
                <p><strong>Contact Name:</strong> {form.contactName}</p>
                <p><strong>Email:</strong> {form.email}</p>
                <p><strong>Phone:</strong> {form.phone}</p>
                <p><strong>Industry:</strong> {form.industry}</p>
                <p><strong>Number of Rooms:</strong> {form.numberOfRooms or 'Not specified'}</p>
                <h3 style="color: #703493;">Services Required</h3>
                <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">{services_list}</p>
                <h3 style="color: #703493;">Additional Information</h3>
                <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">{form.additionalInfo or 'None provided'}</p>
                <hr style="border: 1px solid #D4B37A;">
                <p style="color: #666; font-size: 12px;">This quote request was sent from the Supreme Hospitality Services website.</p>
            </div>
            """
            
            params = {
                "from": SENDER_EMAIL,
                "to": [COMPANY_EMAIL],
                "subject": f"New Quote Request from {form.businessName}",
                "html": html_content,
                "reply_to": form.email
            }
            
            try:
                # Run sync SDK in thread to keep FastAPI non-blocking
                await asyncio.to_thread(resend.Emails.send, params)
                logger.info(f"Email sent successfully for quote request from {form.businessName}")
            except Exception as email_error:
                logger.error(f"Failed to send email: {str(email_error)}")
                # Don't fail the request if email fails - data is still stored
        else:
            logger.warning("RESEND_API_KEY not configured - email not sent")
        
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

# Chatbot Models
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(chat_message: ChatMessage):
    """AI-powered chatbot endpoint"""
    try:
        # Generate or use existing session ID
        session_id = chat_message.session_id or str(uuid.uuid4())
        
        # Get or create chat session
        if session_id not in chat_sessions:
            chat_sessions[session_id] = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=session_id,
                system_message=CHATBOT_SYSTEM_MESSAGE
            ).with_model("openai", "gpt-4o-mini")
        
        chat = chat_sessions[session_id]
        
        # Create user message and get response
        user_message = UserMessage(text=chat_message.message)
        response = await chat.send_message(user_message)
        
        # Store chat in database for analytics
        chat_doc = {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "user_message": chat_message.message,
            "bot_response": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_history.insert_one(chat_doc)
        
        logger.info(f"Chat response generated for session {session_id}")
        
        return ChatResponse(response=response, session_id=session_id)
        
    except Exception as e:
        logger.error(f"Error in chatbot: {str(e)}")
        # Return a fallback response
        return ChatResponse(
            response="I apologize, but I'm having trouble right now. Please call us at 03 9221 6236 or email info@supremehospitality.com.au for immediate assistance.",
            session_id=chat_message.session_id or str(uuid.uuid4())
        )

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