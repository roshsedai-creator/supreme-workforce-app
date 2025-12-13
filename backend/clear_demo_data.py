"""
Clear all demo/seed data and keep only admin account
Run this to prepare for production rollout
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def clear_demo_data():
    """Clear all demo data but keep admin account"""
    
    # Connect to MongoDB
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.getenv('DB_NAME', 'test_database')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🗑️  Clearing demo data...")
    
    # Keep admin, delete all other users
    admin_phone = "0457802302"
    result = await db.users.delete_many({"phone": {"$ne": admin_phone}})
    print(f"✅ Deleted {result.deleted_count} demo employees")
    
    # Clear all timesheets
    result = await db.timesheets.delete_many({})
    print(f"✅ Deleted {result.deleted_count} timesheets")
    
    # Clear all roster shifts
    result = await db.roster_shifts.delete_many({})
    print(f"✅ Deleted {result.deleted_count} roster shifts")
    
    # Clear all leave requests
    result = await db.leave_requests.delete_many({})
    print(f"✅ Deleted {result.deleted_count} leave requests")
    
    # Clear availability
    result = await db.employee_availability.delete_many({})
    print(f"✅ Deleted {result.deleted_count} availability records")
    
    # Clear shift swaps
    result = await db.shift_swap_requests.delete_many({})
    print(f"✅ Deleted {result.deleted_count} shift swap requests")
    
    # Clear templates
    result = await db.roster_templates.delete_many({})
    print(f"✅ Deleted {result.deleted_count} roster templates")
    
    # Keep sites and pay rates (you need these)
    print("✅ Kept sites and pay rates")
    
    # Update admin account - make sure it's clean
    await db.users.update_one(
        {"phone": admin_phone},
        {"$set": {
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
            "email": "admin@yourcompany.com",
            "job_title": "System Administrator"
        }}
    )
    print("✅ Admin account updated")
    
    print("\n🎉 Database cleaned! Ready for production.")
    print(f"\n👤 Admin Login:")
    print(f"   Phone: {admin_phone}")
    print(f"   PIN: 1234")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_demo_data())
