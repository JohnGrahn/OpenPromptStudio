"""project fields

Revision ID: 0005
Revises: 0004
Create Date: 2024-01-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade():
    # Add last_accessed and sandbox_id columns to projects table
    op.add_column('projects', sa.Column('last_accessed', sa.DateTime(), nullable=True))
    op.add_column('projects', sa.Column('sandbox_id', sa.String(), nullable=True))
    
    # Update existing projects to have last_accessed = updated_at
    op.execute('UPDATE projects SET last_accessed = updated_at WHERE last_accessed IS NULL')


def downgrade():
    op.drop_column('projects', 'last_accessed')
    op.drop_column('projects', 'sandbox_id') 