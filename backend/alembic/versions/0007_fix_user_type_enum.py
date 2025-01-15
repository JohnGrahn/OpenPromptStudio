"""fix user type enum

Revision ID: 0007
Revises: 0006
Create Date: 2025-01-14 22:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0007'
down_revision: Union[str, None] = '0006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First remove the default value constraint
    op.execute("ALTER TABLE users ALTER COLUMN user_type DROP DEFAULT")
    
    # Convert user_type back to string temporarily
    op.execute("ALTER TABLE users ALTER COLUMN user_type TYPE varchar USING user_type::varchar")
    
    # Drop the old enum
    op.execute("DROP TYPE usertype")
    
    # Create the new enum with all values
    user_type_enum = sa.Enum(
        "user", "admin", "web_designer", "learning_to_code", "expert_developer",
        name="usertype"
    )
    user_type_enum.create(op.get_bind())
    
    # Convert the column to use the new enum
    op.execute("ALTER TABLE users ALTER COLUMN user_type TYPE usertype USING user_type::usertype")
    op.execute("ALTER TABLE users ALTER COLUMN user_type SET DEFAULT 'user'")
    op.execute("ALTER TABLE users ALTER COLUMN user_type SET NOT NULL")


def downgrade() -> None:
    # Remove default value constraint first
    op.execute("ALTER TABLE users ALTER COLUMN user_type DROP DEFAULT")
    
    # Convert back to string temporarily
    op.execute("ALTER TABLE users ALTER COLUMN user_type TYPE varchar USING user_type::varchar")
    
    # Drop the new enum
    op.execute("DROP TYPE usertype")
    
    # Create the old enum
    user_type_enum = sa.Enum(
        "WEB_DESIGNER", "LEARNING_TO_CODE", "EXPERT_DEVELOPER",
        name="usertype"
    )
    user_type_enum.create(op.get_bind())
    
    # Convert back to the old enum
    op.execute("ALTER TABLE users ALTER COLUMN user_type TYPE usertype USING user_type::usertype")
    op.execute("ALTER TABLE users ALTER COLUMN user_type SET DEFAULT 'WEB_DESIGNER'")
    op.execute("ALTER TABLE users ALTER COLUMN user_type SET NOT NULL") 