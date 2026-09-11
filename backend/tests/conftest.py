import pytest
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.base_class import Base

# Import every model so SQLAlchemy knows which
# tables must be created in the test database.
from app.models.expense import (  # noqa: F401
    Expense,
    ExpenseSplit,
)
from app.models.group import (  # noqa: F401
    Group,
    GroupMember,
)
from app.models.refresh_token import (  # noqa: F401
    RefreshToken,
)
from app.models.settlement import (  # noqa: F401
    Settlement,
)
from app.models.user import User  # noqa: F401


def create_test_database_url():
    """
    Use the same PostgreSQL username, password,
    host and port as the application, but replace
    the database name with splitnest_test.
    """

    application_url = make_url(
        settings.database_url
    )

    test_url = application_url.set(
        database="splitnest_test"
    )

    if test_url.database != "splitnest_test":
        raise RuntimeError(
            "Tests must only use splitnest_test"
        )

    return test_url


@pytest.fixture(scope="session")
def test_engine():
    """
    Create all tables before database tests and
    remove them when the test session finishes.
    """

    database_url = create_test_database_url()

    engine = create_engine(
        database_url,
        pool_pre_ping=True,
    )

    if engine.url.database != "splitnest_test":
        raise RuntimeError(
            "Refusing to run tests outside "
            "splitnest_test"
        )

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    yield engine

    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def db_session(test_engine):
    """
    Give each test its own database transaction.

    After the test finishes, all data created by
    that test is rolled back automatically.
    """

    connection = test_engine.connect()
    transaction = connection.begin()

    session = Session(
        bind=connection,
        autoflush=False,
        expire_on_commit=False,
    )

    try:
        yield session

    finally:
        session.close()

        if transaction.is_active:
            transaction.rollback()

        connection.close()