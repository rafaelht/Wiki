"""
Router para endpoints de autenticación
"""

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPAuthorizationCredentials
from typing import List
from datetime import datetime, timedelta
import logging
from bson import ObjectId

from app.models.user import (
    UserCreate, UserLogin, UserResponse, Token, 
    UserRole, UserStats, UserUpdate
)
from app.services.auth_service import auth_service
from app.auth.dependencies import (
    get_current_active_user, get_current_admin_user, security
)

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    """
    Registrar un nuevo usuario
    """
    try:
        # Use auth service to create user
        user = await auth_service.create_user(user_data)
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during registration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during registration"
        )


@router.post("/login", response_model=Token)
async def login_user(login_data: UserLogin):
    """
    Login user and return access token
    """
    try:
        user = await auth_service.authenticate_user(login_data)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email/username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token = auth_service.create_access_token(
            data={
                "sub": user.email,
                "user_id": user.id,
                "role": user.role.value
            }
        )
        
        logger.info(f"User logged in: {user.email}")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=auth_service.access_token_expire_minutes * 60,
            user=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during authentication"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get current user information
    """
    return current_user

@router.post("/logout")
async def logout_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Logout user (client-side token invalidation)
    """
    # In a real implementation, you might want to blacklist the token
    # For now, we just confirm the logout
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Successfully logged out"}

@router.get("/guest-info")
async def get_guest_info():
    """
    Get information for guest users
    """
    return {
        "is_guest": True,
        "message": "You are using guest mode",
        "limitations": [
            "Cannot save explorations",
            "Limited to temporary sessions",
            "No exploration history"
        ],
        "benefits_of_registration": [
            "Save and organize explorations",
            "Access exploration history",
            "Share explorations with others"
        ]
    }

# Admin endpoints
@router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_admin: UserResponse = Depends(get_current_admin_user)
):
    """
    Get all users (admin only)
    """
    try:
        db = await auth_service.get_database()
        users_collection = db.users
        
        # Get users with pagination
        cursor = users_collection.find().skip(skip).limit(limit).sort("created_at", -1)
        users_docs = await cursor.to_list(length=limit)
        
        users = []
        for user_doc in users_docs:
            # Count explorations for each user
            explorations_count = await db.explorations.count_documents(
                {"user_id": str(user_doc["_id"])}
            )
            
            user = UserResponse(
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
            users.append(user)
        
        return users
        
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving users"
        )

@router.get("/admin/stats", response_model=UserStats)
async def get_user_stats(
    current_admin: UserResponse = Depends(get_current_admin_user)
):
    """
    Get user statistics (admin only)
    """
    try:
        db = await auth_service.get_database()
        users_collection = db.users
        
        # Get statistics
        total_users = await users_collection.count_documents({})
        active_users = await users_collection.count_documents({"is_active": True})
        admin_users = await users_collection.count_documents({"role": "admin"})
        regular_users = await users_collection.count_documents({"role": "user"})
        
        # Recent registrations (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_registrations = await users_collection.count_documents({
            "created_at": {"$gte": week_ago}
        })
        
        return UserStats(
            total_users=total_users,
            active_users=active_users,
            admin_users=admin_users,
            regular_users=regular_users,
            recent_registrations=recent_registrations
        )
        
    except Exception as e:
        logger.error(f"Error getting user stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user statistics"
        )

@router.put("/admin/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_admin: UserResponse = Depends(get_current_admin_user)
):
    """
    Update user (admin only)
    """
    try:
        db = await auth_service.get_database()
        users_collection = db.users
        
        # Build update document
        update_doc = {}
        if user_update.email:
            update_doc["email"] = user_update.email
        if user_update.username:
            update_doc["username"] = user_update.username
        if user_update.full_name is not None:
            update_doc["full_name"] = user_update.full_name
        if user_update.is_active is not None:
            update_doc["is_active"] = user_update.is_active
        if user_update.role:
            update_doc["role"] = user_update.role.value
        
        if update_doc:
            update_doc["updated_at"] = datetime.utcnow()
            
            result = await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_doc}
            )
            
            if result.matched_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
        
        # Get updated user
        updated_user = await auth_service.get_user_by_id(user_id)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        logger.info(f"User updated by admin {current_admin.email}: {updated_user.email}")
        return updated_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user"
        )

@router.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    current_admin: UserResponse = Depends(get_current_admin_user)
):
    """
    Delete user (admin only)
    """
    try:
        # Prevent admin from deleting themselves
        if user_id == current_admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        db = await auth_service.get_database()
        users_collection = db.users
        
        result = await users_collection.delete_one({"_id": ObjectId(user_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Also delete user's explorations
        await db.explorations.delete_many({"user_id": user_id})
        
        logger.info(f"User deleted by admin {current_admin.email}: {user_id}")
        return {"message": "User deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting user"
        )
