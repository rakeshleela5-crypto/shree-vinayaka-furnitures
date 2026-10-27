"""phase4_security_backups_feature_flags

Revision ID: 9c8b7a6d5e4f
Revises: 7a8b9c0d1e2f
Create Date: 2026-10-27 20:30:00.000000

Features #47, #48, #61, #67, #69, #74, #76, #97, #98:
- Refresh Tokens table with token rotation & revocation support (refresh_tokens)
- Dynamic Feature Flags table (feature_flags)
- Strategic indexes on refresh tokens and feature flag keys
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '9c8b7a6d5e4f'
down_revision: Union[str, Sequence[str], None] = '7a8b9c0d1e2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = set(insp.get_table_names())

    # 1. Create refresh_tokens table (#47, #48)
    if 'refresh_tokens' not in existing_tables:
        op.create_table(
            'refresh_tokens',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, autoincrement=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('token_hash', sa.String(length=255), unique=True, nullable=False, index=True),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False, index=True),
            sa.Column('is_revoked', sa.Boolean(), nullable=False, server_default=sa.text('false'), index=True),
            sa.Column('device_info', sa.String(length=255), nullable=True),
            sa.Column('ip_address', sa.String(length=50), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

    # 2. Create feature_flags table (#61, #67, #69, #74, #76)
    if 'feature_flags' not in existing_tables:
        op.create_table(
            'feature_flags',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, autoincrement=True),
            sa.Column('key', sa.String(length=100), unique=True, nullable=False, index=True),
            sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default=sa.text('false')),
            sa.Column('description', sa.String(length=255), nullable=True),
            sa.Column('updated_by', sa.String(length=100), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        )


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = set(insp.get_table_names())

    if 'feature_flags' in existing_tables:
        op.drop_table('feature_flags')
    if 'refresh_tokens' in existing_tables:
        op.drop_table('refresh_tokens')
