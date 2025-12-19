from fastapi import FastAPI, APIRouter, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import bcrypt
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper to convert ObjectId to string
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

# Australian Public Holidays 2024-2025
AUSTRALIAN_PUBLIC_HOLIDAYS = {
    # 2024
    "2024-01-01": "New Year's Day",
    "2024-01-26": "Australia Day",
    "2024-03-29": "Good Friday",
    "2024-03-30": "Easter Saturday",
    "2024-04-01": "Easter Monday",
    "2024-04-25": "ANZAC Day",
    "2024-06-10": "Queen's Birthday",
    "2024-12-25": "Christmas Day",
    "2024-12-26": "Boxing Day",
    
    # 2025
    "2025-01-01": "New Year's Day",
    "2025-01-26": "Australia Day",
    "2025-01-27": "Australia Day (observed)",
    "2025-04-18": "Good Friday",
    "2025-04-19": "Easter Saturday",
    "2025-04-21": "Easter Monday",
    "2025-04-25": "ANZAC Day",
    "2025-06-09": "Queen's Birthday",
    "2025-12-25": "Christmas Day",
    "2025-12-26": "Boxing Day",
    
    # 2026
    "2026-01-01": "New Year's Day",
    "2026-01-26": "Australia Day",
    "2026-04-03": "Good Friday",
    "2026-04-04": "Easter Saturday",
    "2026-04-06": "Easter Monday",
    "2026-04-25": "ANZAC Day",
    "2026-06-08": "Queen's Birthday",
    "2026-12-25": "Christmas Day",
    "2026-12-26": "Boxing Day",
}

def is_public_holiday(date: datetime) -> tuple[bool, str]:
    """
    Check if a date is a public holiday
    Returns: (is_holiday, holiday_name)
    """
    date_str = date.strftime("%Y-%m-%d")
    if date_str in AUSTRALIAN_PUBLIC_HOLIDAYS:
        return (True, AUSTRALIAN_PUBLIC_HOLIDAYS[date_str])
    return (False, "")

def calculate_pay_rate_with_holiday(base_rate: float, date: datetime, hours: float) -> dict:
    """
    Calculate pay considering public holidays
    Public holidays typically get 2.5x pay rate
    """
    is_holiday, holiday_name = is_public_holiday(date)
    
    if is_holiday:
        multiplier = 2.5  # Public holiday rate
        total_pay = base_rate * multiplier * hours
        return {
            "base_rate": base_rate,
            "multiplier": multiplier,
            "effective_rate": base_rate * multiplier,
            "hours": hours,
            "total_pay": round(total_pay, 2),
            "is_public_holiday": True,
            "holiday_name": holiday_name
        }
    else:
        # Regular rate
        total_pay = base_rate * hours
        return {
            "base_rate": base_rate,
            "multiplier": 1.0,
            "effective_rate": base_rate,
            "hours": hours,
            "total_pay": round(total_pay, 2),
            "is_public_holiday": False,
            "holiday_name": ""
        }

def get_default_permissions(role: str) -> dict:
    """Get default permissions based on user role"""
    if role == "admin":
        return {
            "view_home": True,
            "view_own_timesheets": True,
            "clock_in_out": True,
            "view_roster": True,
            "request_time_off": True,
            "view_own_pay": True,
            "view_all_timesheets": True,
            "edit_timesheets": True,
            "approve_timesheets": True,
            "manage_roster": True,
            "view_reports": True,
            "manage_users": True,
            "manage_sites": True,
            "export_payroll": True,
            "manage_permissions": True,
        }
    elif role == "supervisor":
        return {
            "view_home": True,
            "view_own_timesheets": True,
            "clock_in_out": True,
            "view_roster": True,
            "request_time_off": True,
            "view_own_pay": True,
            "view_all_timesheets": True,
            "edit_timesheets": True,
            "approve_timesheets": True,
            "manage_roster": True,
            "view_reports": True,
            "manage_users": False,
            "manage_sites": False,
            "export_payroll": False,
            "manage_permissions": False,
        }
    else:  # employee / room attendant
        return {
            "view_home": True,
            "view_own_timesheets": True,
            "clock_in_out": True,
            "view_roster": False,  # Can be enabled by admin
            "request_time_off": False,  # Can be enabled by admin
            "view_own_pay": False,  # Can be enabled by admin
            "view_all_timesheets": False,
            "edit_timesheets": False,
            "approve_timesheets": False,
            "manage_roster": False,
            "view_reports": False,
            "manage_users": False,
            "manage_sites": False,
            "export_payroll": False,
            "manage_permissions": False,
        }

# =====================
# MODELS
# =====================

class UserRole(BaseModel):
    id: str
    name: str  # Room Attendant, Houseman, Supervisor, Public Area Attendant, Admin
    
class Site(BaseModel):
    id: Optional[str] = None
    name: str
    address: str
    gps_lat: float
    gps_long: float
    radius_meters: int = 100  # GPS validation radius

class SiteCreate(BaseModel):
    name: str
    address: str
    gps_lat: float
    gps_long: float
    radius_meters: int = 100

class BankDetails(BaseModel):
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    bsb: Optional[str] = None
    account_number: Optional[str] = None

class User(BaseModel):
    id: Optional[str] = None
    first_name: str
    last_name: str
    phone: str
    email: EmailStr
    role: str  # employee, supervisor, admin
    job_title: str  # Room Attendant, Houseman, etc.
    site_id: Optional[str] = None
    award_level: int = 1
    pin: str  # Mock PIN for authentication
    status: str = "active"  # active, inactive
    permissions: dict = {
        "view_home": True,  # Everyone can see home
        "view_own_timesheets": True,  # View own timesheet data
        "clock_in_out": True,  # Can clock in/out
        "view_roster": False,  # Can view roster schedule
        "request_time_off": False,  # Can request time off
        "view_own_pay": False,  # View own pay details
        "view_all_timesheets": False,  # Supervisor: see all timesheets
        "edit_timesheets": False,  # Supervisor: edit timesheets
        "approve_timesheets": False,  # Supervisor: approve timesheets
        "manage_roster": False,  # Supervisor: create/edit roster
        "view_reports": False,  # Supervisor: view reports
        "manage_users": False,  # Admin: manage employees
        "manage_sites": False,  # Admin: manage sites
        "export_payroll": False,  # Admin: export payroll
        "manage_permissions": False,  # Admin: manage user permissions
    }
    bank_details: Optional[BankDetails] = None
    created_at: Optional[datetime] = None

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: EmailStr
    role: str
    job_title: str
    site_id: Optional[str] = None
    award_level: int = 1
    pin: str
    abn: Optional[str] = None
    is_contractor: bool = False

class LoginRequest(BaseModel):
    identifier: str  # phone or email
    pin: str

class Shift(BaseModel):
    id: Optional[str] = None
    employee_id: str
    site_id: str
    start_time: datetime
    end_time: datetime
    status: str = "scheduled"  # scheduled, in_progress, completed, cancelled
    created_at: Optional[datetime] = None

class ShiftCreate(BaseModel):
    employee_id: str
    site_id: str
    start_time: datetime
    end_time: datetime

class Timesheet(BaseModel):
    id: Optional[str] = None
    shift_id: str
    employee_id: str
    site_id: str
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    gps_in_lat: Optional[float] = None
    gps_in_long: Optional[float] = None
    gps_out_lat: Optional[float] = None
    gps_out_long: Optional[float] = None
    break_start: Optional[datetime] = None
    break_end: Optional[datetime] = None
    break_minutes: int = 0
    total_hours: float = 0.0
    total_pay: float = 0.0
    supervisor_id: Optional[str] = None
    approval_status: str = "pending"  # pending, approved, rejected
    notes: Optional[str] = None
    employee_notes: Optional[str] = None
    photo_base64: Optional[str] = None
    created_at: Optional[datetime] = None

class ClockInRequest(BaseModel):
    employee_id: str
    site_id: str
    gps_lat: float
    gps_long: float

class ClockOutRequest(BaseModel):
    timesheet_id: str
    gps_lat: float
    gps_long: float

class BreakRequest(BaseModel):
    timesheet_id: str
    action: str  # start or end

class ApprovalRequest(BaseModel):
    timesheet_id: str
    supervisor_id: str
    status: str  # approved or rejected
    notes: Optional[str] = None
    signature: Optional[str] = None  # Base64 encoded signature image

class TimesheetUpdateRequest(BaseModel):
    employee_notes: Optional[str] = None
    photo_base64: Optional[str] = None
    manual_clock_in: Optional[str] = None  # ISO datetime string
    manual_clock_out: Optional[str] = None  # ISO datetime string
    manual_break_minutes: Optional[int] = None

class LeaveRequest(BaseModel):
    id: Optional[str] = None
    employee_id: str
    type: str  # annual, sick, unpaid
    start_date: datetime
    end_date: datetime
    reason: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected
    approved_by: Optional[str] = None
    created_at: Optional[datetime] = None

