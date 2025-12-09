import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_roster_data():
    """Seed initial roster shifts for the next 7 days"""
    
    print("🌱 Seeding roster data...")
    
    # Get users and sites
    users = await db.users.find({"role": "employee"}).to_list(100)
    sites = await db.sites.find({}).to_list(100)
    
    if not users or not sites:
        print("❌ No users or sites found. Please run seed_data.py first.")
        return
    
    # Clear existing roster shifts
    await db.roster_shifts.delete_many({})
    print("✅ Cleared existing roster shifts")
    
    # Get admin user for created_by
    admin = await db.users.find_one({"role": "admin"})
    if not admin:
        print("❌ No admin user found")
        return
    
    admin_id = str(admin["_id"])
    
    # Create shifts for the next 7 days
    shifts_created = 0
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    for day_offset in range(7):
        shift_date = today + timedelta(days=day_offset)
        
        # Skip weekends for some employees (simulate realistic scheduling)
        is_weekend = shift_date.weekday() >= 5
        
        for i, user in enumerate(users):
            # Skip some employees on weekends
            if is_weekend and i % 2 == 0:
                continue
            
            # Assign to different sites
            site = sites[i % len(sites)]
            
            # Create morning shift (8am - 4pm)
            if i % 3 != 2:  # Not everyone works every day
                start_time = shift_date.replace(hour=8, minute=0)
                end_time = shift_date.replace(hour=16, minute=0)
                
                shift = {
                    "employee_id": str(user["_id"]),
                    "site_id": str(site["_id"]),
                    "role": user.get("job_title", "Room Attendant"),
                    "start_time": start_time,
                    "end_time": end_time,
                    "status": "scheduled",
                    "created_by": admin_id,
                    "notes": "Regular shift",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                await db.roster_shifts.insert_one(shift)
                shifts_created += 1
    
    # Seed some default availability for employees
    await db.availability.delete_many({})
    print("✅ Cleared existing availability")
    
    for user in users:
        # Default availability: Monday to Friday, 8am-6pm
        for day in range(5):  # Mon-Fri
            availability = {
                "employee_id": str(user["_id"]),
                "day_of_week": day,
                "available": True,
                "start_time": "08:00",
                "end_time": "18:00",
                "created_at": datetime.utcnow()
            }
            await db.availability.insert_one(availability)
        
        # Weekend unavailable by default
        for day in range(5, 7):  # Sat-Sun
            availability = {
                "employee_id": str(user["_id"]),
                "day_of_week": day,
                "available": False,
                "start_time": None,
                "end_time": None,
                "created_at": datetime.utcnow()
            }
            await db.availability.insert_one(availability)
    
    print(f"✅ Created {shifts_created} roster shifts for the next 7 days")
    print(f"✅ Created availability for {len(users)} employees")
    print("✨ Roster seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_roster_data())
