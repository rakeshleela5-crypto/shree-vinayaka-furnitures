from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.core.database import get_db
from app.models.customer import Customer, LoyaltyTransaction
from app.models.sale import SaleInvoice

router = APIRouter()
logger = logging.getLogger("svf.portal")

@router.get("/customer-profile")
def get_customer_portal_profile(
    phone: Optional[str] = Query(None),
    customer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Customer Showroom Portal - Self-Service Authentication and Profile
    """
    query = db.query(Customer)
    if customer_id:
        cust = query.filter(Customer.id == customer_id).first()
    elif phone:
        cust = query.filter(Customer.phone == phone.strip()).first()
    else:
        # Fallback to demo walk-in customer
        cust = query.first()
    
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found in showroom directory.")
    
    # Loyalty ledger
    loyalty_txns = db.query(LoyaltyTransaction).filter(
        LoyaltyTransaction.customer_id == cust.id
    ).order_by(LoyaltyTransaction.id.desc()).limit(20).all()

    return {
        "id": cust.id,
        "code": cust.code,
        "name": cust.name,
        "phone": cust.phone,
        "email": cust.email,
        "city": cust.city,
        "loyalty_points": float(cust.loyalty_points or 0.0),
        "credit_limit": float(cust.credit_limit or 0.0),
        "current_balance": float(cust.current_balance or 0.0),
        "recent_loyalty_transactions": [
            {
                "id": t.id,
                "date": t.date,
                "bill_no": t.bill_no,
                "type": t.type,
                "points": t.points,
                "equivalent_amount": t.equivalent_amount,
                "balance_after": t.balance_points_after
            }
            for t in loyalty_txns
        ]
    }

@router.get("/invoices")
def get_customer_portal_invoices(
    customer_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    Fetch all verified invoices and warranty records for a customer.
    """
    invoices = db.query(SaleInvoice).filter(
        SaleInvoice.customer_id == customer_id
    ).order_by(SaleInvoice.id.desc()).all()

    return [
        {
            "id": inv.id,
            "invoice_no": inv.invoice_no,
            "date": inv.date,
            "bill_type": inv.bill_type,
            "grand_total": float(inv.grand_total or 0.0),
            "paid_amount": float(inv.paid_amount or 0.0),
            "balance_due": float(inv.balance_due or 0.0),
            "payment_mode": inv.payment_mode,
            "status": inv.status,
            "delivery_state": inv.delivery_state,
            "items_count": len(inv.items) if inv.items else 0
        }
        for inv in invoices
    ]