class LeaveRequestCreate(BaseModel):
    employee_id: str
    type: str
    start_date: datetime
    end_date: datetime
    reason: Optional[str] = None

class PayRate(BaseModel):
    id: Optional[str] = None
    award_level: int
    weekday_rate: float
    saturday_rate: float
    sunday_rate: float
    public_holiday_rate: float
    overtime_rate: float

class PayRateCreate(BaseModel):
    award_level: int
    weekday_rate: float
    saturday_rate: float
    sunday_rate: float
    public_holiday_rate: float
    overtime_rate: float

class PayrollExportRequest(BaseModel):
    start_date: datetime
    end_date: datetime
    site_id: Optional[str] = None

# Roster models
class RosterShift(BaseModel):
    id: Optional[str] = None
    employee_id: str
    site_id: str
    role: str  # job title
    shift_type: str = "work"  # work, rdo, sick, annual, other
    start_time: datetime
    end_time: datetime
    status: str = "scheduled"  # scheduled, completed, cancelled
    created_by: str  # supervisor or admin id
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class RosterShiftCreate(BaseModel):
    employee_id: str
    site_id: str
    role: str
    shift_type: str = "work"  # work, rdo, sick, annual, other
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None

class EmployeeAvailability(BaseModel):
    id: Optional[str] = None
    employee_id: str
    day_of_week: int  # 0=Monday, 6=Sunday
    available: bool
    start_time: Optional[str] = None  # "09:00"
    end_time: Optional[str] = None  # "17:00"
    created_at: Optional[datetime] = None

class AvailabilityUpdate(BaseModel):
    employee_id: str
    availability: List[dict]  # [{ day: 0, available: true, start: "09:00", end: "17:00" }]

class UnavailableDate(BaseModel):
    id: Optional[str] = None
    employee_id: str
    date: datetime
    reason: Optional[str] = None
    created_at: Optional[datetime] = None

class UnavailableDateCreate(BaseModel):
    employee_id: str
    date: datetime
    reason: Optional[str] = None

# Shift swap models
class ShiftSwapRequest(BaseModel):
    id: Optional[str] = None
    shift_id: str
    from_employee_id: str
    to_employee_id: str
    status: str = "pending"  # pending, approved, rejected
    reason: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ShiftSwapCreate(BaseModel):
    shift_id: str
    from_employee_id: str
    to_employee_id: str
    reason: Optional[str] = None

class ShiftSwapAction(BaseModel):
    swap_id: str
    action: str  # approve or reject
    approved_by: str

# Recurring shift template models
class RecurringShiftTemplate(BaseModel):
    id: Optional[str] = None
    name: str
    employee_id: str
    site_id: str
    role: str
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str  # "08:00"
    end_time: str  # "16:00"
    active: bool = True
    created_by: str
    created_at: Optional[datetime] = None

class RecurringTemplateCreate(BaseModel):
    name: str
    employee_id: str
    site_id: str
    role: str
    day_of_week: int
    start_time: str
    end_time: str

# =====================
# AUTH ENDPOINTS
# =====================

