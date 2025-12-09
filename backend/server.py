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
        "view_own_pay": False,
        "view_all_timesheets": False,
        "edit_timesheets": False,
        "approve_timesheets": False,
        "view_reports": False,
        "manage_users": False,
        "manage_sites": False,
        "export_payroll": False
    }
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

# =====================
# USER ENDPOINTS
# =====================

@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    user_dict = user.model_dump()
    user_dict["created_at"] = datetime.utcnow()
    user_dict["status"] = "active"
    
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
    
    shifts = await db.roster_shifts.find(query).sort("start_time", 1).to_list(1000)
    
    # Enrich with employee and site details
    enriched_shifts = []
    for shift in shifts:
        employee = await db.users.find_one({"_id": ObjectId(shift["employee_id"])})
        site = await db.sites.find_one({"_id": ObjectId(shift["site_id"])})
        
        shift_data = serialize_doc(shift)
        if employee:
            shift_data["employee_name"] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}"
        if site:
            shift_data["site_name"] = site.get("name", "")
        
        enriched_shifts.append(shift_data)
    
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
    
    # *** ROSTER VALIDATION ***
    # Check if employee has a rostered shift for current time
    current_time = datetime.utcnow()
    rostered_shift = await db.roster_shifts.find_one({
        "employee_id": request.employee_id,
        "start_time": {"$lte": current_time},
        "end_time": {"$gte": current_time},
        "status": "scheduled"
    })
    
    if not rostered_shift:
        raise HTTPException(
            status_code=403, 
            detail="You are not rostered to work at this time. Please check your roster or contact your supervisor."
        )
    
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
    
    # Create timesheet linked to roster shift
    timesheet = {
        "employee_id": request.employee_id,
        "site_id": request.site_id,
        "roster_shift_id": str(rostered_shift["_id"]),
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
        "rostered_shift": serialize_doc(rostered_shift)
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
    
    # Update timesheet
    await db.timesheets.update_one(
        {"_id": ObjectId(request.timesheet_id)},
        {"$set": {
            "clock_out": clock_out,
            "gps_out_lat": request.gps_lat,
            "gps_out_long": request.gps_long,
            "gps_out_distance": round(distance, 2),
            "gps_out_out_of_bounds": out_of_bounds,
            "total_hours": round(total_hours, 2)
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
async def update_timesheet(
    timesheet_id: str, 
    employee_notes: Optional[str] = None, 
    photo_base64: Optional[str] = None,
    manual_clock_in: Optional[datetime] = None,
    manual_clock_out: Optional[datetime] = None,
    manual_break_minutes: Optional[int] = None
):
    """Update timesheet with employee notes, photo, or manual edits"""
    timesheet = await db.timesheets.find_one({"_id": ObjectId(timesheet_id)})
    
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    
    update_data = {}
    if employee_notes is not None:
        update_data["employee_notes"] = employee_notes
    if photo_base64 is not None:
        update_data["photo_base64"] = photo_base64
    
    # Manual time edits
    if manual_clock_in is not None:
        update_data["clock_in"] = manual_clock_in
        update_data["manually_edited"] = True
        
    if manual_clock_out is not None:
        update_data["clock_out"] = manual_clock_out
        update_data["manually_edited"] = True
        
    if manual_break_minutes is not None:
        update_data["break_minutes"] = manual_break_minutes
        update_data["manually_edited"] = True
    
    # Recalculate total hours if times changed
    if manual_clock_in or manual_clock_out or manual_break_minutes is not None:
        clock_in = manual_clock_in or timesheet.get("clock_in")
        clock_out = manual_clock_out or timesheet.get("clock_out")
        break_mins = manual_break_minutes if manual_break_minutes is not None else timesheet.get("break_minutes", 0)
        
        if clock_in and clock_out:
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
    
    await db.timesheets.update_one(
        {"_id": ObjectId(request.timesheet_id)},
        {"$set": {
            "approval_status": request.status,
            "supervisor_id": request.supervisor_id,
            "notes": request.notes,
            "total_pay": round(total_pay, 2)
        }}
    )
    
    updated = await db.timesheets.find_one({"_id": ObjectId(request.timesheet_id)})
    return {"success": True, "timesheet": serialize_doc(updated)}

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
