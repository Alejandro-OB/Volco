import sys
import os
from sqlmodel import Session, select, create_engine
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db import engine
from app.models import InvoiceCustomization

with Session(engine) as session:
    results = session.exec(select(InvoiceCustomization)).all()
    for row in results:
        print(f"ID: {row.id}, Provider: {row.provider_id}, account_id: {row.service_account_id}, apply_to_all: {row.apply_to_all_accounts}")
