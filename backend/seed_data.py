#!/usr/bin/env python3
"""Seed script to populate initial data for testing"""

import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def seed_data():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🌱 Starting data seeding...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.sites.delete_many({})
    await db.shifts.delete_many({})
    await db.timesheets.delete_many({})
    print("✓ Cleared existing data")
    
    # Create Sites
    sites = [
        {
            "name": "Novotel Brisbane",
            "address": "200 Creek St, Brisbane City QLD 4000",
            "gps_lat": -27.4698,
            "gps_long": 153.0251,
            "radius_meters": 100
        },
        {
            "name": "Ibis Styles Brisbane",
            "address": "27 Turbot St, Brisbane City QLD 4000",
            "gps_lat": -27.4670,
            "gps_long": 153.0235,
            "radius_meters": 100
        },
        {
            "name": "Hotel Grand Chancellor",
            "address": "23 Leichhardt St, Spring Hill QLD 4000",
            "gps_lat": -27.4650,
            "gps_long": 153.0262,
            "radius_meters": 100
        }
    ]
    
    site_results = await db.sites.insert_many(sites)
    site_ids = [str(id) for id in site_results.inserted_ids]
    print(f"✓ Created {len(sites)} sites")
    
    # Create Users
    users = [
        # Admin
        {
            "first_name": "John",
            "last_name": "Admin",
            "phone": "0457802302",
            "email": "info@supremehospitalityservices.com.au",
            "role": "admin",
            "job_title": "Admin Manager",
            "site_id": site_ids[0],
            "award_level": 5,
            "pin": "1234",
            "status": "active",
            "created_at": datetime.utcnow()
        },
        # Supervisor
        {
            "first_name": "Sarah",
            "last_name": "Wilson",
            "phone": "0412345678",
            "email": "sarah@supremehospitalityservices.com.au",
            "role": "supervisor",
            "job_title": "Housekeeping Supervisor",
            "site_id": site_ids[0],
            "award_level": 3,
            "pin": "5678",
            "status": "active",
            "created_at": datetime.utcnow()
        },
        # Employees
        {
            "first_name": "Emma",
            "last_name": "Johnson",
            "phone": "0423456789",
            "email": "emma.j@example.com",
            "role": "employee",
            "job_title": "Room Attendant",
            "site_id": site_ids[0],
            "award_level": 2,
            "pin": "1111",
            "status": "active",
            "created_at": datetime.utcnow()
        },
        {
            "first_name": "Michael",
            "last_name": "Brown",
            "phone": "0434567890",
            "email": "michael.b@example.com",
            "role": "employee",
            "job_title": "Houseman",
            "site_id": site_ids[0],
            "award_level": 2,
            "pin": "2222",
            "status": "active",
            "created_at": datetime.utcnow()
        },
        {
            "first_name": "Lisa",
            "last_name": "Davis",
            "phone": "0445678901",
            "email": "lisa.d@example.com",
            "role": "employee",
            "job_title": "Public Area Attendant",
            "site_id": site_ids[1],
            "award_level": 1,
            "pin": "3333",
            "status": "active",
            "created_at": datetime.utcnow()
        }
    ]
    
    user_results = await db.users.insert_many(users)
    user_ids = [str(id) for id in user_results.inserted_ids]
    print(f"✓ Created {len(users)} users")
    
    # Create some completed shifts and timesheets
    today = datetime.utcnow()
    yesterday = today - timedelta(days=1)
    
    # Yesterday's completed timesheet for Emma (pending approval)
    timesheet1 = {
        "employee_id": user_ids[2],  # Emma
        "site_id": site_ids[0],
        "clock_in": yesterday.replace(hour=8, minute=0, second=0),
        "clock_out": yesterday.replace(hour=16, minute=30, second=0),
        "gps_in_lat": -27.4698,
        "gps_in_long": 153.0251,
        "gps_out_lat": -27.4698,
        "gps_out_long": 153.0251,
        "break_minutes": 30,
        "total_hours": 8.0,
        "approval_status": "pending",
        "created_at": yesterday
    }
    
    # Yesterday's completed timesheet for Michael (pending approval)
    timesheet2 = {
        "employee_id": user_ids[3],  # Michael
        "site_id": site_ids[0],
        "clock_in": yesterday.replace(hour=9, minute=0, second=0),
        "clock_out": yesterday.replace(hour=17, minute=0, second=0),
        "gps_in_lat": -27.4698,
        "gps_in_long": 153.0251,
        "gps_out_lat": -27.4698,
        "gps_out_long": 153.0251,
        "break_minutes": 30,
        "total_hours": 7.5,
        "approval_status": "pending",
        "created_at": yesterday
    }
    
    # Approved timesheet from 2 days ago
    two_days_ago = today - timedelta(days=2)
    timesheet3 = {
        "employee_id": user_ids[2],  # Emma
        "site_id": site_ids[0],
        "clock_in": two_days_ago.replace(hour=8, minute=0, second=0),
        "clock_out": two_days_ago.replace(hour=16, minute=0, second=0),
        "gps_in_lat": -27.4698,
        "gps_in_long": 153.0251,
        "gps_out_lat": -27.4698,
        "gps_out_long": 153.0251,
        "break_minutes": 30,
        "total_hours": 7.5,
        "approval_status": "approved",
        "supervisor_id": user_ids[1],  # Sarah
        "notes": "Great work!",
        "created_at": two_days_ago
    }
    
    await db.timesheets.insert_many([timesheet1, timesheet2, timesheet3])
    print(f"✓ Created 3 sample timesheets")
    
    print("\n✅ Seed data completed successfully!")
    print("\n📱 Test Accounts:")
    print("\n👨‍💼 Admin:")
    print("   Phone: 0457802302")
    print("   Email: info@supremehospitalityservices.com.au")
    print("   PIN: 1234")
    print("\n👩‍💼 Supervisor:")
    print("   Phone: 0412345678")
    print("   Email: sarah@supremehospitalityservices.com.au")
    print("   PIN: 5678")
    print("\n👷 Employee (Emma):")
    print("   Phone: 0423456789")
    print("   Email: emma.j@example.com")
    print("   PIN: 1111")
    print("\n👷 Employee (Michael):")
    print("   Phone: 0434567890")
    print("   Email: michael.b@example.com")
    print("   PIN: 2222")
    print("\n👷 Employee (Lisa):")
    print("   Phone: 0445678901")
    print("   Email: lisa.d@example.com")
    print("   PIN: 3333")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
