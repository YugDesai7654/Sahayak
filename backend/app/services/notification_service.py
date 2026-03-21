from typing import Optional
import logging

logger = logging.getLogger(__name__)


async def send_sms(phone: str, message: str) -> bool:
    """Send SMS via MSG91. Gracefully degrades if not configured."""
    from app.core.config import settings
    if not settings.MSG91_API_KEY:
        logger.info(f"[SMS Mock] To: {phone} | Message: {message}")
        return True

    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.msg91.com/api/v5/flow/",
                headers={
                    "authkey": settings.MSG91_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "sender": settings.MSG91_SENDER_ID or "SAHAYAK",
                    "route": "4",
                    "country": "91",
                    "sms": [{"message": message, "to": [phone]}]
                }
            )
            return response.status_code == 200
    except Exception as e:
        logger.error(f"SMS send failed: {e}")
        return False


async def send_push_notification(token: str, title: str, body: str) -> bool:
    """Send push notification via FCM. Gracefully degrades if not configured."""
    from app.core.config import settings
    if not settings.FCM_SERVER_KEY:
        logger.info(f"[Push Mock] Token: {token[:20]}... | Title: {title} | Body: {body}")
        return True

    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://fcm.googleapis.com/fcm/send",
                headers={
                    "Authorization": f"key={settings.FCM_SERVER_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "to": token,
                    "notification": {"title": title, "body": body}
                }
            )
            return response.status_code == 200
    except Exception as e:
        logger.error(f"Push notification failed: {e}")
        return False
