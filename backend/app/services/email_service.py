import smtplib
import ssl
import socket
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from email.utils import formatdate
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.email_setting import EmailSetting

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def get_active_config(db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Retrieves the active SMTP configuration from database or falls back to core settings.
        """
        if db:
            try:
                db_config = db.query(EmailSetting).filter(
                    EmailSetting.is_enabled == True,
                    EmailSetting.is_default == True
                ).first()
                if not db_config:
                    db_config = db.query(EmailSetting).filter(EmailSetting.is_enabled == True).first()

                if db_config and db_config.email_id and db_config.password:
                    return {
                        "server_name": db_config.server_name or "Gmail",
                        "smtp_address": db_config.smtp_address or "smtp.gmail.com",
                        "port": db_config.port or 587,
                        "email_id": db_config.email_id,
                        "password": db_config.password,
                        "tls_ssl_required": db_config.tls_ssl_required or "Yes",
                        "sender_name": db_config.sender_name or "Shree Vinayaka Furnitures"
                    }
            except Exception as e:
                logger.warning(f"Could not load email configuration from database: {e}")

        # Fallback to config settings
        return {
            "server_name": "Gmail",
            "smtp_address": settings.SMTP_HOST or "smtp.gmail.com",
            "port": settings.SMTP_PORT or 587,
            "email_id": settings.SMTP_USER or settings.SMTP_DEFAULT_FROM,
            "password": settings.SMTP_PASSWORD or "",
            "tls_ssl_required": "Yes" if settings.SMTP_TLS else "No",
            "sender_name": settings.SMTP_SENDER_NAME or "Shree Vinayaka Furnitures"
        }

    @staticmethod
    def test_smtp_connection(
        smtp_address: str,
        port: int,
        email_id: str,
        password: str,
        tls_ssl_required: str = "Yes",
        server_name: str = "Gmail"
    ) -> Dict[str, Any]:
        """
        Tests connection and authentication to an SMTP server with specific diagnostics.
        """
        if not email_id or not email_id.strip():
            return {
                "success": False,
                "message": "Email ID cannot be blank."
            }

        clean_password = password.strip() if password else ""
        if not clean_password or "••" in clean_password:
            return {
                "success": False,
                "message": (
                    "Please enter a valid password. If connecting to Gmail with 2-Step Verification, "
                    "you must use a 16-character Google App Password (generate at https://myaccount.google.com/apppasswords)."
                )
            }

        timeout = 15
        is_ssl = int(port) == 465 or tls_ssl_required.upper() == "SSL"
        is_tls = tls_ssl_required.upper() in ("YES", "TRUE", "STARTTLS") and not is_ssl

        try:
            context = ssl.create_default_context()
            if is_ssl:
                server = smtplib.SMTP_SSL(smtp_address, port, context=context, timeout=timeout)
            else:
                server = smtplib.SMTP(smtp_address, port, timeout=timeout)
                server.ehlo()
                if is_tls:
                    server.starttls(context=context)
                    server.ehlo()

            # Attempt authentication
            server.login(email_id.strip(), clean_password)
            server.quit()

            return {
                "success": True,
                "message": f"Connection & Authentication Successful! Connected to {smtp_address}:{port} as {email_id}.",
                "server_name": server_name,
                "smtp_address": smtp_address,
                "port": port,
                "email_id": email_id
            }

        except smtplib.SMTPAuthenticationError as auth_err:
            is_gmail = "gmail" in smtp_address.lower() or "gmail" in email_id.lower() or server_name == "Gmail"
            if is_gmail:
                msg = (
                    "Gmail Authentication Failed (535 5.7.8). "
                    "Google does not accept regular account passwords for SMTP. "
                    "You must: 1) Enable 2-Step Verification on your Google Account, "
                    "2) Generate a 16-character 'App Password' at https://myaccount.google.com/apppasswords, "
                    "and 3) Paste that 16-character key into the Password field."
                )
            else:
                msg = f"SMTP Authentication Failed: Invalid Email ID or Password ({auth_err.smtp_error.decode('utf-8', errors='ignore') if isinstance(auth_err.smtp_error, bytes) else auth_err.smtp_error})."
            return {"success": False, "message": msg}

        except smtplib.SMTPServerDisconnected as disc_err:
            is_gmail = "gmail" in smtp_address.lower() or "gmail" in email_id.lower() or server_name == "Gmail"
            if is_gmail:
                msg = (
                    "Gmail unexpectedly closed the connection. "
                    "Google no longer supports standard passwords on SMTP. "
                    "Please ensure 2-Step Verification is active and use a 16-character App Password from https://myaccount.google.com/apppasswords."
                )
            else:
                msg = f"SMTP Server disconnected unexpectedly: {disc_err}"
            return {"success": False, "message": msg}

        except (socket.timeout, TimeoutError):
            return {
                "success": False,
                "message": f"Connection timed out while reaching {smtp_address}:{port}. Check your internet connection, firewall, or port number."
            }

        except (smtplib.SMTPConnectError, ConnectionRefusedError, socket.gaierror) as net_err:
            return {
                "success": False,
                "message": f"Cannot connect to {smtp_address}:{port}. Host or port unreachable ({net_err})."
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"SMTP Connection Error: {str(e)}"
            }

    @classmethod
    def send_email(
        cls,
        to_email: str,
        subject: str,
        body_text: Optional[str] = None,
        body_html: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        config: Optional[Dict[str, Any]] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Dispatches an email with optional HTML formatting and binary attachments (e.g. PDF invoices).
        """
        cfg = config or cls.get_active_config(db)
        email_id = cfg.get("email_id")
        password = cfg.get("password")
        smtp_address = cfg.get("smtp_address", "smtp.gmail.com")
        port = int(cfg.get("port", 587))
        tls_ssl = cfg.get("tls_ssl_required", "Yes")
        sender_name = cfg.get("sender_name", "Shree Vinayaka Furnitures")

        if not email_id or not password or "••" in password:
            return {
                "success": False,
                "message": "Email sending is not configured. Please open Email Settings to configure SMTP credentials with a valid App Password."
            }

        msg = MIMEMultipart("mixed")
        msg["From"] = f"{sender_name} <{email_id}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg["Date"] = formatdate(localtime=True)

        alt_part = MIMEMultipart("alternative")
        if body_text:
            alt_part.attach(MIMEText(body_text, "plain", "utf-8"))
        if body_html:
            alt_part.attach(MIMEText(body_html, "html", "utf-8"))
        elif body_text:
            alt_part.attach(MIMEText(f"<pre style='font-family:sans-serif;'>{body_text}</pre>", "html", "utf-8"))
        msg.attach(alt_part)

        # Attach binary files (e.g. Invoices)
        if attachments:
            for att in attachments:
                filename = att.get("filename", "attachment.pdf")
                content = att.get("content")
                if content:
                    part = MIMEApplication(content, Name=filename)
                    part["Content-Disposition"] = f'attachment; filename="{filename}"'
                    msg.attach(part)

        is_ssl = port == 465 or tls_ssl.upper() == "SSL"
        is_tls = tls_ssl.upper() in ("YES", "TRUE", "STARTTLS") and not is_ssl
        context = ssl.create_default_context()

        try:
            if is_ssl:
                server = smtplib.SMTP_SSL(smtp_address, port, context=context, timeout=20)
            else:
                server = smtplib.SMTP(smtp_address, port, timeout=20)
                server.ehlo()
                if is_tls:
                    server.starttls(context=context)
                    server.ehlo()

            server.login(email_id, password)
            server.send_message(msg)
            server.quit()
            logger.info(f"Email '{subject}' successfully sent to {to_email}")
            return {
                "success": True,
                "message": f"Email successfully dispatched to {to_email}."
            }
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return {
                "success": False,
                "message": f"Failed to send email: {str(e)}"
            }

    @classmethod
    def generate_invoice_email_html(cls, invoice: Any, custom_message: Optional[str] = None) -> str:
        """
        Creates an elegant, branded HTML email template for tax invoices.
        """
        items_rows = ""
        items = getattr(invoice, "items", []) or []
        for idx, it in enumerate(items, 1):
            pname = getattr(it, "product_name", "Furniture Item")
            qty = getattr(it, "qty", 1)
            rate = getattr(it, "rate", 0.0)
            total = getattr(it, "total", 0.0)
            items_rows += f"""
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
                <td style="padding: 8px 10px; color: #475569;">{idx}</td>
                <td style="padding: 8px 10px; font-weight: 600; color: #1e293b;">{pname}</td>
                <td style="padding: 8px 10px; text-align: center; color: #475569;">{qty}</td>
                <td style="padding: 8px 10px; text-align: right; color: #475569;">₹{rate:,.2f}</td>
                <td style="padding: 8px 10px; text-align: right; font-weight: 600; color: #0f172a;">₹{total:,.2f}</td>
            </tr>
            """

        c_msg = f"<p style='color: #334155; font-size: 14px; margin-bottom: 16px; background: #f8fafc; padding: 12px; border-left: 4px solid #1e40af;'>{custom_message}</p>" if custom_message else ""

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }}
            .header {{ background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); color: #ffffff; padding: 24px; text-align: center; }}
            .content {{ padding: 24px; }}
            .badge {{ display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; }}
            .total-box {{ background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center; }}
            .footer {{ background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">SHREE VINAYAKA FURNITURES</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Specialists in Premium Living, Bedroom, Dining & Office Furniture</p>
            </div>
            
            <div class="content">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <span class="badge">TAX INVOICE</span>
                <span style="font-size: 13px; color: #64748b;"><b>Date:</b> {getattr(invoice, 'date', '')}</span>
              </div>

              <h2 style="font-size: 16px; color: #0f172a; margin: 0 0 12px 0;">Invoice #{getattr(invoice, 'invoice_no', '')}</h2>
              <p style="color: #475569; font-size: 14px; margin: 0 0 16px 0;">
                Dear <b>{getattr(invoice, 'customer_name', 'Valued Customer')}</b>,<br/>
                Thank you for your purchase with Shree Vinayaka Furnitures. Your invoice details are summarized below and the official GST Tax Invoice PDF is attached to this email.
              </p>

              {c_msg}

              <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <thead>
                  <tr style="background: #f1f5f9; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase;">
                    <th style="padding: 8px 10px;">#</th>
                    <th style="padding: 8px 10px;">Item Description</th>
                    <th style="padding: 8px 10px; text-align: center;">Qty</th>
                    <th style="padding: 8px 10px; text-align: right;">Rate</th>
                    <th style="padding: 8px 10px; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items_rows}
                </tbody>
              </table>

              <div style="margin-top: 20px; padding: 14px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; text-align: right;">
                <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">Subtotal: ₹{getattr(invoice, 'subtotal', getattr(invoice, 'net_amount', 0)):,.2f}</div>
                <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">GST (CGST+SGST): ₹{getattr(invoice, 'tax_amount', 0):,.2f}</div>
                <div style="font-size: 18px; font-weight: 700; color: #1e3a8a; margin-top: 6px;">Grand Total: ₹{getattr(invoice, 'net_amount', 0):,.2f}</div>
                <div style="font-size: 12px; color: #16a34a; font-weight: 600; margin-top: 4px;">Paid: ₹{getattr(invoice, 'paid_amount', 0):,.2f} | Mode: {getattr(invoice, 'payment_mode', 'Cash')}</div>
              </div>

              <div style="margin-top: 24px; padding: 12px; background: #e0f2fe; border-radius: 6px; font-size: 13px; color: #0369a1; text-align: center;">
                📎 <b>Official GST Tax Invoice Attached (PDF)</b><br/>
                Please keep the attached document for your records and warranty claims.
              </div>
            </div>

            <div class="footer">
              <b>Shree Vinayaka Furnitures</b><br/>
              NH Bypass Road, Kozhikode, Kerala - 673004<br/>
              Phone: +91 98470 12345 | Email: sales@vinayakafurnitures.com | GSTIN: 32AABCS1429B1Z8
            </div>
          </div>
        </body>
        </html>
        """
        return html

    @classmethod
    def send_invoice_email(
        cls,
        db: Session,
        invoice_id_or_no: Any,
        to_email: str,
        custom_message: Optional[str] = None,
        subject: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Loads invoice, creates PDF attachment, and dispatches invoice email to customer.
        """
        from app.models.sale import SaleInvoice
        from app.api.v1.endpoints.sales import generate_invoice_pdf_bytes

        # Look up by ID or by invoice_no
        invoice = None
        if isinstance(invoice_id_or_no, int) or (isinstance(invoice_id_or_no, str) and invoice_id_or_no.isdigit()):
            invoice = db.query(SaleInvoice).filter(SaleInvoice.id == int(invoice_id_or_no)).first()
        if not invoice and isinstance(invoice_id_or_no, str):
            invoice = db.query(SaleInvoice).filter(SaleInvoice.invoice_no == invoice_id_or_no).first()

        if not invoice:
            return {
                "success": False,
                "message": f"Invoice '{invoice_id_or_no}' not found in database."
            }

        # Generate PDF
        try:
            pdf_bytes = generate_invoice_pdf_bytes(invoice)
        except Exception as e:
            logger.error(f"Error generating invoice PDF for email: {e}")
            pdf_bytes = None

        email_subject = subject or f"Tax Invoice #{invoice.invoice_no} - Shree Vinayaka Furnitures"
        html_body = cls.generate_invoice_email_html(invoice, custom_message)
        text_body = f"Dear {invoice.customer_name},\n\nPlease find attached your Tax Invoice #{invoice.invoice_no} for ₹{invoice.net_amount:,.2f}.\n\nThank you for choosing Shree Vinayaka Furnitures."

        attachments = []
        if pdf_bytes:
            attachments.append({
                "filename": f"Invoice_{invoice.invoice_no}.pdf",
                "content": pdf_bytes,
                "content_type": "application/pdf"
            })

        return cls.send_email(
            to_email=to_email,
            subject=email_subject,
            body_text=text_body,
            body_html=html_body,
            attachments=attachments,
            db=db
        )
