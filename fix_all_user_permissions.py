#!/usr/bin/env python3
"""
Fix permissions for ALL existing users in the database
This will update everyone's permissions based on their role
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

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
            "manage_roster": False,  # Can be enabled by admin
            "view_reports": False,   # Can be enabled by admin
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

async def fix_all_permissions():
    """Fix permissions for all users"""
    
    # Connect to MongoDB
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.getenv('DB_NAME', 'test_database')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🔧 Fixing permissions for all users...")
    print("=" * 60)
    
    # Get all users
    users = await db.users.find({}).to_list(1000)
    
    print(f"\n📊 Found {len(users)} users")
    
    updated_count = 0
    
    for user in users:
        user_id = user["_id"]
        role = user.get("role", "employee")
        current_permissions = user.get("permissions", {})
        correct_permissions = get_default_permissions(role)
        
        # Check if permissions need updating
        if current_permissions != correct_permissions:
            print(f"\n👤 Updating {user.get('first_name', '')} {user.get('last_name', '')} (Role: {role})")
            print(f"   Phone: {user.get('phone')}")
            print(f"   Old permissions: {current_permissions}")
            print(f"   New permissions: {correct_permissions}")
            
            # Update permissions
            await db.users.update_one(
                {"_id": user_id},
                {"$set": {"permissions": correct_permissions}}
            )
            
            updated_count += 1
            print(f"   ✅ Updated")
        else:
            print(f"✅ {user.get('first_name', '')} {user.get('last_name', '')} - Already has correct permissions")
    
    print(f"\n" + "=" * 60)
    print(f"✅ Updated {updated_count} users")
    print(f"📊 Total users: {len(users)}")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(fix_all_permissions())
