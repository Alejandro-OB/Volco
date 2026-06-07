"""add_transport_price_and_is_transport_only

Revision ID: f7a3c2e1b8d9
Revises: d52e1ff334ad
Create Date: 2026-06-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'f7a3c2e1b8d9'
down_revision: Union[str, Sequence[str], None] = 'd52e1ff334ad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('materials', sa.Column('transport_price', sa.Integer(), nullable=True))
    op.add_column('services', sa.Column('is_transport_only', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('services', 'is_transport_only')
    op.drop_column('materials', 'transport_price')
