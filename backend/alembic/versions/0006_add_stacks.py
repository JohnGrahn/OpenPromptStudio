"""add stacks table

Revision ID: 0006
Revises: 0005
Create Date: 2024-01-15 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade():
    # Create stacks table
    op.create_table('stacks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('from_registry', sa.String(), nullable=True),
        sa.Column('sandbox_init_cmd', sa.String(), nullable=True),
        sa.Column('sandbox_start_cmd', sa.String(), nullable=True),
        sa.Column('prompt', sa.Text(), nullable=True),
        sa.Column('pack_hash', sa.String(), nullable=True),
        sa.Column('setup_time_seconds', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_stacks_id'), 'stacks', ['id'], unique=False)
    op.create_index(op.f('ix_stacks_title'), 'stacks', ['title'], unique=True)

    # Add stack_id to prepared_sandboxes
    op.add_column('prepared_sandboxes', sa.Column('stack_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'prepared_sandboxes', 'stacks', ['stack_id'], ['id'])


def downgrade():
    op.drop_constraint(None, 'prepared_sandboxes', type_='foreignkey')
    op.drop_column('prepared_sandboxes', 'stack_id')
    op.drop_index(op.f('ix_stacks_title'), table_name='stacks')
    op.drop_index(op.f('ix_stacks_id'), table_name='stacks')
    op.drop_table('stacks') 