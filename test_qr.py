import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.core.config import settings
from app.models.user import User, UserAuth, UserProfile
from app.models.qr_token import QRToken
from app.services.qr_service import generate_qr_for_user

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    await init_beanie(database=db, document_models=[User, QRToken])
    
    # Check if there's any user
    user = await User.find_one()
    if not user:
        print("No user found in database.")
        return
        
    print(f"Found user: {user.sahayak_id}")
    qr_token = await generate_qr_for_user(user)
    print(f"Generated Token:\n{qr_token.signed_jwt}")
    
    print("\nToken is successfully generated. The backend signing mechanism works.")
    
asyncio.run(main())
