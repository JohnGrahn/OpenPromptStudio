"""add project team id

Revision ID: 0011
Revises: 0010
Create Date: 2025-01-14 22:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0011'
down_revision: Union[str, None] = '0010'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add team_id column to projects table
    op.add_column('projects',
        sa.Column('team_id', sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        'fk_projects_team_id_teams',
        'projects', 'teams',
        ['team_id'], ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    op.drop_constraint('fk_projects_team_id_teams', 'projects', type_='foreignkey')
    op.drop_column('projects', 'team_id') 