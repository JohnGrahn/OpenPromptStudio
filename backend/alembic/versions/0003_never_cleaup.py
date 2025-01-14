"""never cleanup

Revision ID: 0003
Revises: 0002
Create Date: 2025-01-14 20:20:12.277067

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd38dc4da3d79'
down_revision: Union[str, None] = '2d4428e2908e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('projects', sa.Column('modal_never_cleanup', sa.Boolean(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('projects', 'modal_never_cleanup')
    # ### end Alembic commands ###