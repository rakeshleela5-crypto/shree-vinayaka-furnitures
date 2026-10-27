"""phase2_idempotency_audit_deadletter

Revision ID: 7a8b9c0d1e2f
Revises: 4f7c81a93b21
Create Date: 2026-10-27 17:35:00.000000

Features #1, #10, #11, #12, #13, #17, #35, #38, #39, #92, #100, #103, #104, #105, #109:
- Idempotency Keys table (idempotency_keys)
- Dead Letter Webhooks table (dead_letter_webhooks)
- Append-Only Financial Audit Logs table (audit_logs)
- Strategic indexes on audit logs, idempotency expiration, and dead letter status
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '7a8b9c0d1e2f'
down_revision: Union[str, Sequence[str], None] = '4f7c81a93b21'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = set(insp.get_table_names())

    # 1. Create idempotency_keys table (#1)
    if 'idempotency_keys' not in existing_tables:
        op.create_table(
            'idempotency_keys',
            sa.Column('key', sa.String(length=128), primary_key=True, index=True),
            sa.Column('endpoint', sa.String(length=255), nullable=False),
            sa.Column('request_hash', sa.String(length=128), nullable=False),
            sa.Column('response_status', sa.Integer(), nullable=True),
            sa.Column('response_body', sa.Text(), nullable=True),
            sa.Column('status', sa.String(length=32), nullable=False, server_default='IN_PROGRESS'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        )
        op.create_index('ix_idempotency_keys_expires_at', 'idempotency_keys', ['expires_at'])
        op.create_index('ix_idempotency_keys_status', 'idempotency_keys', ['status'])

    # 2. Create dead_letter_webhooks table (#17, #35, #38, #39)
    if 'dead_letter_webhooks' not in existing_tables:
        op.create_table(
            'dead_letter_webhooks',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, index=True),
            sa.Column('provider', sa.String(length=64), nullable=False, server_default='DECENTRO'),
            sa.Column('event_type', sa.String(length=128), nullable=True),
            sa.Column('headers', sa.Text(), nullable=True),
            sa.Column('payload', sa.Text(), nullable=False),
            sa.Column('error_message', sa.Text(), nullable=True),
            sa.Column('traceback', sa.Text(), nullable=True),
            sa.Column('status', sa.String(length=32), nullable=False, server_default='PENDING_REPLAY'),
            sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('last_attempt_at', sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index('ix_dead_letter_webhooks_provider', 'dead_letter_webhooks', ['provider'])
        op.create_index('ix_dead_letter_webhooks_status', 'dead_letter_webhooks', ['status'])

    # 3. Create audit_logs table (#105)
    if 'audit_logs' not in existing_tables:
        op.create_table(
            'audit_logs',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, index=True),
            sa.Column('actor_id', sa.String(length=64), nullable=True),
            sa.Column('role', sa.String(length=64), nullable=True),
            sa.Column('action', sa.String(length=64), nullable=False),
            sa.Column('entity_type', sa.String(length=64), nullable=False),
            sa.Column('entity_id', sa.String(length=64), nullable=True),
            sa.Column('before_state', sa.Text(), nullable=True),
            sa.Column('after_state', sa.Text(), nullable=True),
            sa.Column('ip_address', sa.String(length=64), nullable=True),
            sa.Column('request_id', sa.String(length=64), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index('ix_audit_logs_action_created_at', 'audit_logs', ['action', 'created_at'])
        op.create_index('ix_audit_logs_entity', 'audit_logs', ['entity_type', 'entity_id'])
        op.create_index('ix_audit_logs_actor_id', 'audit_logs', ['actor_id'])
        op.create_index('ix_audit_logs_request_id', 'audit_logs', ['request_id'])


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = set(insp.get_table_names())

    if 'audit_logs' in existing_tables:
        op.drop_table('audit_logs')
    if 'dead_letter_webhooks' in existing_tables:
        op.drop_table('dead_letter_webhooks')
    if 'idempotency_keys' in existing_tables:
        op.drop_table('idempotency_keys')
