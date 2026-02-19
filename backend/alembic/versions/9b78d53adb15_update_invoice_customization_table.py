"""Update invoice customization table

Revision ID: 9b78d53adb15
Revises: 2b20eb5f16b9
Create Date: 2025-12-05 12:07:06.592331

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '9b78d53adb15'
down_revision: Union[str, Sequence[str], None] = '2b20eb5f16b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'invoice_customizations',  # tu tabla real
        'include_banck_info',
        new_column_name='include_bank_info'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'invoice_customizations',
        'include_bank_info',
        new_column_name='include_banck_info'
    )
