from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def cleanup():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Get all pay rates
    all_rates = await db.pay_rates.find().to_list(1000)
    print(f"Total pay rates: {len(all_rates)}")
    
    # Keep track of seen award_levels
    seen_levels = set()
    ids_to_delete = []
    
    for rate in all_rates:
        level = rate['award_level']
        if level in seen_levels:
            ids_to_delete.append(rate['_id'])
        else:
            seen_levels.add(level)
    
    print(f"Duplicates to delete: {len(ids_to_delete)}")
    
    # Delete duplicates
    if ids_to_delete:
        result = await db.pay_rates.delete_many({"_id": {"$in": ids_to_delete}})
        print(f"Deleted {result.deleted_count} duplicate pay rates")
    
    # Verify
    remaining = await db.pay_rates.find().to_list(1000)
    print(f"Remaining pay rates: {len(remaining)}")
    for rate in remaining:
        print(f"  Level {rate['award_level']}: ${rate['weekday_rate']}/hr")

if __name__ == "__main__":
    asyncio.run(cleanup())
