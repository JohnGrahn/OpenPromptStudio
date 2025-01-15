"""add user fields

Revision ID: 0004
Revises: 0003
Create Date: 2025-01-14 22:10:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0004'
down_revision: Union[str, None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the enum type first
    user_type_enum = sa.Enum(
        "WEB_DESIGNER", "LEARNING_TO_CODE", "EXPERT_DEVELOPER", name="usertype"
    )
    user_type_enum.create(op.get_bind())

    # Convert existing user_type column to use the enum
    op.execute("ALTER TABLE users ALTER COLUMN user_type TYPE usertype USING user_type::usertype")
    op.execute("ALTER TABLE users ALTER COLUMN user_type SET DEFAULT 'WEB_DESIGNER'")
    op.execute("ALTER TABLE users ALTER COLUMN user_type SET NOT NULL")

    # Add email_verified column
    op.add_column(
        "users",
        sa.Column(
            "email_verified", sa.Boolean(), nullable=False, server_default="false"
        ),
    )


def downgrade() -> None:
    # Drop email_verified column
    op.drop_column("users", "email_verified")

    # Convert user_type back to string
    op.execute("ALTER TABLE users ALTER COLUMN user_type TYPE varchar USING user_type::varchar")
    op.execute("ALTER TABLE users ALTER COLUMN user_type DROP NOT NULL")
    op.execute("ALTER TABLE users ALTER COLUMN user_type DROP DEFAULT")

    # Drop the enum type
    user_type_enum = sa.Enum(name="usertype")
    user_type_enum.drop(op.get_bind())