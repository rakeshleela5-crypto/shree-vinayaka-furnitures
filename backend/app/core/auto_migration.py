"""
backend/app/core/auto_migration.py
Automated safe schema verification and idempotent ALTER TABLE migrations on startup.
Prevents Railway PostgreSQL UndefinedColumn crashes when new columns are introduced in models.py.
"""
import logging
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)

# List of all tables and columns to ensure exist in the database
SCHEMA_MIGRATIONS = {
    "products": [
        ("sku_code", "VARCHAR(50)"),
        ("brand", "VARCHAR(100) DEFAULT 'Godrej Interio'"),
        ("landed_cost", "NUMERIC(14, 2) DEFAULT 0.0"),
        ("mrp_inclusive_gst", "NUMERIC(14, 2) DEFAULT 0.0"),
        ("min_floor_price", "NUMERIC(14, 2) DEFAULT 0.0"),
        ("total_packets_per_unit", "INTEGER DEFAULT 1"),
        ("godown_available_qty", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("showroom_display_qty", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("reserved_booked_qty", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("damaged_quarantine_qty", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("allow_floor_sample_sale", "BOOLEAN DEFAULT FALSE"),
        ("is_knockdown", "BOOLEAN DEFAULT FALSE"),
        ("total_boxes", "INTEGER DEFAULT 1"),
        ("total_boxes_count", "INTEGER DEFAULT 1"),
        ("assembly_required", "BOOLEAN DEFAULT FALSE"),
        ("assembly_lead_time_mins", "INTEGER DEFAULT 0"),
        ("physical_stock", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("current_stock", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("reserved_stock", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("display_stock", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("damaged_stock", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("transit_stock", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("reorder_quantity", "NUMERIC(12, 2) DEFAULT 5.0"),
        ("lead_time_days", "INTEGER DEFAULT 7"),
        ("hsn_code", "VARCHAR(50) DEFAULT '9403'"),
        ("gst_rate", "NUMERIC(5, 2) DEFAULT 18.0"),
        ("purchase_price", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("mrp", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("retail_price", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("wholesale_price", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("min_wholesale_quantity", "NUMERIC(12, 2) DEFAULT 1.0"),
        ("item_type", "VARCHAR(20) DEFAULT 'PRODUCT'"),
        ("cess_percent", "NUMERIC(5, 2) DEFAULT 0.0"),
        ("material", "VARCHAR(100)"),
        ("dimensions", "VARCHAR(100)"),
        ("color", "VARCHAR(50)"),
        ("warranty", "VARCHAR(100) DEFAULT '3 Years Comprehensive'"),
    ],
    "company_profiles": [
        ("signature_url", "VARCHAR(500)"),
        ("logo_url", "VARCHAR(500)"),
        ("invoice_header_note", "VARCHAR(255)"),
        ("invoice_footer_note", "TEXT"),
    ],
    "sale_invoices": [
        ("delivery_state", "VARCHAR(50) DEFAULT 'BOOKED'"),
        ("is_advance_booking", "BOOLEAN DEFAULT FALSE"),
        ("is_custom_mto", "BOOLEAN DEFAULT FALSE"),
        ("workshop_job_card_no", "VARCHAR(100)"),
        ("advance_adjusted", "NUMERIC(14, 2) DEFAULT 0.0"),
        ("tax_inclusive", "BOOLEAN DEFAULT TRUE"),
        ("e_way_bill_details", "TEXT"),
        ("payment_splits_json", "TEXT"),
        ("utr_number", "VARCHAR(100)"),
        ("subvention_percent", "NUMERIC(5, 2) DEFAULT 0.0"),
        ("eway_bill_no", "VARCHAR(100)"),
        ("vehicle_no", "VARCHAR(50)"),
        ("sub_total", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("bill_discount", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("coupon_discount", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("coupon_code", "VARCHAR(100)"),  # W2-1 fix: track which coupon was applied
        ("loyalty_redeemed_amt", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("sale_return_adjusted_amt", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("cgst_total", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("sgst_total", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("igst_total", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("cess_total", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("round_off", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("grand_total", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("paid_amount", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("balance_due", "NUMERIC(12, 2) DEFAULT 0.0"),
    ],
    "sale_invoice_items": [
        ("rate", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("mrp", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("purchase_rate", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("discount_amount", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("taxable_amount", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("cgst_amount", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("sgst_amount", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("igst_amount", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("cess_amount", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("total", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("salesman_commission_amount", "NUMERIC(12, 2) DEFAULT 0.0"),
    ],
    "sale_invoice_payments": [
        ("payment_mode", "VARCHAR(50) NOT NULL DEFAULT 'Cash'"),
        ("amount", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("utr_number", "VARCHAR(100)"),
        ("card_network", "VARCHAR(50)"),
        ("card_last_four", "VARCHAR(10)"),
        ("subvention_percent", "NUMERIC(5, 2) DEFAULT 0.0"),
        ("subvention_fee", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("bank_account_id", "INTEGER"),
        ("reference_no", "VARCHAR(100)"),
        ("status", "VARCHAR(50) DEFAULT 'Completed'"),
        ("notes", "TEXT"),
    ],
    "delivery_notes": [
        ("state", "VARCHAR(100) DEFAULT 'Kerala'"),
        ("stage", "VARCHAR(50) DEFAULT 'PENDING_PACKET_VERIFICATION'"),
        ("gate_pass_no", "VARCHAR(100)"),
        ("gate_pass_issued_at", "TIMESTAMP"),
        ("verified_packets_json", "TEXT"),
        ("cod_collected", "NUMERIC(14, 2) DEFAULT 0.0"),
        ("credit_override_reason", "TEXT"),
        ("signed_challan_photo_url", "VARCHAR(500)"),
        ("driver_name", "VARCHAR(100)"),
        ("driver_phone", "VARCHAR(50)"),
        ("eway_bill_no", "VARCHAR(100)"),
        ("technician_name", "VARCHAR(100)"),
        ("technician_phone", "VARCHAR(50)"),
        ("carpenter_name", "VARCHAR(100)"),
        ("carpenter_phone", "VARCHAR(50)"),
        ("assembly_slot", "VARCHAR(100)"),
        ("installation_otp", "VARCHAR(10)"),
        ("assembly_notes", "TEXT"),
        ("dispatched_at", "TIMESTAMP"),
        ("assembled_at", "TIMESTAMP"),
        ("delivered_at", "TIMESTAMP"),
        ("installed_at", "TIMESTAMP"),
        ("csat_rating", "INTEGER"),
        ("csat_tags", "VARCHAR(255)"),
        ("csat_feedback", "TEXT"),
        ("csat_logged_at", "TIMESTAMP"),
        ("csat_followup_status", "VARCHAR(50) DEFAULT 'Pending'"),
        ("cod_utr", "VARCHAR(100)"),
    ],
    "sale_returns": [
        ("credit_note_no", "VARCHAR(100)"),
        ("destination_bucket", "VARCHAR(50) DEFAULT 'godown_available_qty'"),
    ],
    "bank_statement_entries": [
        ("balance", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("utr_number", "VARCHAR(100)"),
        ("status", "VARCHAR(50) DEFAULT 'Unreconciled'"),
        ("reconciled_party_type", "VARCHAR(50)"),
        ("reconciled_party_id", "INTEGER"),
        ("reconciled_party_name", "VARCHAR(200)"),
        ("reconciled_ref_no", "VARCHAR(100)"),
        ("reconciled_at", "TIMESTAMP"),
    ],
    "customers": [
        ("credit_limit", "NUMERIC(12, 2) DEFAULT 50000.0"),
        ("opening_balance", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("current_balance", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("pan", "VARCHAR(20)"),
        ("virtual_account_number", "VARCHAR(100)"),
        ("virtual_account_ifsc", "VARCHAR(50)"),
        ("virtual_account_vpa", "VARCHAR(100)"),
    ],
    "payment_transactions": [
        ("reference_id", "VARCHAR(100)"),
        ("provider_txn_id", "VARCHAR(100)"),
        ("invoice_id", "INTEGER"),
        ("delivery_order_id", "INTEGER"),
        ("customer_id", "INTEGER"),
        ("payment_mode", "VARCHAR(50) DEFAULT 'DECENTRO_UPI_QR'"),
        ("amount", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("status", "VARCHAR(50) DEFAULT 'PENDING'"),
        ("utr_number", "VARCHAR(100)"),
        ("qr_base64", "TEXT"),
        ("upi_uri", "VARCHAR(500)"),
        ("expiry_minutes", "INTEGER DEFAULT 15"),
        ("settled_at", "TIMESTAMP"),
    ],
    "customer_ledger_entries": [
        ("debit", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("credit", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("balance", "NUMERIC(12, 2) DEFAULT 0.0"),
    ],
    "suppliers": [
        ("opening_balance", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("current_balance", "NUMERIC(12, 2) DEFAULT 0.0"),
    ],
    "purchase_invoices": [
        ("sub_total", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("cgst", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("sgst", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("igst", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("cess", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("round_off", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("grand_total", "NUMERIC(12, 2) DEFAULT 0.0"),
    ],
    "purchase_orders": [
        ("total_ordered_qty", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("total_received_qty", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("total_damaged_qty", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("sub_total", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("tax_amount", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("grand_total", "NUMERIC(12, 2) DEFAULT 0.0"),
    ],
    "goods_receipt_notes": [
        ("supplier_invoice_no", "VARCHAR(100)"),
        ("supplier_invoice_date", "VARCHAR(50)"),
        ("freight_hamali_cost", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("journal_entry_id", "INTEGER"),
        ("total_received_good", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("total_received_damaged", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("vendor_debit_amount", "NUMERIC(12, 2) DEFAULT 0.0"),
    ],
    "goods_receipt_note_items": [
        ("target_location", "VARCHAR(50) DEFAULT 'GODOWN'"),
        ("is_knockdown", "BOOLEAN DEFAULT FALSE"),
        ("packets_per_unit", "INTEGER DEFAULT 1"),
        ("total_packets_received", "INTEGER"),
        ("missing_packets_count", "INTEGER DEFAULT 0"),
    ],
    "stock_ledger_events": [
        ("sku_code", "VARCHAR(50)"),
        ("packet_id", "INTEGER"),
        ("bucket", "VARCHAR(50) DEFAULT 'godown_available_qty'"),
        ("reason_code", "VARCHAR(255)"),
        ("performed_by", "VARCHAR(100) DEFAULT 'System'"),
        ("notes", "TEXT"),
    ],
    "emi_schedules": [
        ("invoice_id", "INTEGER"),
        ("customer_id", "INTEGER"),
        ("provider", "VARCHAR(100) DEFAULT 'Bajaj Finserv'"),
        ("loan_account_no", "VARCHAR(100)"),
        ("tenure_months", "INTEGER DEFAULT 6"),
        ("total_financed_amount", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("monthly_amount", "NUMERIC(12, 2) DEFAULT 0.0"),
        ("start_date", "VARCHAR(50)"),
        ("next_due_date", "VARCHAR(50)"),
        ("status", "VARCHAR(50) DEFAULT 'ACTIVE'"),
    ],
}

def verify_and_migrate_schema(engine: Engine, base) -> None:
    """
    1. Runs Base.metadata.create_all(bind=engine) to create any new tables.
    2. Inspects existing tables and issues safe ALTER TABLE statements to add any
       missing columns, preventing UndefinedColumn crashes on Railway PostgreSQL.
    """
    logger.info("Verifying database schema and creating tables...")
    base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    is_postgres = (engine.dialect.name == "postgresql")

    with engine.connect() as conn:
        for table_name, columns in SCHEMA_MIGRATIONS.items():
            if table_name not in existing_tables:
                continue

            # Fetch existing column names for this table
            existing_cols = {col["name"].lower() for col in inspector.get_columns(table_name)}

            for col_name, col_def in columns:
                if col_name.lower() in existing_cols:
                    continue

                try:
                    if is_postgres:
                        # PostgreSQL native idempotent column addition
                        sql = f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {col_name} {col_def};"
                    else:
                        # SQLite / standard SQL column addition
                        sql = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_def};"

                    conn.execute(text(sql))
                    conn.commit()
                    existing_cols.add(col_name.lower())
                    logger.info(f"Auto-migrated column: {table_name}.{col_name}")
                except Exception as ex:
                    conn.rollback()
                    logger.debug(f"Skipped {table_name}.{col_name}: {ex}")

        # Ensure physical_stock is populated from current_stock if uninitialized
        if "products" in existing_tables:
            try:
                conn.execute(text(
                    "UPDATE products SET physical_stock = current_stock "
                    "WHERE (physical_stock IS NULL OR physical_stock = 0.0) AND current_stock > 0;"
                ))
                conn.commit()
            except Exception as ex:
                conn.rollback()
                logger.debug(f"Physical stock backfill note: {ex}")

    logger.info("Database schema verification and auto-migration finished successfully.")
