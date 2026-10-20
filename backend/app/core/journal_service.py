from sqlalchemy.orm import Session
from app.models.accounting import JournalEntry, JournalLine
from datetime import datetime
from typing import List, Dict, Any, Optional
import uuid

def post_double_entry_journal(
    db: Session,
    voucher_type: str, # GRN, TAX_INVOICE, ADVANCE_RECEIPT, KHATA_RECEIPT, SUPPLIER_PAYMENT, EXPENSE, CREDIT_NOTE
    reference_no: str,
    narration: str,
    lines: List[Dict[str, Any]],
    date_str: Optional[str] = None
) -> JournalEntry:
    """
    Creates an immutable double-entry journal transaction ensuring SUM(debit) == SUM(credit).
    Reconciles 1-paisa rounding discrepancies automatically into a Round-off account.
    """
    if not date_str:
        date_str = datetime.utcnow().strftime("%Y-%m-%d")

    entry_no = f"JV-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    total_debit = round(sum(float(l.get("debit", 0.0) or 0.0) for l in lines), 2)
    total_credit = round(sum(float(l.get("credit", 0.0) or 0.0) for l in lines), 2)

    diff = round(total_debit - total_credit, 2)
    if abs(diff) > 0.001:
        if abs(diff) <= 0.05:
            # 1 to 5 paise reconciliation
            if diff > 0:
                # Credit round-off
                lines.append({
                    "account_name": "Round-off Discrepancy",
                    "account_group": "Indirect Expenses",
                    "debit": 0.0,
                    "credit": diff,
                    "party_type": None
                })
                total_credit = round(total_credit + diff, 2)
            else:
                # Debit round-off
                pos_diff = abs(diff)
                lines.append({
                    "account_name": "Round-off Discrepancy",
                    "account_group": "Indirect Expenses",
                    "debit": pos_diff,
                    "credit": 0.0,
                    "party_type": None
                })
                total_debit = round(total_debit + pos_diff, 2)
        else:
            raise ValueError(f"Double-entry ledger imbalance: Debit={total_debit}, Credit={total_credit}, delta={diff}")

    entry = JournalEntry(
        entry_number=entry_no,
        date=date_str,
        voucher_type=voucher_type,
        reference_no=reference_no,
        narration=narration,
        total_debit=total_debit,
        total_credit=total_credit
    )
    db.add(entry)
    db.flush()

    for line_data in lines:
        line = JournalLine(
            journal_entry_id=entry.id,
            account_name=line_data["account_name"],
            account_group=line_data.get("account_group", "General Ledger"),
            debit=round(float(line_data.get("debit", 0.0) or 0.0), 2),
            credit=round(float(line_data.get("credit", 0.0) or 0.0), 2),
            party_type=line_data.get("party_type"),
            party_id=line_data.get("party_id"),
            party_name=line_data.get("party_name")
        )
        db.add(line)

    return entry
