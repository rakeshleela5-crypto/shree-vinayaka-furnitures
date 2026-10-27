"""phase1_concurrency_and_performance

Revision ID: 4f7c81a93b21
Revises: 2b98fe7734b3
Create Date: 2026-10-27 16:35:00.000000

Features #4, #5, #14, #15, #20, #21, #23, #24, #25, #26, #80, #94:
- Strategic Indexing & Query Optimization (products, product_boxes, invoices, payments, customers)
- Multi-Box Knock-Down Inventory (product_boxes table)
- Assembly Tasks & Optimistic Locking (version columns on products, quotations, assembly_tasks)
- Standardized UTC TIMESTAMPTZ support
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '4f7c81a93b21'
down_revision: Union[str, Sequence[str], None] = '2b98fe7734b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = set(insp.get_table_names())
    is_postgres = (bind.dialect.name == "postgresql")

    # 1. Create product_boxes table if not exists (#5, #20)
    if 'product_boxes' not in existing_tables:
        op.create_table(
            'product_boxes',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('product_id', sa.Integer(), sa.ForeignKey('products.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('box_number', sa.Integer(), nullable=False),
            sa.Column('total_boxes', sa.Integer(), nullable=False),
            sa.Column('component_name', sa.String(length=200), nullable=False),
            sa.Column('barcode_uid', sa.String(length=100), unique=True, nullable=False, index=True),
            sa.Column('box_barcode', sa.String(length=100), nullable=True, index=True),
            sa.Column('box_sku', sa.String(length=100), nullable=True),
            sa.Column('dimensions', sa.String(length=100), nullable=True),
            sa.Column('weight_kg', sa.Float(), nullable=True, server_default='0.0'),
            sa.Column('godown', sa.String(length=100), nullable=True),
            sa.Column('rack', sa.String(length=100), nullable=True),
            sa.Column('status', sa.String(length=50), nullable=True, server_default='InStock'),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )

    # 2. Create assembly_tasks table if not exists (#25)
    if 'assembly_tasks' not in existing_tables:
        op.create_table(
            'assembly_tasks',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('task_no', sa.String(length=100), unique=True, nullable=False, index=True),
            sa.Column('invoice_no', sa.String(length=100), nullable=True, index=True),
            sa.Column('product_id', sa.Integer(), sa.ForeignKey('products.id', ondelete='CASCADE'), nullable=True, index=True),
            sa.Column('carpenter_name', sa.String(length=100), nullable=True),
            sa.Column('carpenter_phone', sa.String(length=50), nullable=True),
            sa.Column('status', sa.String(length=50), nullable=True, server_default='PENDING'),
            sa.Column('scheduled_date', sa.DateTime(timezone=True), nullable=True),
            sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )

    # Helper function to safely add columns
    def add_col_if_missing(tbl, col_name, col_obj):
        cols = {c['name'].lower() for c in insp.get_columns(tbl)}
        if col_name.lower() not in cols:
            try:
                op.add_column(tbl, col_obj)
            except Exception:
                pass

    # 3. Add version and sku columns (#20, #25)
    if 'products' in existing_tables:
        add_col_if_missing('products', 'sku', sa.Column('sku', sa.String(50), nullable=True))
        add_col_if_missing('products', 'version', sa.Column('version', sa.Integer(), nullable=False, server_default='1'))

    if 'quotations' in existing_tables:
        add_col_if_missing('quotations', 'version', sa.Column('version', sa.Integer(), nullable=False, server_default='1'))

    if 'product_box_components' in existing_tables:
        add_col_if_missing('product_box_components', 'barcode_uid', sa.Column('barcode_uid', sa.String(100), nullable=True))

    if 'sale_invoices' in existing_tables:
        add_col_if_missing('sale_invoices', 'invoice_number', sa.Column('invoice_number', sa.String(100), nullable=True))
        add_col_if_missing('sale_invoices', 'payment_status', sa.Column('payment_status', sa.String(50), nullable=True, server_default='PAID'))

    if 'sale_invoice_payments' in existing_tables:
        add_col_if_missing('sale_invoice_payments', 'decentro_txn_id', sa.Column('decentro_txn_id', sa.String(100), nullable=True))

    if 'furniture_assembly_logs' in existing_tables:
        add_col_if_missing('furniture_assembly_logs', 'version', sa.Column('version', sa.Integer(), nullable=False, server_default='1'))

    if 'workshop_job_cards' in existing_tables:
        add_col_if_missing('workshop_job_cards', 'version', sa.Column('version', sa.Integer(), nullable=False, server_default='1'))

    # 4. Strategic Indexes Creation (#20, #21)
    def create_idx_if_missing(idx_name, tbl, cols, unique=False, postgres_where=None):
        try:
            if is_postgres and postgres_where:
                op.execute(f"CREATE UNIQUE INDEX IF NOT EXISTS {idx_name} ON {tbl} ({', '.join(cols)}) WHERE {postgres_where};")
            else:
                op.create_index(idx_name, tbl, cols, unique=unique)
        except Exception:
            pass

    create_idx_if_missing('ix_products_sku', 'products', ['sku'])
    create_idx_if_missing('ix_product_boxes_barcode_uid', 'product_boxes', ['barcode_uid'], unique=True)
    create_idx_if_missing('ix_product_box_components_barcode_uid', 'product_box_components', ['barcode_uid'])
    create_idx_if_missing('ix_sale_invoices_invoice_number', 'sale_invoices', ['invoice_number'])
    create_idx_if_missing('ix_sale_invoices_cust_created', 'sale_invoices', ['customer_id', 'created_at'])
    create_idx_if_missing('ix_sale_invoices_payment_status', 'sale_invoices', ['payment_status'])
    create_idx_if_missing('ix_sale_invoice_payments_decentro', 'sale_invoice_payments', ['decentro_txn_id'])
    create_idx_if_missing('ix_customers_phone', 'customers', ['phone'])
    create_idx_if_missing(
        'ix_payments_utr_number_unique',
        'sale_invoice_payments',
        ['utr_number'],
        unique=True,
        postgres_where="utr_number IS NOT NULL AND utr_number != ''"
    )


def downgrade() -> None:
    try:
        op.drop_index('ix_payments_utr_number_unique', table_name='sale_invoice_payments')
        op.drop_index('ix_customers_phone', table_name='customers')
        op.drop_index('ix_sale_invoice_payments_decentro', table_name='sale_invoice_payments')
        op.drop_index('ix_sale_invoices_payment_status', table_name='sale_invoices')
        op.drop_index('ix_sale_invoices_cust_created', table_name='sale_invoices')
        op.drop_index('ix_sale_invoices_invoice_number', table_name='sale_invoices')
        op.drop_index('ix_product_box_components_barcode_uid', table_name='product_box_components')
        op.drop_index('ix_product_boxes_barcode_uid', table_name='product_boxes')
        op.drop_index('ix_products_sku', table_name='products')
        op.drop_table('assembly_tasks')
        op.drop_table('product_boxes')
    except Exception:
        pass
