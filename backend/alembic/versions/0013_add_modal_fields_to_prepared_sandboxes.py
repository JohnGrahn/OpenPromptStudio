"""add modal fields to prepared sandboxes

Revision ID: 0013
Revises: 0012
Create Date: 2024-01-15 03:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0013'
down_revision = '0012'
branch_labels = None
depends_on = None


def upgrade():
    # Add modal fields to prepared_sandboxes table
    op.add_column('prepared_sandboxes', sa.Column('modal_sandbox_id', sa.String(), nullable=True))
    op.add_column('prepared_sandboxes', sa.Column('modal_volume_label', sa.String(), nullable=True))


def downgrade():
    # Drop modal fields from prepared_sandboxes table
    op.drop_column('prepared_sandboxes', 'modal_sandbox_id')
    op.drop_column('prepared_sandboxes', 'modal_volume_label') 