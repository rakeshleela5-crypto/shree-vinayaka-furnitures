from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.email_setting import EmailSetting
from app.schemas.email import (
    EmailConfigBase,
    EmailConfigOut,
    EmailTestRequest,
    EmailTestResponse,
    EmailSendRequest,
    InvoiceEmailRequest
)
from app.services.email_service import EmailService

router = APIRouter()

@router.get("/config", response_model=EmailConfigOut)
def get_email_config(db: Session = Depends(get_db)):
    """
    Returns current active email/SMTP configuration with masked password.
    """
    setting = db.query(EmailSetting).filter(EmailSetting.is_default == True).first()
    if not setting:
        setting = db.query(EmailSetting).first()

    if not setting:
        # Create default initial record
        setting = EmailSetting(
            server_name="Gmail",
            smtp_address="smtp.gmail.com",
            email_id="shreevinayakafurnitures@gmail.com",
            password="",
            port=587,
            tls_ssl_required="Yes",
            is_default=True,
            is_enabled=True,
            sender_name="Shree Vinayaka Furnitures"
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)

    has_pw = bool(setting.password and len(setting.password) > 0)
    return EmailConfigOut(
        id=setting.id,
        server_name=setting.server_name,
        smtp_address=setting.smtp_address,
        email_id=setting.email_id,
        port=setting.port,
        tls_ssl_required=setting.tls_ssl_required,
        is_default=setting.is_default,
        is_enabled=setting.is_enabled,
        sender_name=setting.sender_name,
        has_password=has_pw,
        password_masked="••••••••••••" if has_pw else "",
        updated_at=setting.updated_at
    )

@router.post("/config", response_model=EmailConfigOut)
def save_email_config(payload: EmailConfigBase, db: Session = Depends(get_db)):
    """
    Saves or updates email SMTP settings in database.
    """
    setting = db.query(EmailSetting).filter(EmailSetting.is_default == True).first()
    if not setting:
        setting = db.query(EmailSetting).first()

    if not setting:
        setting = EmailSetting()
        db.add(setting)

    setting.server_name = payload.server_name or "Gmail"
    setting.smtp_address = payload.smtp_address or "smtp.gmail.com"
    setting.email_id = payload.email_id
    setting.port = payload.port or 587
    setting.tls_ssl_required = payload.tls_ssl_required or "Yes"
    setting.is_default = payload.is_default
    setting.is_enabled = payload.is_enabled
    setting.sender_name = payload.sender_name or "Shree Vinayaka Furnitures"

    # Only update password if a real non-masked value was supplied
    if payload.password and "••" not in payload.password:
        setting.password = payload.password.strip()

    db.commit()
    db.refresh(setting)

    has_pw = bool(setting.password and len(setting.password) > 0)
    return EmailConfigOut(
        id=setting.id,
        server_name=setting.server_name,
        smtp_address=setting.smtp_address,
        email_id=setting.email_id,
        port=setting.port,
        tls_ssl_required=setting.tls_ssl_required,
        is_default=setting.is_default,
        is_enabled=setting.is_enabled,
        sender_name=setting.sender_name,
        has_password=has_pw,
        password_masked="••••••••••••" if has_pw else "",
        updated_at=setting.updated_at
    )

@router.post("/test-connection", response_model=EmailTestResponse)
def test_connection(payload: EmailTestRequest, db: Session = Depends(get_db)):
    """
    Tests SMTP connection and authentication to Gmail or any SMTP server.
    """
    password_to_test = payload.password
    # If the user sent masked dots, try using the saved password in the database
    if (not password_to_test or "••" in password_to_test):
        existing = db.query(EmailSetting).filter(EmailSetting.email_id == payload.email_id).first()
        if not existing:
            existing = db.query(EmailSetting).first()
        if existing and existing.password:
            password_to_test = existing.password

    res = EmailService.test_smtp_connection(
        smtp_address=payload.smtp_address,
        port=payload.port,
        email_id=payload.email_id,
        password=password_to_test,
        tls_ssl_required=payload.tls_ssl_required or "Yes",
        server_name=payload.server_name or "Gmail"
    )
    return EmailTestResponse(**res)

@router.post("/send")
def send_email_endpoint(payload: EmailSendRequest, db: Session = Depends(get_db)):
    """
    Sends a general email notification or statement.
    """
    res = EmailService.send_email(
        to_email=payload.to_email,
        subject=payload.subject,
        body_text=payload.message,
        body_html=payload.html_content,
        db=db
    )
    if not res.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res.get("message"))
    return res

@router.post("/send-invoice/{invoice_id_or_no}")
def send_invoice_endpoint(
    invoice_id_or_no: str,
    payload: InvoiceEmailRequest,
    db: Session = Depends(get_db)
):
    """
    Generates tax invoice PDF and sends it directly to customer email.
    """
    res = EmailService.send_invoice_email(
        db=db,
        invoice_id_or_no=invoice_id_or_no,
        to_email=payload.to_email,
        custom_message=payload.custom_message,
        subject=payload.subject
    )
    if not res.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res.get("message"))
    return res
