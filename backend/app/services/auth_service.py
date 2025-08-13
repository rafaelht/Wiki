"""
Servicio de autenticación y gestión de usuarios
"""

import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
import secrets
import logging

from app.models.user import UserCreate, UserLogin, UserResponse, UserRole, TokenData
from app.database.connection import get_database

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self):
        self.secret_key = "your-secret-key-change-in-production"  # TODO: Move to environment variables
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30 * 24 * 60  # 30 days
        
    async def get_database(self) -> AsyncIOMotorDatabase:
        """Get database connection"""
        return await get_database()
    
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def create_access_token(self, data: Dict[Any, Any]) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[TokenData]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            email: str = payload.get("sub")
            user_id: str = payload.get("user_id")
            role: str = payload.get("role")
            
            if email is None or user_id is None:
                return None
                
            token_data = TokenData(
                email=email,
                user_id=user_id,
                role=UserRole(role) if role else UserRole.USER
            )
            return token_data
        except jwt.PyJWTError:
            return None
    
    async def create_user(self, user_create: UserCreate) -> UserResponse:
        """Create a new user"""
        db = await self.get_database()
        users_collection = db.users
        
        # Check if user already exists
        existing_user = await users_collection.find_one({
            "$or": [
                {"email": user_create.email},
                {"username": user_create.username}
            ]
        })
        
        if existing_user:
            if existing_user["email"] == user_create.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        
        # Hash password
        hashed_password = self.hash_password(user_create.password)
        
        # Create user document
        user_doc = {
            "email": user_create.email,
            "username": user_create.username,
            "full_name": user_create.full_name,
            "hashed_password": hashed_password,
            "role": user_create.role.value,
            "is_active": user_create.is_active,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        # Insert user
        result = await users_collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        
        # Count explorations
        explorations_count = await db.explorations.count_documents({"user_id": str(result.inserted_id)})
        
        return UserResponse(
            id=str(result.inserted_id),
            email=user_doc["email"],
            username=user_doc["username"],
            full_name=user_doc["full_name"],
            role=UserRole(user_doc["role"]),
            is_active=user_doc["is_active"],
            created_at=user_doc["created_at"],
            updated_at=user_doc["updated_at"],
            exploration_count=explorations_count
        )
    
    async def authenticate_user(self, login_data: UserLogin) -> Optional[UserResponse]:
        """Authenticate a user with email/username and password"""
        db = await self.get_database()
        users_collection = db.users
        
        # Find user by email or username
        user_doc = await users_collection.find_one({
            "$or": [
                {"email": login_data.email_or_username},
                {"username": login_data.email_or_username}
            ]
        })
        
        if not user_doc:
            return None
        
        # Verify password
        if not self.verify_password(login_data.password, user_doc["hashed_password"]):
            return None
        
        # Check if user is active
        if not user_doc.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is deactivated"
            )
        
        # Count explorations
        explorations_count = await db.explorations.count_documents({"user_id": str(user_doc["_id"])})
        
        return UserResponse(
            id=str(user_doc["_id"]),
            email=user_doc["email"],
            username=user_doc["username"],
            full_name=user_doc.get("full_name"),
            role=UserRole(user_doc["role"]),
            is_active=user_doc["is_active"],
            created_at=user_doc["created_at"],
            updated_at=user_doc["updated_at"],
            exploration_count=explorations_count
        )
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """Get user by ID"""
        db = await self.get_database()
        users_collection = db.users
        
        try:
            from bson import ObjectId
            user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
        except:
            return None
        
        if not user_doc:
            return None
        
        # Count explorations
        explorations_count = await db.explorations.count_documents({"user_id": user_id})
        
        return UserResponse(
            id=str(user_doc["_id"]),
            email=user_doc["email"],
            username=user_doc["username"],
            full_name=user_doc.get("full_name"),
            role=UserRole(user_doc["role"]),
            is_active=user_doc["is_active"],
            created_at=user_doc["created_at"],
            updated_at=user_doc["updated_at"],
            exploration_count=explorations_count
        )
    
    async def create_admin_user(self):
        """Create default admin user if none exists"""
        db = await self.get_database()
        users_collection = db.users
        
        # Check if admin user already exists
        admin_exists = await users_collection.find_one({"role": "admin"})
        if admin_exists:
            return
        
        # Create default admin user
        admin_user = UserCreate(
            email="admin@wikigraph.com",
            username="admin",
            full_name="System Administrator",
            password="admin123456",  # TODO: Generate random password in production
            role=UserRole.ADMIN
        )
        
        await self.create_user(admin_user)
        logger.info("Default admin user created: admin@wikigraph.com / admin123456")

# Global instance
auth_service = AuthService()
