from datetime import date, timedelta
import random
from sqlalchemy.orm import Session
from app.models.all_models import Profile, Transaction, Budget, SavingsGoal, SavingsContribution, OptimizationStatus

def load_demo_dataset(db: Session, as_of_date: date = date.today()) -> int:
    # 1. Reset existing demo data idempotently
    clear_demo_dataset(db)

    # 2. Update/create profile
    profile = db.query(Profile).first()
    if not profile:
        profile = Profile(
            student_name="Aarav Sharma",
            monthly_allowance=15000.0,
            part_time_income=4000.0,
            scholarship_income=0.0,
            monthly_savings_target=2500.0,
            living_arrangement="hostel",
            fixed_monthly_expenses=3800.0,
            is_onboarded=True,
            currency="INR"
        )
        db.add(profile)
    else:
        profile.student_name = "Aarav Sharma"
        profile.monthly_allowance = 15000.0
        profile.part_time_income = 4000.0
        profile.scholarship_income = 0.0
        profile.monthly_savings_target = 2500.0
        profile.living_arrangement = "hostel"
        profile.fixed_monthly_expenses = 3800.0
        profile.is_onboarded = True
        profile.currency = "INR"

    # 3. Generate 90 days of realistic synthetic transactions
    # Generating from (as_of_date - 90 days) up to as_of_date
    tx_count = 0
    start_date = as_of_date - timedelta(days=90)

    # Incomes: 1st of each month allowance + 15th part-time work
    curr = start_date
    while curr <= as_of_date:
        if curr.day == 1:
            db.add(Transaction(
                date=curr,
                description="Monthly Family Allowance / Pocket Money",
                amount=15000.0,
                transaction_type="income",
                category="Pocket Money",
                payment_method="Net Banking",
                notes="Received from parents",
                is_recurring=True,
                is_demo=True
            ))
            tx_count += 1
        elif curr.day == 15:
            db.add(Transaction(
                date=curr,
                description="Part-Time Campus Library Assistant Stipend",
                amount=4000.0,
                transaction_type="income",
                category="Part-Time Work",
                payment_method="UPI",
                notes="Bi-weekly library assistant stipend",
                is_recurring=True,
                is_demo=True
            ))
            tx_count += 1
        curr += timedelta(days=1)

    # Daily expenses generation with realistic student patterns
    # Deterministic seed for reproducibility
    rng = random.Random(42)

    food_items = [
        ("Campus Mess Extra & Tea", 85.0),
        ("Canteen Lunch Special", 140.0),
        ("Evening Snacks with Batchmates", 110.0),
        ("Hostel Late Night Maggi & Coffee", 65.0),
        ("Biryani Corner Weekend Treat", 280.0),
        ("Fruit Juice & Shakes", 60.0),
        ("Campus Bakery Pastry & Cold Coffee", 130.0)
    ]

    transport_items = [
        ("Metro Card Recharge", 300.0),
        ("Auto Rickshaw to Campus Gate", 50.0),
        ("Shared Cab to Railway Station", 180.0),
        ("Bus Ticket to City Center", 30.0)
    ]

    grocery_items = [
        ("Milk, Bread & Peanut Butter", 180.0),
        ("Instant Noodles & Biscuits", 240.0),
        ("Detergent, Toiletries & Soap", 320.0),
        ("Dry Fruits & Energy Bars", 450.0)
    ]

    curr = start_date
    while curr <= as_of_date:
        dow = curr.weekday() # 0 Mon, 6 Sun

        # Every day: 1 or 2 Food transactions
        num_food = rng.choice([1, 2, 2, 3] if dow in [5, 6] else [1, 2])
        for _ in range(num_food):
            desc, base_amt = rng.choice(food_items)
            variation = rng.uniform(-15.0, 30.0)
            amt = max(30.0, round(base_amt + variation, 2))
            db.add(Transaction(
                date=curr,
                description=desc,
                amount=amt,
                transaction_type="expense",
                category="Food and Mess",
                payment_method="UPI",
                is_recurring=False,
                is_demo=True
            ))
            tx_count += 1

        # Transport: twice a week
        if dow in [1, 4] and rng.random() > 0.2:
            desc, base_amt = rng.choice(transport_items)
            db.add(Transaction(
                date=curr,
                description=desc,
                amount=base_amt,
                transaction_type="expense",
                category="Transportation",
                payment_method="UPI",
                is_recurring=False,
                is_demo=True
            ))
            tx_count += 1

        # Groceries: weekly on Saturday or Sunday
        if dow == 5 and rng.random() > 0.3:
            desc, base_amt = rng.choice(grocery_items)
            db.add(Transaction(
                date=curr,
                description=desc,
                amount=round(base_amt + rng.uniform(-30, 60), 2),
                transaction_type="expense",
                category="Groceries",
                payment_method="UPI",
                is_recurring=False,
                is_demo=True
            ))
            tx_count += 1

        # Monthly recurring bills on specific dates
        if curr.day == 5:
            # Mobile Plan
            db.add(Transaction(
                date=curr,
                description="Jio 5G Unlimited 84-Day Student Plan",
                amount=749.0,
                transaction_type="expense",
                category="Mobile and Internet",
                payment_method="UPI",
                notes="Mobile data & calls",
                is_recurring=True,
                is_demo=True
            ))
            tx_count += 1
        elif curr.day == 8:
            # Spotify Student
            db.add(Transaction(
                date=curr,
                description="Spotify Premium Student Membership",
                amount=59.0,
                transaction_type="expense",
                category="Subscriptions",
                payment_method="UPI",
                is_recurring=True,
                is_demo=True
            ))
            tx_count += 1
        elif curr.day == 12:
            # Netflix Shared
            db.add(Transaction(
                date=curr,
                description="Netflix Standard Split Subscription",
                amount=199.0,
                transaction_type="expense",
                category="Subscriptions",
                payment_method="UPI",
                is_recurring=True,
                is_demo=True
            ))
            tx_count += 1

        # Entertainment / Social: alternate weekends
        if dow == 6 and rng.random() > 0.5:
            ent_item = rng.choice([
                ("Weekend Movie Ticket at PVR", 320.0),
                ("Cafe Outing with Project Team", 420.0),
                ("Board Gaming Cafe Cover Charge", 250.0)
            ])
            db.add(Transaction(
                date=curr,
                description=ent_item[0],
                amount=ent_item[1],
                transaction_type="expense",
                category="Entertainment",
                payment_method="Card",
                is_recurring=False,
                is_demo=True
            ))
            tx_count += 1

        # Books & Stationery: occasional
        if curr.day in [3, 18] and rng.random() > 0.6:
            db.add(Transaction(
                date=curr,
                description="Engineering Reference Textbooks & Spiral Notes",
                amount=round(rng.uniform(350, 750), 2),
                transaction_type="expense",
                category="Education and Books",
                payment_method="UPI",
                is_recurring=False,
                is_demo=True
            ))
            tx_count += 1

        curr += timedelta(days=1)

    # 4. Create Category Budgets for the current month and previous month
    curr_m = as_of_date.month
    curr_y = as_of_date.year

    prev_m = 12 if curr_m == 1 else curr_m - 1
    prev_y = curr_y - 1 if curr_m == 1 else curr_y

    budget_specs = [
        ("Food and Mess", 4500.0, "Monthly budget for extra meals and canteen"),
        ("Groceries", 2000.0, "Daily provisions, snacks and toiletries"),
        ("Transportation", 1500.0, "Local transit, auto and metro recharge"),
        ("Education and Books", 1200.0, "Course texts, stationery and printing"),
        ("Mobile and Internet", 800.0, "Phone plans and hostel wifi split"),
        ("Entertainment", 1200.0, "Movies, events and social leisure"),
        ("Subscriptions", 500.0, "Digital software and streaming tools"),
        ("Shopping", 1000.0, "Clothing and personal essentials")
    ]

    for cat, amt, desc in budget_specs:
        db.add(Budget(
            category=cat,
            planned_amount=amt,
            month=curr_m,
            year=curr_y,
            description=desc,
            is_demo=True
        ))
        db.add(Budget(
            category=cat,
            planned_amount=amt,
            month=prev_m,
            year=prev_y,
            description=desc,
            is_demo=True
        ))

    # 5. Create Savings Goals
    goal1 = SavingsGoal(
        name="Emergency Contingency Fund",
        target_amount=15000.0,
        current_saved=9500.0,
        target_date=as_of_date + timedelta(days=90),
        description="3 months of basic living cushion for medical or academic emergencies",
        is_demo=True
    )
    db.add(goal1)
    db.flush()

    # Add historical contributions to goal 1
    db.add(SavingsContribution(
        goal_id=goal1.id,
        date=as_of_date - timedelta(days=60),
        amount=5000.0,
        note="Initial deposit from internship savings"
    ))
    db.add(SavingsContribution(
        goal_id=goal1.id,
        date=as_of_date - timedelta(days=30),
        amount=2500.0,
        note="Monthly savings transfer"
    ))
    db.add(SavingsContribution(
        goal_id=goal1.id,
        date=as_of_date - timedelta(days=5),
        amount=2000.0,
        note="Allowance surplus deposit"
    ))

    goal2 = SavingsGoal(
        name="Refurbished Laptop Upgrade",
        target_amount=35000.0,
        current_saved=18000.0,
        target_date=as_of_date + timedelta(days=150),
        description="Upgraded development machine for ML and app development projects",
        is_demo=True
    )
    db.add(goal2)
    db.flush()

    db.add(SavingsContribution(
        goal_id=goal2.id,
        date=as_of_date - timedelta(days=45),
        amount=10000.0,
        note="Birthday gift allocation"
    ))
    db.add(SavingsContribution(
        goal_id=goal2.id,
        date=as_of_date - timedelta(days=15),
        amount=8000.0,
        note="Freelance project savings"
    ))

    goal3 = SavingsGoal(
        name="Semester End Industrial Tour",
        target_amount=8000.0,
        current_saved=6200.0,
        target_date=as_of_date + timedelta(days=45),
        description="College educational excursion fee and travel fund",
        is_demo=True
    )
    db.add(goal3)
    db.flush()

    db.add(SavingsContribution(
        goal_id=goal3.id,
        date=as_of_date - timedelta(days=20),
        amount=6200.0,
        note="Targeted tour deposit"
    ))

    db.commit()
    return tx_count

