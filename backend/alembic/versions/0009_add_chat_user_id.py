"""add chat user id

Revision ID: 0009
Revises: 0008
Create Date: 2025-01-14 22:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0009'
down_revision: Union[str, None] = '0008'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add user_id column to chats table
    op.add_column('chats', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'chats', 'users', ['user_id'], ['id'])


def downgrade() -> None:
    # Drop foreign key first
    op.drop_constraint(None, 'chats', type_='foreignkey')
    # Drop user_id column
    op.drop_column('chats', 'user_id') 