@api_router.post("/auth/login")
async def login(request: LoginRequest):
    """Mock login with PIN"""
    user = await db.users.find_one({
        "$or": [
            {"phone": request.identifier},
            {"email": request.identifier}
        ],
        "status": "active"
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check PIN (in production, use bcrypt)
    if user.get("pin") != request.pin:
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    user = serialize_doc(user)
    return {
        "success": True,
        "user": user,
        "token": f"mock_token_{user['id']}"
    }

@api_router.post("/auth/request-otp")
async def request_otp(phone: str):
    """Request OTP for login (Mock - prints to console)"""
    from otp_service import generate_otp
    
    # Check if user exists
    user = await db.users.find_one({"phone": phone, "status": "active"})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    otp = generate_otp(phone)
    
    return {
        "success": True,
        "message": f"OTP sent to {phone} (Check console for mock OTP)",
        "otp_for_testing": otp  # Remove in production!
    }

@api_router.post("/auth/verify-otp")
async def verify_otp_login(phone: str, otp: str):
    """Verify OTP and login"""
    from otp_service import verify_otp
    
    if not verify_otp(phone, otp):
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")
    
    user = await db.users.find_one({"phone": phone, "status": "active"})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = serialize_doc(user)
    return {
        "success": True,
        "user": user,
        "token": f"otp_token_{user['id']}"
    }

@api_router.post("/auth/register")
async def employee_self_register(registration: dict):
    """Employee self-registration endpoint"""
    # Check if this is an invitation-based registration
    invitation_data = None
    if registration.get("token"):
        invitation = await db.invitations.find_one({"token": registration["token"]})
        if not invitation:
            raise HTTPException(status_code=404, detail="Invalid invitation token")
        
        if invitation.get("status") == "accepted":
            raise HTTPException(status_code=400, detail="Invitation has already been used")
        
        if invitation.get("expires_at") and invitation["expires_at"] < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Invitation has expired")
        
        invitation_data = invitation
    
    # Validate required fields
    required_fields = ["first_name", "last_name", "phone", "email", "pin"]
    for field in required_fields:
        if not registration.get(field):
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # Check if phone already exists
    existing_user = await db.users.find_one({"phone": registration["phone"]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Check if email already exists
    existing_email = await db.users.find_one({"email": registration["email"]})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user account
    role = invitation_data.get("role", "employee") if invitation_data else "employee"
    
    # Get site_id from invitation or registration, or default to first available site
    site_id = None
    if invitation_data:
        site_id = invitation_data.get("site_id")
    elif registration.get("site_id"):
        site_id = registration.get("site_id")
    else:
        # Assign to first available site for self-registering employees
        default_site = await db.sites.find_one()
        if default_site:
            site_id = str(default_site["_id"])
    
    user_dict = {
        "first_name": registration["first_name"],
        "last_name": registration["last_name"],
        "phone": registration["phone"],
        "email": registration["email"],
        "pin": registration["pin"],
        "role": role,
        "job_title": invitation_data.get("job_title", registration.get("job_title", "")) if invitation_data else registration.get("job_title", "Employee"),
        "site_id": site_id,
        "award_level": registration.get("award_level", 1),
        "bank_details": None,
        "is_contractor": False,
        "status": "active",
        "permissions": get_default_permissions(role),
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    del user_dict["_id"]
    
    # Mark invitation as accepted if it was used
    if invitation_data:
        await db.invitations.update_one(
            {"_id": invitation_data["_id"]},
            {"$set": {"status": "accepted", "accepted_at": datetime.utcnow()}}
        )
    
    return {
        "success": True,
        "message": "Registration successful! You can now login.",
        "user": user_dict
    }

# =====================
# USER ENDPOINTS
# =====================

@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    user_dict = user.model_dump()
    user_dict["created_at"] = datetime.utcnow()
    user_dict["status"] = "active"
    
    # Set default permissions based on role
    role = user_dict.get("role", "employee")
    user_dict["permissions"] = get_default_permissions(role)
    
    result = await db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    
    return User(**user_dict)

@api_router.get("/users")
async def get_users(role: Optional[str] = None, site_id: Optional[str] = None):
    query = {"status": "active"}
    if role:
        query["role"] = role
    if site_id:
        query["site_id"] = site_id
    
    users = await db.users.find(query).to_list(1000)
    return [serialize_doc(user) for user in users]

@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_doc(user)

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, update_data: dict):
    """Update employee details"""
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove id from update_data if present
    update_data.pop('id', None)
    
    # Update the user
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    return {"success": True, "user": serialize_doc(updated_user)}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    """Delete a user and all their associated data"""
    try:
        # Validate ObjectId format
        try:
            object_id = ObjectId(user_id)
        except:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = await db.users.find_one({"_id": object_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Delete user's timesheets
        await db.timesheets.delete_many({"employee_id": user_id})
        
        # Delete user from roster shifts
        await db.RosterShifts.update_many(
            {"employee_id": user_id},
            {"$set": {"employee_id": None, "employee_name": "Unassigned"}}
        )
        
        # Delete the user
        result = await db.users.delete_one({"_id": object_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "message": f"User {user.get('first_name')} {user.get('last_name')} deleted successfully"
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

# =====================
# SITE ENDPOINTS
# =====================

@api_router.post("/sites", response_model=Site)
async def create_site(site: SiteCreate):
    site_dict = site.model_dump()
    result = await db.sites.insert_one(site_dict)
    site_dict["id"] = str(result.inserted_id)
    return Site(**site_dict)

@api_router.get("/sites")
async def get_sites():
    sites = await db.sites.find().to_list(1000)
    return [serialize_doc(site) for site in sites]

@api_router.get("/sites/{site_id}")
async def get_site(site_id: str):
    site = await db.sites.find_one({"_id": ObjectId(site_id)})
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return serialize_doc(site)

@api_router.delete("/sites/{site_id}")
async def delete_site(site_id: str):
    """Delete a site and handle associated data"""
    try:
        # Validate ObjectId format
        try:
            object_id = ObjectId(site_id)
        except:
            raise HTTPException(status_code=404, detail="Site not found")
        
        site = await db.sites.find_one({"_id": object_id})
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        
        # Check if there are users assigned to this site
        users_count = await db.users.count_documents({"site_id": site_id})
        if users_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete site. {users_count} employee(s) are still assigned to this site. Please reassign them first."
            )
        
        # Check if there are roster shifts for this site
        shifts_count = await db.RosterShifts.count_documents({"site_id": site_id})
        if shifts_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete site. {shifts_count} roster shift(s) exist for this site. Please remove them first."
            )
        
        # Delete the site
        result = await db.sites.delete_one({"_id": object_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Site not found")
        
        return {
            "success": True,
            "message": f"Site {site.get('name')} deleted successfully"
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to delete site: {str(e)}")

# =====================
# INVITATION ENDPOINTS
# =====================

class InvitationCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    role: str = "employee"
    job_title: str
    site_id: Optional[str] = None

class BulkRegistration(BaseModel):
    employees: list

@api_router.post("/users/fix-permissions")
async def fix_user_permissions():
    """
    Fix permissions for ALL users to have the new permission structure
    This is a migration endpoint - run once to update all users
    """
    updated_count = 0
    
    # Get all users
    users = await db.users.find().to_list(None)
    
    for user in users:
        role = user.get("role", "employee")
        default_perms = get_default_permissions(role)
        
        # Always update to ensure new permission structure
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"permissions": default_perms}}
        )
        updated_count += 1
    
    return {
        "success": True,
        "updated_count": updated_count,
        "message": f"Updated {updated_count} users with default permissions"
    }

@api_router.post("/users/bulk-register")
async def bulk_register_employees(bulk_data: BulkRegistration):
    """
    Bulk register employees directly without invitation links
    Admin can upload CSV and create all accounts at once
    """
    created_users = []
    errors = []
    
    for idx, emp in enumerate(bulk_data.employees):
        try:
            # Check if user already exists
            existing = await db.users.find_one({"phone": emp.get("phone")})
            if existing:
                errors.append(f"Row {idx+1}: Phone {emp.get('phone')} already exists")
                continue
            
            # Create user with default PIN
            default_pin = emp.get("pin", "1234")  # Use provided PIN or default
            role = emp.get("role", "employee")
            
            user_dict = {
                "first_name": emp.get("first_name"),
                "last_name": emp.get("last_name"),
                "phone": emp.get("phone"),
                "email": emp.get("email", f"{emp.get('phone')}@temp.com"),
                "pin": default_pin,
                "role": role,
                "job_title": emp.get("job_title", "Employee"),
                "site_id": emp.get("site_id"),
                "award_level": emp.get("award_level", 1),
                "bank_details": None,
                "is_contractor": False,
                "status": "active",
                "permissions": get_default_permissions(role),
                "created_at": datetime.utcnow()
            }
            
            result = await db.users.insert_one(user_dict)
            user_dict["id"] = str(result.inserted_id)
            created_users.append({
                "name": f"{user_dict['first_name']} {user_dict['last_name']}",
                "phone": user_dict["phone"],
                "pin": default_pin,
                "email": user_dict["email"],
                "job_title": user_dict["job_title"]
            })
            
        except Exception as e:
            errors.append(f"Row {idx+1}: {str(e)}")
    
    return {
        "success": True,
        "created_count": len(created_users),
        "error_count": len(errors),
        "created_users": created_users,
        "errors": errors,
        "message": f"Successfully created {len(created_users)} accounts"
    }

@api_router.post("/invitations")
async def create_invitation(invitation: InvitationCreate):
    """Create an invitation for a new employee"""
    # Generate a unique invitation token
    import secrets
    token = secrets.token_urlsafe(32)
    
    invitation_dict = invitation.model_dump()
    invitation_dict["token"] = token
    invitation_dict["status"] = "pending"  # pending, accepted, expired
    invitation_dict["created_at"] = datetime.utcnow()
    invitation_dict["expires_at"] = datetime.utcnow() + timedelta(days=7)  # 7 days to accept
    
    result = await db.invitations.insert_one(invitation_dict)
    invitation_dict["id"] = str(result.inserted_id)
    
    # Send invitation email
    app_url = os.getenv("APP_URL", "https://fieldforce-24.preview.emergentagent.com")
    invitation_link = f"{app_url}/register?token={token}"
    
    email_sent = await send_invitation_email(
        invitation.email,
        invitation.first_name,
        invitation.last_name,
        invitation.job_title,
        invitation_link
    )
    
    return {
        "success": True,
        "invitation_id": str(result.inserted_id),
        "token": token,
        "invitation_link": invitation_link,
        "email_sent": email_sent,
        "message": "Invitation created successfully" + (" and email sent!" if email_sent else " (email disabled)")
    }

async def send_invitation_email(email: str, first_name: str, last_name: str, job_title: str, invitation_link: str):
    """Send invitation email to employee"""
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        # Get SMTP settings from environment
        smtp_enabled = os.getenv("SMTP_ENABLED", "false").lower() == "true"
        if not smtp_enabled:
            print("Email disabled: SMTP_ENABLED is not set to true")
            return False
        
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_from = os.getenv("SMTP_FROM_EMAIL", smtp_username)
        company_name = os.getenv("COMPANY_NAME", "Supreme Hospitality")
        
        if not all([smtp_host, smtp_username, smtp_password]):
            print("Email disabled: SMTP credentials not configured")
            return False
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = f"Join {company_name} - Complete Your Registration"
        message["From"] = smtp_from
        message["To"] = email
        
        # HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 15px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to {company_name}!</h1>
                </div>
                <div class="content">
                    <p>Hi {first_name} {last_name},</p>
                    
                    <p>You've been invited to join {company_name} as a <strong>{job_title}</strong>!</p>
                    
                    <p>To complete your registration and start using the app, please click the button below:</p>
                    
                    <p style="text-align: center;">
                        <a href="{invitation_link}" class="button">Complete Registration</a>
                    </p>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="background-color: #e9e9e9; padding: 10px; word-break: break-all; font-family: monospace; font-size: 12px;">
                        {invitation_link}
                    </p>
                    
                    <p><strong>What's next?</strong></p>
                    <ul>
                        <li>Click the link above</li>
                        <li>Your details will be pre-filled</li>
                        <li>Set a secure 4-6 digit PIN</li>
                        <li>Start clocking in and managing your shifts!</li>
                    </ul>
                    
                    <p style="color: #666; font-size: 14px;"><em>This invitation link will expire in 7 days.</em></p>
                </div>
                <div class="footer">
                    <p>If you didn't expect this invitation, please ignore this email.</p>
                    <p>&copy; 2024 {company_name}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Attach HTML body
        html_part = MIMEText(html_body, "html")
        message.attach(html_part)
        
        # Send email - Handle both SSL (port 465) and TLS (port 587)
        if smtp_port == 465:
            # Use SMTP_SSL for port 465 (GoDaddy)
            with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                server.login(smtp_username, smtp_password)
                server.send_message(message)
        else:
            # Use SMTP with STARTTLS for port 587
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.send_message(message)
        
        print(f"✅ Invitation email sent successfully to {email}")
        return True
        
    except Exception as e:
        print(f"Failed to send invitation email: {str(e)}")
        return False

@api_router.get("/invitations/{token}")
async def get_invitation(token: str):
    """Get invitation details by token"""
    invitation = await db.invitations.find_one({"token": token})
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    # Check if invitation has expired
    if invitation.get("status") == "accepted":
        raise HTTPException(status_code=400, detail="Invitation has already been used")
    
    if invitation.get("expires_at") and invitation["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invitation has expired")
    
    return serialize_doc(invitation)

# =====================
# SHIFT ENDPOINTS
# =====================

@api_router.post("/shifts", response_model=Shift)
async def create_shift(shift: ShiftCreate):
    shift_dict = shift.model_dump()
    shift_dict["status"] = "scheduled"
    shift_dict["created_at"] = datetime.utcnow()
    
    result = await db.shifts.insert_one(shift_dict)
    shift_dict["id"] = str(result.inserted_id)
    
    return Shift(**shift_dict)

@api_router.get("/shifts")
async def get_shifts(employee_id: Optional[str] = None, site_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if site_id:
        query["site_id"] = site_id
    if status:
        query["status"] = status
    
    shifts = await db.shifts.find(query).sort("start_time", -1).to_list(1000)
    return [serialize_doc(shift) for shift in shifts]

@api_router.get("/shifts/{shift_id}")
async def get_shift(shift_id: str):
    shift = await db.shifts.find_one({"_id": ObjectId(shift_id)})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    return serialize_doc(shift)

# =====================
# ROSTER ENDPOINTS
# =====================

@api_router.post("/roster/shifts")
async def create_roster_shift(shift: RosterShiftCreate, created_by: str):
    """Create a new roster shift (Admin/Supervisor only)"""
    shift_dict = shift.model_dump()
    shift_dict["created_by"] = created_by
    shift_dict["status"] = "scheduled"
    shift_dict["created_at"] = datetime.utcnow()
    shift_dict["updated_at"] = datetime.utcnow()
    
    result = await db.roster_shifts.insert_one(shift_dict)
    shift_dict["id"] = str(result.inserted_id)
    
    return RosterShift(**shift_dict)

@api_router.get("/roster/shifts")
async def get_roster_shifts(
    employee_id: Optional[str] = None,
    site_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get roster shifts with optional filters"""
    query = {}
    
    if employee_id:
        query["employee_id"] = employee_id
    if site_id:
        query["site_id"] = site_id
    
    if start_date and end_date:
        query["start_time"] = {
            "$gte": datetime.fromisoformat(start_date.replace('Z', '+00:00')),
            "$lte": datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        }
    
    # Use aggregation pipeline to avoid N+1 query problem
    pipeline = [
        {"$match": query},
        {
            "$lookup": {
                "from": "users",
                "let": {"employee_id_str": {"$toString": "$employee_id"}},
                "pipeline": [
                    {"$addFields": {"user_id_str": {"$toString": "$_id"}}},
                    {"$match": {"$expr": {"$eq": ["$user_id_str", "$$employee_id_str"]}}}
                ],
                "as": "employee"
            }
        },
        {
            "$lookup": {
                "from": "sites",
                "let": {"site_id_str": {"$toString": "$site_id"}},
                "pipeline": [
                    {"$addFields": {"site_id_str": {"$toString": "$_id"}}},
                    {"$match": {"$expr": {"$eq": ["$site_id_str", "$$site_id_str"]}}}
                ],
                "as": "site"
            }
        },
        {"$unwind": {"path": "$employee"}},
        {"$unwind": {"path": "$site"}},
        {
            "$addFields": {
                "employee_name": {
                    "$concat": [
                        {"$ifNull": ["$employee.first_name", ""]},
                        " ",
                        {"$ifNull": ["$employee.last_name", ""]}
                    ]
                },
                "site_name": {"$ifNull": ["$site.name", ""]}
            }
        },
        {"$sort": {"start_time": 1}},
        {
            "$project": {
                "employee": 0,
                "site": 0
            }
        }
    ]
    
    shifts = await db.roster_shifts.aggregate(pipeline).to_list(1000)
    
    # Serialize the results
    enriched_shifts = [serialize_doc(shift) for shift in shifts]
    
    return enriched_shifts

@api_router.put("/roster/shifts/{shift_id}")
async def update_roster_shift(shift_id: str, update_data: dict):
    """Update roster shift"""
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.roster_shifts.update_one(
        {"_id": ObjectId(shift_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    shift = await db.roster_shifts.find_one({"_id": ObjectId(shift_id)})
    return serialize_doc(shift)

@api_router.delete("/roster/shifts/{shift_id}")
async def delete_roster_shift(shift_id: str):
    """Delete roster shift"""
    result = await db.roster_shifts.delete_one({"_id": ObjectId(shift_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    return {"success": True, "message": "Shift deleted"}

# =====================
# AVAILABILITY ENDPOINTS
# =====================

@api_router.post("/availability")
async def set_availability(availability_update: AvailabilityUpdate):
    """Set employee weekly availability"""
    employee_id = availability_update.employee_id
    
    # Delete existing availability for this employee
    await db.availability.delete_many({"employee_id": employee_id})
    
    # Insert new availability
    for avail in availability_update.availability:
        avail_dict = {
            "employee_id": employee_id,
            "day_of_week": avail["day"],
            "available": avail["available"],
            "start_time": avail.get("start_time"),
            "end_time": avail.get("end_time"),
            "created_at": datetime.utcnow()
        }
        await db.availability.insert_one(avail_dict)
    
    return {"success": True, "message": "Availability updated"}

@api_router.get("/availability/{employee_id}")
async def get_availability(employee_id: str):
    """Get employee availability"""
    availability = await db.availability.find({"employee_id": employee_id}).to_list(100)
    return [serialize_doc(avail) for avail in availability]

@api_router.post("/availability/unavailable-dates")
async def add_unavailable_date(unavailable: UnavailableDateCreate):
    """Mark a date as unavailable"""
    unavailable_dict = unavailable.model_dump()
    unavailable_dict["created_at"] = datetime.utcnow()
    
    result = await db.unavailable_dates.insert_one(unavailable_dict)
    unavailable_dict["id"] = str(result.inserted_id)
    
    return UnavailableDate(**unavailable_dict)

@api_router.get("/availability/unavailable-dates/{employee_id}")
async def get_unavailable_dates(employee_id: str):
    """Get employee unavailable dates"""
    dates = await db.unavailable_dates.find({"employee_id": employee_id}).to_list(100)
    return [serialize_doc(date) for date in dates]

@api_router.delete("/availability/unavailable-dates/{date_id}")
async def delete_unavailable_date(date_id: str):
    """Remove unavailable date"""
    result = await db.unavailable_dates.delete_one({"_id": ObjectId(date_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Date not found")
    
    return {"success": True, "message": "Date removed"}

# =====================
# SHIFT SWAP ENDPOINTS
# =====================

@api_router.post("/roster/shift-swaps")
async def create_shift_swap_request(swap: ShiftSwapCreate):
    """Create a shift swap request"""
    # Verify shift exists
    shift = await db.roster_shifts.find_one({"_id": ObjectId(swap.shift_id)})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    # Verify the shift belongs to the from_employee
    if shift["employee_id"] != swap.from_employee_id:
        raise HTTPException(status_code=403, detail="You can only swap your own shifts")
    
    swap_dict = swap.model_dump()
    swap_dict["status"] = "pending"
    swap_dict["created_at"] = datetime.utcnow()
    swap_dict["updated_at"] = datetime.utcnow()
    
    result = await db.shift_swaps.insert_one(swap_dict)
    swap_dict["id"] = str(result.inserted_id)
    
    return ShiftSwapRequest(**swap_dict)

@api_router.get("/roster/shift-swaps")
async def get_shift_swap_requests(
    employee_id: Optional[str] = None,
    status: Optional[str] = None
):
    """Get shift swap requests"""
    query = {}
    
    if employee_id:
        query["$or"] = [
            {"from_employee_id": employee_id},
            {"to_employee_id": employee_id}
        ]
    
    if status:
        query["status"] = status
    
    swaps = await db.shift_swaps.find(query).sort("created_at", -1).to_list(100)
    
    # Enrich with employee and shift details
    enriched_swaps = []
    for swap in swaps:
        from_employee = await db.users.find_one({"_id": ObjectId(swap["from_employee_id"])})
        to_employee = await db.users.find_one({"_id": ObjectId(swap["to_employee_id"])})
        shift = await db.roster_shifts.find_one({"_id": ObjectId(swap["shift_id"])})
        
        swap_data = serialize_doc(swap)
        if from_employee:
            swap_data["from_employee_name"] = f"{from_employee.get('first_name', '')} {from_employee.get('last_name', '')}"
        if to_employee:
            swap_data["to_employee_name"] = f"{to_employee.get('first_name', '')} {to_employee.get('last_name', '')}"
        if shift:
            swap_data["shift_details"] = {
                "start_time": shift["start_time"].isoformat(),
                "end_time": shift["end_time"].isoformat(),
                "role": shift["role"]
            }
        
        enriched_swaps.append(swap_data)
    
    return enriched_swaps

@api_router.post("/roster/shift-swaps/action")
async def handle_shift_swap_action(action: ShiftSwapAction):
    """Approve or reject a shift swap request (Supervisor/Admin only)"""
    swap = await db.shift_swaps.find_one({"_id": ObjectId(action.swap_id)})
    
    if not swap:
        raise HTTPException(status_code=404, detail="Swap request not found")
    
    if swap["status"] != "pending":
        raise HTTPException(status_code=400, detail="Swap request already processed")
    
    # Update swap status
    update_data = {
        "status": action.action,  # 'approved' or 'rejected'
        "approved_by": action.approved_by,
        "updated_at": datetime.utcnow()
    }
    
    await db.shift_swaps.update_one(
        {"_id": ObjectId(action.swap_id)},
        {"$set": update_data}
    )
    
    # If approved, update the shift to new employee
    if action.action == "approved":
        await db.roster_shifts.update_one(
            {"_id": ObjectId(swap["shift_id"])},
            {"$set": {
                "employee_id": swap["to_employee_id"],
                "updated_at": datetime.utcnow()
            }}
        )
    
    return {"success": True, "message": f"Swap request {action.action}"}

# =====================
# RECURRING SHIFT TEMPLATES ENDPOINTS
# =====================

@api_router.post("/roster/templates")
async def create_recurring_template(template: RecurringTemplateCreate, created_by: str):
    """Create a recurring shift template"""
    template_dict = template.model_dump()
    template_dict["created_by"] = created_by
    template_dict["active"] = True
    template_dict["created_at"] = datetime.utcnow()
    
    result = await db.recurring_templates.insert_one(template_dict)
    template_dict["id"] = str(result.inserted_id)
    
    return RecurringShiftTemplate(**template_dict)

@api_router.get("/roster/templates")
async def get_recurring_templates(
    employee_id: Optional[str] = None,
    active: Optional[bool] = None
):
    """Get recurring shift templates"""
    query = {}
    
    if employee_id:
        query["employee_id"] = employee_id
    
    if active is not None:
        query["active"] = active
    
    # Use aggregation pipeline to avoid N+1 query problem
    pipeline = [
        {"$match": query},
        {
            "$lookup": {
                "from": "users",
                "let": {"employee_id_str": {"$toString": "$employee_id"}},
                "pipeline": [
                    {"$addFields": {"user_id_str": {"$toString": "$_id"}}},
                    {"$match": {"$expr": {"$eq": ["$user_id_str", "$$employee_id_str"]}}}
                ],
                "as": "employee"
            }
        },
        {
            "$lookup": {
                "from": "sites",
                "let": {"site_id_str": {"$toString": "$site_id"}},
                "pipeline": [
                    {"$addFields": {"site_id_str": {"$toString": "$_id"}}},
                    {"$match": {"$expr": {"$eq": ["$site_id_str", "$$site_id_str"]}}}
                ],
                "as": "site"
            }
        },
        {"$unwind": {"path": "$employee"}},
        {"$unwind": {"path": "$site"}},
        {
            "$addFields": {
                "employee_name": {
                    "$concat": [
                        {"$ifNull": ["$employee.first_name", ""]},
                        " ",
                        {"$ifNull": ["$employee.last_name", ""]}
                    ]
                },
                "site_name": {"$ifNull": ["$site.name", ""]}
            }
        },
        {
            "$project": {
                "employee": 0,
                "site": 0
            }
        }
    ]
    
    templates = await db.recurring_templates.aggregate(pipeline).to_list(100)
    
    # Serialize the results
    enriched_templates = [serialize_doc(template) for template in templates]
    
    return enriched_templates

@api_router.put("/roster/templates/{template_id}")
async def update_recurring_template(template_id: str, update_data: dict):
    """Update or deactivate a recurring template"""
    result = await db.recurring_templates.update_one(
        {"_id": ObjectId(template_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = await db.recurring_templates.find_one({"_id": ObjectId(template_id)})
    return serialize_doc(template)

@api_router.delete("/roster/templates/{template_id}")
async def delete_recurring_template(template_id: str):
    """Delete a recurring template"""
    result = await db.recurring_templates.delete_one({"_id": ObjectId(template_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"success": True, "message": "Template deleted"}

@api_router.post("/roster/templates/{template_id}/generate")
async def generate_shifts_from_template(
    template_id: str,
    weeks: int = 4
):
    """Generate roster shifts from a template for the next N weeks"""
    template = await db.recurring_templates.find_one({"_id": ObjectId(template_id)})
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if not template.get("active", False):
        raise HTTPException(status_code=400, detail="Template is not active")
    
    # Generate shifts for next N weeks
    shifts_created = []
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    for week in range(weeks):
        # Find the next occurrence of the day_of_week
        days_ahead = template["day_of_week"] - today.weekday()
        if days_ahead < 0:
            days_ahead += 7
        
        shift_date = today + timedelta(days=days_ahead + (week * 7))
        
        # Parse time strings
        start_hour, start_minute = map(int, template["start_time"].split(":"))
        end_hour, end_minute = map(int, template["end_time"].split(":"))
        
        start_time = shift_date.replace(hour=start_hour, minute=start_minute)
        end_time = shift_date.replace(hour=end_hour, minute=end_minute)
        
        # Check if shift already exists for this date
        existing = await db.roster_shifts.find_one({
            "employee_id": template["employee_id"],
            "start_time": start_time
        })
        
        if not existing:
            shift = {
                "employee_id": template["employee_id"],
                "site_id": template["site_id"],
                "role": template["role"],
                "start_time": start_time,
                "end_time": end_time,
                "status": "scheduled",
                "created_by": template["created_by"],
                "notes": f"Generated from template: {template['name']}",
                "template_id": str(template["_id"]),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await db.roster_shifts.insert_one(shift)
            shift["id"] = str(result.inserted_id)
            shifts_created.append(serialize_doc(shift))
    
    return {
        "success": True,
        "shifts_created": len(shifts_created),
        "shifts": shifts_created
    }

# =====================
# TIMESHEET ENDPOINTS
# =====================

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates using Haversine formula (in meters)"""
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371000  # Earth's radius in meters
    
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)
    
    a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    distance = R * c
    return distance

@api_router.post("/timesheets/clock-in")
async def clock_in(request: ClockInRequest):
    """Clock in - creates a new timesheet with geo-fencing and roster validation"""
    # Check if already clocked in
    existing = await db.timesheets.find_one({
        "employee_id": request.employee_id,
        "clock_out": None
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already clocked in. Please clock out first.")
    
    # *** ROSTER VALIDATION (Optional) ***
    # Check if employee has a rostered shift for current time
    # Allow clock-in even without roster, but log a warning
    current_time = datetime.utcnow()
    rostered_shift = await db.roster_shifts.find_one({
        "employee_id": request.employee_id,
        "start_time": {"$lte": current_time},
        "end_time": {"$gte": current_time},
        "status": {"$in": ["scheduled", "published"]}
    })
    
    # If strict roster validation is needed, uncomment below:
    # if not rostered_shift:
    #     raise HTTPException(
    #         status_code=403, 
    #         detail="You are not rostered to work at this time. Please check your roster or contact your supervisor."
    #     )
    
    # Validate GPS and calculate distance from site
    site = await db.sites.find_one({"_id": ObjectId(request.site_id)})
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    # Calculate distance from site
    distance = calculate_distance(
        request.gps_lat, request.gps_long,
        site["gps_lat"], site["gps_long"]
    )
    
    # Check if within geo-fence (100m default)
    radius = site.get("radius_meters", 100)
    out_of_bounds = distance > radius
    
    # Create timesheet linked to roster shift (if available)
    timesheet = {
        "employee_id": request.employee_id,
        "site_id": request.site_id,
        "roster_shift_id": str(rostered_shift["_id"]) if rostered_shift else None,
        "clock_in": datetime.utcnow(),
        "gps_in_lat": request.gps_lat,
        "gps_in_long": request.gps_long,
        "gps_in_distance": round(distance, 2),
        "gps_in_out_of_bounds": out_of_bounds,
        "break_minutes": 0,
        "total_hours": 0.0,
        "approval_status": "pending",
        "created_at": datetime.utcnow()
    }
    
    result = await db.timesheets.insert_one(timesheet)
    timesheet["id"] = str(result.inserted_id)
    
    return {
        "success": True, 
        "timesheet": serialize_doc(timesheet),
        "geo_fence_warning": out_of_bounds,
        "distance_meters": round(distance, 2),
        "allowed_radius": radius,
        "rostered_shift": serialize_doc(rostered_shift) if rostered_shift else None,
        "roster_warning": not rostered_shift  # Flag if clocking in without roster
    }

@api_router.post("/timesheets/clock-out")
async def clock_out(request: ClockOutRequest):
    """Clock out - completes the timesheet with geo-fencing validation"""
    timesheet = await db.timesheets.find_one({"_id": ObjectId(request.timesheet_id)})
    
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    
    if timesheet.get("clock_out"):
        raise HTTPException(status_code=400, detail="Already clocked out")
    
    # Validate GPS for clock-out
    site = await db.sites.find_one({"_id": ObjectId(timesheet["site_id"])})
    if site:
        distance = calculate_distance(
            request.gps_lat, request.gps_long,
            site["gps_lat"], site["gps_long"]
        )
        radius = site.get("radius_meters", 100)
        out_of_bounds = distance > radius
    else:
        distance = 0
        out_of_bounds = False
    
    # Calculate total hours
    clock_in = timesheet["clock_in"]
    clock_out = datetime.utcnow()
    total_seconds = (clock_out - clock_in).total_seconds()
    total_hours = (total_seconds - (timesheet.get("break_minutes", 0) * 60)) / 3600
    
    # Check if this is a public holiday
    is_holiday, holiday_name = is_public_holiday(clock_in)
    
    # Get user's pay rate
    user = await db.users.find_one({"_id": ObjectId(timesheet["employee_id"])})
    base_rate = 25.0  # Default rate
    if user:
        # Get pay rate from award level or job title
        pay_rate_doc = await db.pay_rates.find_one({"award_level": user.get("award_level", 1)})
        if pay_rate_doc:
            base_rate = pay_rate_doc.get("hourly_rate", 25.0)
    
    # Calculate pay with holiday consideration
    pay_calculation = calculate_pay_rate_with_holiday(base_rate, clock_in, total_hours)
    
    # Update timesheet
    await db.timesheets.update_one(
        {"_id": ObjectId(request.timesheet_id)},
        {"$set": {
            "clock_out": clock_out,
            "gps_out_lat": request.gps_lat,
            "gps_out_long": request.gps_long,
            "gps_out_distance": round(distance, 2),
            "gps_out_out_of_bounds": out_of_bounds,
            "total_hours": round(total_hours, 2),
            "is_public_holiday": is_holiday,
            "holiday_name": holiday_name,
            "pay_rate": pay_calculation["effective_rate"],
            "pay_multiplier": pay_calculation["multiplier"],
            "total_pay": pay_calculation["total_pay"]
        }}
    )
    
    updated = await db.timesheets.find_one({"_id": ObjectId(request.timesheet_id)})
    return {"success": True, "timesheet": serialize_doc(updated)}

@api_router.post("/timesheets/break")
async def manage_break(request: BreakRequest):
    """Start or end break"""
    timesheet = await db.timesheets.find_one({"_id": ObjectId(request.timesheet_id)})
    
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    
    if request.action == "start":
        if timesheet.get("break_start"):
            raise HTTPException(status_code=400, detail="Break already started")
        
        await db.timesheets.update_one(
            {"_id": ObjectId(request.timesheet_id)},
            {"$set": {"break_start": datetime.utcnow()}}
        )
    elif request.action == "end":
        if not timesheet.get("break_start"):
            raise HTTPException(status_code=400, detail="No break in progress")
        
        if timesheet.get("break_end"):
            raise HTTPException(status_code=400, detail="Break already ended")
        
        break_start = timesheet["break_start"]
        break_end = datetime.utcnow()
        break_duration = (break_end - break_start).total_seconds() / 60
        
        await db.timesheets.update_one(
            {"_id": ObjectId(request.timesheet_id)},
            {"$set": {
                "break_end": break_end,
                "break_minutes": timesheet.get("break_minutes", 0) + int(break_duration)
            }}
        )
    
    updated = await db.timesheets.find_one({"_id": ObjectId(request.timesheet_id)})
    return {"success": True, "timesheet": serialize_doc(updated)}

class ManualTimesheetRequest(BaseModel):
    employee_id: str
    site_id: str
    clock_in: str  # ISO datetime string
    clock_out: str  # ISO datetime string
    break_minutes: int = 0
    notes: Optional[str] = None

@api_router.post("/timesheets/manual")
async def create_manual_timesheet(request: ManualTimesheetRequest):
    """Create a manual timesheet entry (requires approval)"""
    try:
        clock_in = datetime.fromisoformat(request.clock_in.replace('Z', '+00:00'))
        clock_out = datetime.fromisoformat(request.clock_out.replace('Z', '+00:00'))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid datetime format: {str(e)}")
    
    if clock_out <= clock_in:
        raise HTTPException(status_code=400, detail="Clock out must be after clock in")
    
    # Calculate total hours
    total_seconds = (clock_out - clock_in).total_seconds()
    total_hours = (total_seconds - (request.break_minutes * 60)) / 3600
    total_hours = round(max(total_hours, 0), 2)
    
    timesheet = {
        "employee_id": request.employee_id,
        "site_id": request.site_id,
        "clock_in": clock_in,
        "clock_out": clock_out,
        "break_minutes": request.break_minutes,
        "total_hours": total_hours,
        "approval_status": "pending",
        "employee_notes": request.notes or "Manual entry",
        "manually_edited": True,
        "is_manual_entry": True,
        "gps_clock_in": None,
        "gps_clock_out": None,
        "created_at": datetime.utcnow()
    }
    
    result = await db.timesheets.insert_one(timesheet)
    timesheet["id"] = str(result.inserted_id)
    
    return {"success": True, "message": "Manual timesheet submitted for approval", "timesheet": timesheet}

@api_router.delete("/timesheets/bulk-delete")
async def bulk_delete_timesheets(status: str = "rejected"):
    """Delete all timesheets with a specific status (admin only)"""
    valid_statuses = ["rejected", "pending"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid_statuses}")
    
    result = await db.timesheets.delete_many({"approval_status": status})
    return {"success": True, "message": f"Deleted {result.deleted_count} {status} timesheets", "deleted_count": result.deleted_count}

@api_router.get("/timesheets")
async def get_timesheets(
    employee_id: Optional[str] = None,
    site_id: Optional[str] = None,
    approval_status: Optional[str] = None
):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if site_id:
        query["site_id"] = site_id
    if approval_status:
        query["approval_status"] = approval_status
    
    timesheets = await db.timesheets.find(query).sort("created_at", -1).to_list(1000)
    return [serialize_doc(ts) for ts in timesheets]

@api_router.get("/timesheets/{timesheet_id}")
async def get_timesheet(timesheet_id: str):
    timesheet = await db.timesheets.find_one({"_id": ObjectId(timesheet_id)})
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    return serialize_doc(timesheet)

@api_router.post("/timesheets/{timesheet_id}/update")
async def update_timesheet(timesheet_id: str, request: TimesheetUpdateRequest):
    """Update timesheet with employee notes, photo, or manual edits"""
    timesheet = await db.timesheets.find_one({"_id": ObjectId(timesheet_id)})
    
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    
    update_data = {}
    if request.employee_notes is not None:
        update_data["employee_notes"] = request.employee_notes
    if request.photo_base64 is not None:
        update_data["photo_base64"] = request.photo_base64
    
    # Manual time edits - parse ISO datetime strings
    manual_clock_in = None
    manual_clock_out = None
    
    if request.manual_clock_in is not None:
        try:
            manual_clock_in = datetime.fromisoformat(request.manual_clock_in.replace('Z', '+00:00'))
            update_data["clock_in"] = manual_clock_in
            update_data["manually_edited"] = True
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid clock_in format: {str(e)}")
        
    if request.manual_clock_out is not None:
        try:
            manual_clock_out = datetime.fromisoformat(request.manual_clock_out.replace('Z', '+00:00'))
            update_data["clock_out"] = manual_clock_out
            update_data["manually_edited"] = True
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid clock_out format: {str(e)}")
        
    if request.manual_break_minutes is not None:
        update_data["break_minutes"] = request.manual_break_minutes
        update_data["manually_edited"] = True
    
    # Recalculate total hours if times changed
    if manual_clock_in or manual_clock_out or request.manual_break_minutes is not None:
        clock_in = manual_clock_in or timesheet.get("clock_in")
        clock_out = manual_clock_out or timesheet.get("clock_out")
        break_mins = request.manual_break_minutes if request.manual_break_minutes is not None else timesheet.get("break_minutes", 0)
        
        if clock_in and clock_out:
            # Handle timezone-aware vs naive datetime comparison
            if hasattr(clock_in, 'tzinfo') and clock_in.tzinfo is not None:
                clock_in = clock_in.replace(tzinfo=None)
            if hasattr(clock_out, 'tzinfo') and clock_out.tzinfo is not None:
                clock_out = clock_out.replace(tzinfo=None)
            
            total_seconds = (clock_out - clock_in).total_seconds()
            total_hours = (total_seconds - (break_mins * 60)) / 3600
            update_data["total_hours"] = round(max(total_hours, 0), 2)
    
    if update_data:
        await db.timesheets.update_one(
            {"_id": ObjectId(timesheet_id)},
            {"$set": update_data}
        )
    
    updated = await db.timesheets.find_one({"_id": ObjectId(timesheet_id)})
    return {"success": True, "timesheet": serialize_doc(updated)}

@api_router.post("/timesheets/approve")
async def approve_timesheet(request: ApprovalRequest):
    """Supervisor approves/rejects timesheet"""
    timesheet = await db.timesheets.find_one({"_id": ObjectId(request.timesheet_id)})
    
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    
    # Calculate total pay when approving
    total_pay = 0.0
    if request.status == "approved" and timesheet.get("total_hours", 0) > 0:
        # Get employee and pay rate
        employee = await db.users.find_one({"_id": ObjectId(timesheet["employee_id"])})
        if employee:
            pay_rate = await db.pay_rates.find_one({"award_level": employee.get("award_level", 1)})
            if pay_rate:
                clock_in = timesheet["clock_in"]
                day_of_week = clock_in.weekday()
                
                # Determine rate based on day
                if day_of_week == 5:  # Saturday
                    rate = pay_rate["saturday_rate"]
                elif day_of_week == 6:  # Sunday
                    rate = pay_rate["sunday_rate"]
                else:
                    rate = pay_rate["weekday_rate"]
                
                total_pay = timesheet.get("total_hours", 0) * rate
    
    update_data = {
        "approval_status": request.status,
        "supervisor_id": request.supervisor_id,
        "notes": request.notes,
        "total_pay": round(total_pay, 2)
    }
    
    # Add signature if provided
    if hasattr(request, 'signature') and request.signature:
        update_data["supervisor_signature"] = request.signature
    
    await db.timesheets.update_one(
        {"_id": ObjectId(request.timesheet_id)},
        {"$set": update_data}
    )
    
    updated = await db.timesheets.find_one({"_id": ObjectId(request.timesheet_id)})
    return {"success": True, "timesheet": serialize_doc(updated)}

@api_router.delete("/timesheets/{timesheet_id}")
async def delete_timesheet(timesheet_id: str):
    """Delete a timesheet (for invalid/erroneous entries)"""
    try:
        # Validate ObjectId format
        try:
            object_id = ObjectId(timesheet_id)
        except:
            raise HTTPException(status_code=404, detail="Timesheet not found")
        
        timesheet = await db.timesheets.find_one({"_id": object_id})
        if not timesheet:
            raise HTTPException(status_code=404, detail="Timesheet not found")
        
        # Delete the timesheet
        result = await db.timesheets.delete_one({"_id": object_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Timesheet not found")
        
        return {
            "success": True,
            "message": "Timesheet deleted successfully"
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to delete timesheet: {str(e)}")

# =====================
# DASHBOARD ENDPOINTS
# =====================

@api_router.get("/dashboard/supervisor")
async def supervisor_dashboard(site_id: Optional[str] = None):
    """Get supervisor dashboard data"""
    query = {}
    if site_id:
        query["site_id"] = site_id
    
    # Active shifts (clocked in)
    active_query = {**query, "clock_out": None}
    active_timesheets = await db.timesheets.find(active_query).to_list(1000)
    
    # Pending approvals
    pending_query = {**query, "approval_status": "pending", "clock_out": {"$ne": None}}
    pending_timesheets = await db.timesheets.find(pending_query).to_list(1000)
    
    return {
        "active_employees": len(active_timesheets),
        "pending_approvals": len(pending_timesheets),
        "active_timesheets": [serialize_doc(ts) for ts in active_timesheets],
        "pending_timesheets": [serialize_doc(ts) for ts in pending_timesheets]
    }

# =====================
# LEAVE REQUEST ENDPOINTS
# =====================

@api_router.post("/leave-requests", response_model=LeaveRequest)
async def create_leave_request(leave: LeaveRequestCreate):
    leave_dict = leave.model_dump()
    leave_dict["status"] = "pending"
    leave_dict["created_at"] = datetime.utcnow()
    
    result = await db.leave_requests.insert_one(leave_dict)
    leave_dict["id"] = str(result.inserted_id)
    
    return LeaveRequest(**leave_dict)

@api_router.get("/leave-requests")
async def get_leave_requests(employee_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    
    leaves = await db.leave_requests.find(query).sort("created_at", -1).to_list(1000)
    return [serialize_doc(leave) for leave in leaves]

@api_router.post("/leave-requests/approve")
async def approve_leave_request(request: ApprovalRequest):
    """Approve or reject leave request"""
    leave = await db.leave_requests.find_one({"_id": ObjectId(request.timesheet_id)})
    
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    await db.leave_requests.update_one(
        {"_id": ObjectId(request.timesheet_id)},
        {"$set": {
            "status": request.status,
            "approved_by": request.supervisor_id,
            "notes": request.notes
        }}
    )
    
    updated = await db.leave_requests.find_one({"_id": ObjectId(request.timesheet_id)})
    return {"success": True, "leave_request": serialize_doc(updated)}

# =====================
# PAY RATE ENDPOINTS
# =====================

@api_router.post("/pay-rates", response_model=PayRate)
async def create_pay_rate(rate: PayRateCreate):
    rate_dict = rate.model_dump()
    result = await db.pay_rates.insert_one(rate_dict)
    rate_dict["id"] = str(result.inserted_id)
    return PayRate(**rate_dict)

@api_router.get("/pay-rates")
async def get_pay_rates(award_level: Optional[int] = None):
    query = {}
    if award_level:
        query["award_level"] = award_level
    
    rates = await db.pay_rates.find(query).to_list(1000)
    return [serialize_doc(rate) for rate in rates]

@api_router.put("/pay-rates/{award_level}")
async def update_pay_rate(award_level: int, rate: PayRateCreate):
    """Update pay rate for a specific award level - upsert if doesn't exist"""
    rate_dict = rate.model_dump()
    
    # Find existing rate by award_level
    existing = await db.pay_rates.find_one({"award_level": award_level})
    
    if existing:
        # Update existing rate
        await db.pay_rates.update_one(
            {"award_level": award_level},
            {"$set": rate_dict}
        )
        updated = await db.pay_rates.find_one({"award_level": award_level})
        return {"success": True, "message": f"Pay rate for Level {award_level} updated", "rate": serialize_doc(updated)}
    else:
        # Create new rate
        result = await db.pay_rates.insert_one(rate_dict)
        rate_dict["id"] = str(result.inserted_id)
        return {"success": True, "message": f"Pay rate for Level {award_level} created", "rate": rate_dict}

# =====================
# PAYROLL EXPORT ENDPOINT
# =====================

@api_router.post("/payroll/export")
async def export_payroll(request: PayrollExportRequest):
    """Export payroll data to CSV format"""
    import csv
    from io import StringIO
    
    query = {
        "clock_out": {"$ne": None},
        "approval_status": "approved",
        "clock_in": {
            "$gte": request.start_date,
            "$lte": request.end_date
        }
    }
    
    if request.site_id:
        query["site_id"] = request.site_id
    
    timesheets = await db.timesheets.find(query).to_list(1000)
    
    # Get employee and pay rate info
    csv_data = []
    for ts in timesheets:
        user = await db.users.find_one({"_id": ObjectId(ts["employee_id"])})
        if not user:
            continue
        
        pay_rate = await db.pay_rates.find_one({"award_level": user.get("award_level", 1)})
        
        # Calculate pay based on day of week
        clock_in = ts["clock_in"]
        day_of_week = clock_in.weekday()  # 0=Monday, 6=Sunday
        
        base_rate = pay_rate["weekday_rate"] if pay_rate else 25.0
        if day_of_week == 5:  # Saturday
            rate = pay_rate["saturday_rate"] if pay_rate else base_rate * 1.5
        elif day_of_week == 6:  # Sunday
            rate = pay_rate["sunday_rate"] if pay_rate else base_rate * 2.0
        else:
            rate = base_rate
        
        total_pay = ts["total_hours"] * rate
        
        csv_data.append({
            "Employee ID": ts["employee_id"][-6:],
            "Name": f"{user['first_name']} {user['last_name']}",
            "Date": clock_in.strftime("%Y-%m-%d"),
            "Clock In": clock_in.strftime("%H:%M"),
            "Clock Out": ts["clock_out"].strftime("%H:%M"),
            "Total Hours": f"{ts['total_hours']:.2f}",
            "Break (min)": ts["break_minutes"],
            "Rate": f"${rate:.2f}",
            "Total Pay": f"${total_pay:.2f}",
            "Award Level": user.get("award_level", 1)
        })
    
    # Convert to CSV string
    output = StringIO()
    if csv_data:
        writer = csv.DictWriter(output, fieldnames=csv_data[0].keys())
        writer.writeheader()
        writer.writerows(csv_data)
    
    return {
        "success": True,
        "csv_data": output.getvalue(),
        "record_count": len(csv_data),
        "total_hours": sum([float(row["Total Hours"]) for row in csv_data]),
        "total_pay": sum([float(row["Total Pay"].replace("$", "")) for row in csv_data])
    }

@api_router.post("/payroll/export-excel")
async def export_payroll_excel(request: PayrollExportRequest):
    """Export payroll data to Excel format"""
    from fastapi.responses import Response
    from excel_export import create_payroll_excel
    
    query = {
        "clock_out": {"$ne": None},
        "approval_status": "approved",
        "clock_in": {
            "$gte": request.start_date,
            "$lte": request.end_date
        }
    }
    
    if request.site_id:
        query["site_id"] = request.site_id
    
    timesheets = await db.timesheets.find(query).to_list(1000)
    
    # Enrich with employee and site data
    enriched_data = []
    for ts in timesheets:
        user = await db.users.find_one({"_id": ObjectId(ts["employee_id"])})
        site = await db.sites.find_one({"_id": ObjectId(ts["site_id"])})
        pay_rate = await db.pay_rates.find_one({"award_level": user.get("award_level", 1)})
        
        if not user:
            continue
        
        # Calculate pay
        clock_in = ts["clock_in"]
        day_of_week = clock_in.weekday()
        base_rate = pay_rate["weekday_rate"] if pay_rate else 25.0
        
        if day_of_week == 5:
            rate = pay_rate["saturday_rate"] if pay_rate else base_rate * 1.5
        elif day_of_week == 6:
            rate = pay_rate["sunday_rate"] if pay_rate else base_rate * 2.0
        else:
            rate = base_rate
        
        total_pay = ts["total_hours"] * rate
        
        enriched_data.append({
            "employee_id": ts["employee_id"][-6:],
            "employee_name": f"{user['first_name']} {user['last_name']}",
            "site_name": site["name"] if site else "Unknown",
            "clock_in": clock_in.isoformat(),
            "clock_out": ts["clock_out"].isoformat() if ts.get("clock_out") else "",
            "total_hours": ts["total_hours"],
            "break_minutes": ts["break_minutes"],
            "pay_rate": rate,
            "total_pay": total_pay,
            "approval_status": ts["approval_status"],
            "supervisor_notes": ts.get("supervisor_notes", "")
        })
    
    excel_bytes = create_payroll_excel(
        enriched_data,
        request.start_date.isoformat(),
        request.end_date.isoformat()
    )
    
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=payroll_{request.start_date.strftime('%Y%m%d')}.xlsx"
        }
    )

@api_router.post("/contracts/send-email")
async def send_contract_email_endpoint(employee_id: str, contract_type: str):
    """Send employment contract via email (Mock)"""
    from otp_service import send_contract_email
    
    user = await db.users.find_one({"_id": ObjectId(employee_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    success = send_contract_email(
        user["email"],
        f"{user['first_name']} {user['last_name']}",
        contract_type
    )
    
    return {
        "success": success,
        "message": f"Contract email sent to {user['email']} (Check console - MOCK)"
    }

@api_router.post("/contracts/sign")
async def sign_contract(employee_id: str, contract_type: str, signature_base64: str):
    """Save digital signature for contract"""
    
    # Create or update contract document
    contract_doc = {
        "employee_id": employee_id,
        "contract_type": contract_type,
        "signature_base64": signature_base64,
        "signed_at": datetime.utcnow(),
        "status": "signed"
    }
    
    # Check if contract already exists
    existing = await db.contracts.find_one({
        "employee_id": employee_id,
        "contract_type": contract_type
    })
    
    if existing:
        await db.contracts.update_one(
            {"_id": existing["_id"]},
            {"$set": contract_doc}
        )
    else:
        await db.contracts.insert_one(contract_doc)
    
    return {
        "success": True,
        "message": "Contract signed successfully"
    }

@api_router.post("/invoices/send-email")
async def send_invoice_email_endpoint(employee_id: str, period: str, total_amount: float):
    """Send invoice via email to ABN contractor (Mock)"""
    from otp_service import send_invoice_email
    
    user = await db.users.find_one({"_id": ObjectId(employee_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if not user.get("is_contractor"):
        raise HTTPException(status_code=400, detail="Employee is not an ABN contractor")
    
    import random
    invoice_data = {
        "invoice_number": f"INV-{random.randint(10000, 99999)}",
        "total": total_amount,
        "period": period,
        "abn": user.get("abn", "")
    }
    
    success = send_invoice_email(user["email"], invoice_data)
    
    return {
        "success": success,
        "message": f"Invoice email sent to {user['email']} (Check console - MOCK)",
        "invoice_number": invoice_data["invoice_number"]
    }

# =====================
# EARNINGS ENDPOINT
# =====================

@api_router.get("/earnings/summary")
async def get_earnings_summary():
    """Get earnings summary for all employees"""
    employees = await db.users.find({"role": {"$ne": "admin"}}).to_list(1000)
    
    earnings_data = []
    for emp in employees:
        # Get approved timesheets
        timesheets = await db.timesheets.find({
            "employee_id": str(emp["_id"]),
            "approval_status": "approved",
            "clock_out": {"$ne": None}
        }).to_list(1000)
        
        total_hours = 0
        total_pay = 0
        
        # Get pay rate for employee
        pay_rate = await db.pay_rates.find_one({"award_level": emp.get("award_level", 1)})
        base_rate = pay_rate["weekday_rate"] if pay_rate else 25.0
        
        for ts in timesheets:
            hours = ts.get("total_hours", 0)
            total_hours += hours
            
            # Calculate pay based on day
            clock_in = ts["clock_in"]
            day_of_week = clock_in.weekday()
            
            if day_of_week == 5:  # Saturday
                rate = pay_rate["saturday_rate"] if pay_rate else base_rate * 1.5
            elif day_of_week == 6:  # Sunday
                rate = pay_rate["sunday_rate"] if pay_rate else base_rate * 2.0
            else:
                rate = base_rate
            
            total_pay += hours * rate
        
        earnings_data.append({
            "employee_id": str(emp["_id"]),
            "name": f"{emp['first_name']} {emp['last_name']}",
            "job_title": emp.get("job_title", ""),
            "award_level": emp.get("award_level", 1),
            "total_hours": round(total_hours, 2),
            "total_pay": round(total_pay, 2),
            "shift_count": len(timesheets)
        })
    
    # Sort by total_pay descending
    earnings_data.sort(key=lambda x: x["total_pay"], reverse=True)
    
    return {
        "employees": earnings_data,
        "total_employees": len(earnings_data),
        "total_hours": sum([e["total_hours"] for e in earnings_data]),
        "total_pay": sum([e["total_pay"] for e in earnings_data])
    }

# =====================
# CONTRACT & INVOICE ENDPOINTS
# =====================

@api_router.post("/contracts/send")
async def send_contract(employee_id: str, contract_type: str = "employment"):
    """Send employment contract to employee"""
    user = await db.users.find_one({"_id": ObjectId(employee_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # In production, integrate with DocuSign, HelloSign, etc.
    # For now, create a contract record
    contract = {
        "employee_id": employee_id,
        "employee_name": f"{user['first_name']} {user['last_name']}",
        "employee_email": user['email'],
        "contract_type": contract_type,
        "status": "sent",
        "sent_date": datetime.utcnow(),
        "contract_url": f"https://contracts.supremehospitality.com/{employee_id}/{contract_type}.pdf"  # Mock URL
    }
    
    result = await db.contracts.insert_one(contract)
    contract["id"] = str(result.inserted_id)
    
    return {
        "success": True,
        "message": f"Contract sent to {user['email']}",
        "contract": serialize_doc(contract)
    }

@api_router.get("/contracts")
async def get_contracts(employee_id: Optional[str] = None, status: Optional[str] = None):
    """Get all contracts"""
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    
    contracts = await db.contracts.find(query).sort("sent_date", -1).to_list(1000)
    return [serialize_doc(contract) for contract in contracts]

@api_router.post("/invoices/generate")
async def generate_invoice(employee_id: str, start_date: datetime, end_date: datetime):
    """Generate invoice for ABN contractors"""
    user = await db.users.find_one({"_id": ObjectId(employee_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get approved timesheets for the period
    timesheets = await db.timesheets.find({
        "employee_id": employee_id,
        "approval_status": "approved",
        "clock_in": {"$gte": start_date, "$lte": end_date}
    }).to_list(1000)
    
    # Calculate totals
    total_hours = sum([ts.get("total_hours", 0) for ts in timesheets])
    pay_rate_doc = await db.pay_rates.find_one({"award_level": user.get("award_level", 1)})
    hourly_rate = pay_rate_doc["weekday_rate"] if pay_rate_doc else 25.0
    
    # For ABN, usually a flat rate or negotiated rate
    total_amount = total_hours * hourly_rate
    gst = total_amount * 0.1  # 10% GST
    total_with_gst = total_amount + gst
    
    # Create invoice
    invoice = {
        "employee_id": employee_id,
        "employee_name": f"{user['first_name']} {user['last_name']}",
        "employee_email": user['email'],
        "abn": user.get("abn", "N/A"),
        "start_date": start_date,
        "end_date": end_date,
        "total_hours": round(total_hours, 2),
        "hourly_rate": hourly_rate,
        "subtotal": round(total_amount, 2),
        "gst": round(gst, 2),
        "total": round(total_with_gst, 2),
        "status": "generated",
        "generated_date": datetime.utcnow(),
        "invoice_number": f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{employee_id[-4:]}"
    }
    
    result = await db.invoices.insert_one(invoice)
    invoice["id"] = str(result.inserted_id)
    
    return {
        "success": True,
        "message": "Invoice generated successfully",
        "invoice": serialize_doc(invoice)
    }

@api_router.get("/invoices")
async def get_invoices(employee_id: Optional[str] = None, status: Optional[str] = None):
    """Get all invoices"""
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    
    invoices = await db.invoices.find(query).sort("generated_date", -1).to_list(1000)
    return [serialize_doc(invoice) for invoice in invoices]

# =====================
# TEMPLATE PREVIEW ENDPOINTS
# =====================

@api_router.get("/templates/contract/preview")
async def preview_contract():
    """View the employment contract template"""
    from fastapi.responses import HTMLResponse
    template_path = Path(__file__).parent / "templates" / "employment_contract.html"
    
    if template_path.exists():
        with open(template_path, 'r') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content)
    else:
        raise HTTPException(status_code=404, detail="Template not found")

@api_router.get("/templates/invoice/preview")
async def preview_invoice():
    """View the ABN invoice template"""
    from fastapi.responses import HTMLResponse
    template_path = Path(__file__).parent / "templates" / "abn_invoice.html"
    
    if template_path.exists():
        with open(template_path, 'r') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content)
    else:
        raise HTTPException(status_code=404, detail="Template not found")

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Supreme Hospitality Services Timesheet API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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