def clear_demo_dataset(db: Session):
    db.query(SavingsContribution).filter(
        SavingsContribution.goal_id.in_(
            db.query(SavingsGoal.id).filter(SavingsGoal.is_demo == True)
        )
    ).delete(synchronize_session=False)

    db.query(SavingsGoal).filter(SavingsGoal.is_demo == True).delete(synchronize_session=False)
    db.query(Budget).filter(Budget.is_demo == True).delete(synchronize_session=False)
    db.query(Transaction).filter(Transaction.is_demo == True).delete(synchronize_session=False)
    db.query(OptimizationStatus).delete(synchronize_session=False)
    db.commit()

def reset_all_dataset(db: Session):
    # Completely clean empty database for starting fresh
    db.query(SavingsContribution).delete(synchronize_session=False)
    db.query(SavingsGoal).delete(synchronize_session=False)
    db.query(Budget).delete(synchronize_session=False)
    db.query(Transaction).delete(synchronize_session=False)
    db.query(OptimizationStatus).delete(synchronize_session=False)

    profile = db.query(Profile).first()
    if profile:
        profile.is_onboarded = False
        profile.student_name = "New Student"
        profile.monthly_allowance = 10000.0
        profile.part_time_income = 0.0
        profile.scholarship_income = 0.0
        profile.monthly_savings_target = 1000.0
        profile.fixed_monthly_expenses = 0.0

    db.commit()
