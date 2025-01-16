"""add project user and stack id

Revision ID: 0012
Revises: 0011
Create Date: 2024-01-15 03:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0012'
down_revision = '0011'
branch_labels = None
depends_on = None


def upgrade():
    # Add user_id and stack_id columns to projects table
    op.add_column('projects', sa.Column('user_id', sa.Integer(), nullable=True))
    op.add_column('projects', sa.Column('stack_id', sa.Integer(), nullable=True))
    
    # Add foreign key constraints
    op.create_foreign_key(None, 'projects', 'users', ['user_id'], ['id'])
    op.create_foreign_key(None, 'projects', 'stacks', ['stack_id'], ['id'])


def downgrade():
    # Drop foreign key constraints first
    op.drop_constraint(None, 'projects', type_='foreignkey')
    op.drop_constraint(None, 'projects', type_='foreignkey')
    
    # Drop columns
    op.drop_column('projects', 'user_id')
    op.drop_column('projects', 'stack_id') 