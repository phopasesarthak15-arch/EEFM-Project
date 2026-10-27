import io
import csv
from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from app.database import get_db
from app.models.all_models import Transaction
from app.schemas.all_schemas import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    EXPENSE_CATEGORIES,
    INCOME_CATEGORIES
)

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    transaction_type: Optional[str] = None,
    search: Optional[str] = None,
    order_by: str = Query("date", pattern="^(date|amount)$"),
    order_dir: str = Query("desc", pattern="^(asc|desc)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)

    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if category:
        query = query.filter(Transaction.category == category)
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type.lower())
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (Transaction.description.ilike(search_fmt)) |
            (Transaction.category.ilike(search_fmt))
        )

    # Ordering
    col = Transaction.amount if order_by == "amount" else Transaction.date
    if order_dir == "asc":
        query = query.order_by(asc(col), asc(Transaction.id))
    else:
        query = query.order_by(desc(col), desc(Transaction.id))

    return query.offset(skip).limit(limit).all()

@router.get("/export-csv")
def export_transactions_csv(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    transaction_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if category:
        query = query.filter(Transaction.category == category)
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type.lower())
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (Transaction.description.ilike(search_fmt)) |
            (Transaction.category.ilike(search_fmt))
        )

    txs = query.order_by(desc(Transaction.date), desc(Transaction.id)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Date", "Description", "Amount (INR)", "Type", "Category", "Payment Method", "Notes", "Recurring", "Is Demo"])

    for tx in txs:
        writer.writerow([
            tx.id,
            tx.date.strftime("%Y-%m-%d"),
            tx.description,
            f"{tx.amount:.2f}",
            tx.transaction_type,
            tx.category,
            tx.payment_method,
            tx.notes or "",
            "Yes" if tx.is_recurring else "No",
            "Yes" if tx.is_demo else "No"
        ])

    output.seek(0)
    filename = f"transactions_{date.today().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/import-csv/preview")
async def preview_csv_import(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    decoded = content.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(decoded))

    valid_rows = []
    errors = []

    row_num = 1
    for row in reader:
        row_num += 1
        # Normalize keys
        cleaned_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}

        # Date
        date_str = cleaned_row.get("date")
        parsed_date = None
        if date_str:
            for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y"):
                try:
                    parsed_date = datetime.strptime(date_str, fmt).date()
                    break
                except ValueError:
                    continue
        if not parsed_date:
            errors.append(f"Row {row_num}: Invalid date format '{date_str}'. Expected YYYY-MM-DD or DD-MM-YYYY.")
            continue

        # Description
        desc = cleaned_row.get("description", "").strip()
        if not desc:
            errors.append(f"Row {row_num}: Description cannot be empty.")
            continue

        # Amount
        amt_str = cleaned_row.get("amount", cleaned_row.get("amount (inr)", ""))
        try:
            amt = float(amt_str)
            if amt <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            errors.append(f"Row {row_num}: Invalid positive amount '{amt_str}'.")
            continue

        # Type
        ttype = cleaned_row.get("type", cleaned_row.get("transaction_type", "expense")).lower()
        if ttype not in ["income", "expense"]:
            errors.append(f"Row {row_num}: Invalid transaction type '{ttype}'. Must be 'income' or 'expense'.")
            continue

        # Category
        cat = cleaned_row.get("category", "Miscellaneous")
        method = cleaned_row.get("payment method", cleaned_row.get("payment_method", "UPI"))
        notes = cleaned_row.get("notes", "")

        valid_rows.append({
            "date": parsed_date.strftime("%Y-%m-%d"),
            "description": desc,
            "amount": round(amt, 2),
            "transaction_type": ttype,
            "category": cat,
            "payment_method": method,
            "notes": notes
        })

    return {
        "total_parsed": len(valid_rows) + len(errors),
        "valid_count": len(valid_rows),
        "error_count": len(errors),
        "errors": errors[:15], # cap sample errors
        "valid_preview": valid_rows[:10],
        "all_valid_rows": valid_rows
    }

@router.post("/import-csv/commit")
def commit_csv_import(rows: List[TransactionCreate], db: Session = Depends(get_db)):
    if not rows:
        raise HTTPException(status_code=400, detail="No rows provided for import.")

    created = []
    for r in rows:
        tx = Transaction(
            date=r.date,
            description=r.description,
            amount=r.amount,
            transaction_type=r.transaction_type,
            category=r.category,
            payment_method=r.payment_method,
            notes=r.notes,
            is_recurring=r.is_recurring,
            is_demo=False
        )
        db.add(tx)
        created.append(tx)

    db.commit()
    return {"message": f"Successfully imported {len(created)} transactions.", "imported_count": len(created)}

@router.get("/{id}", response_model=TransactionResponse)
def get_transaction(id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx

@router.post("", response_model=TransactionResponse, status_code=201)
def create_transaction(data: TransactionCreate, db: Session = Depends(get_db)):
    tx = Transaction(
        date=data.date,
        description=data.description,
        amount=data.amount,
        transaction_type=data.transaction_type,
        category=data.category,
        payment_method=data.payment_method,
        notes=data.notes,
        is_recurring=data.is_recurring,
        is_demo=False
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

@router.put("/{id}", response_model=TransactionResponse)
def update_transaction(id: int, data: TransactionUpdate, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(tx, key, value)

    db.commit()
    db.refresh(tx)
    return tx

@router.delete("/{id}", status_code=200)
def delete_transaction(id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(tx)
    db.commit()
    return {"message": "Transaction deleted successfully", "id": id}
