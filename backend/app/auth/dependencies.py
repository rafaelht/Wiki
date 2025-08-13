"""
Utilidades de autenticación y middleware
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging

from app.models.user import UserResponse, UserRole, TokenData
from app.services.auth_service import auth_service

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[UserResponse]:
    """
    Get current authenticated user from JWT token
    Returns None if not authenticated (for guest mode)
    """
    if not credentials:
        return None
    
    token_data = auth_service.verify_token(credentials.credentials)
    if not token_data:
        return None
    
    user = await auth_service.get_user_by_id(token_data.user_id)
    if not user:
        return None
    
    return user

async def get_current_active_user(
    current_user: UserResponse = Depends(get_current_user)
) -> UserResponse:
    """
    Get current authenticated and active user
    Raises exception if not authenticated
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return current_user

async def get_current_admin_user(
    current_user: UserResponse = Depends(get_current_active_user)
) -> UserResponse:
    """
    Get current user and verify admin role
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return current_user

async def get_user_or_guest(
    current_user: Optional[UserResponse] = Depends(get_current_user)
) -> dict:
    """
    Get current user info or guest mode info
    Used for endpoints that work for both authenticated and guest users
    """
    if current_user:
        return {
            "is_guest": False,
            "user": current_user,
            "user_id": current_user.id,
            "can_save": True
        }
    else:
        return {
            "is_guest": True,
            "user": None,
            "user_id": None,
            "can_save": False
        }
