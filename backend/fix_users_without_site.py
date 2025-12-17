from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def fix_users():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Get first site
    default_site = await db.sites.find_one()
    if not default_site:
        print("No sites found!")
        return
    
    site_id = str(default_site['_id'])
    print(f"Default site: {default_site['name']} ({site_id})")
    
    # Find users without site_id
    users_without_site = await db.users.find({"$or": [{"site_id": None}, {"site_id": ""}]}).to_list(1000)
    print(f"Found {len(users_without_site)} users without site")
    
    for user in users_without_site:
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"site_id": site_id}}
        )
        print(f"  Fixed: {user.get('first_name', '')} {user.get('last_name', '')}")
    
    print("Done!")

if __name__ == "__main__":
    asyncio.run(fix_users())
