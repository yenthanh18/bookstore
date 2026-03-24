import os
import math
import random
import pandas as pd
from flask import Flask
from flask_bcrypt import Bcrypt
from models import db, Book, User

app = Flask(__name__)

# Use DATABASE_URL when provided, otherwise fall back to local SQLite.
basedir = os.path.abspath(os.path.dirname(__file__))
db_url = os.environ.get("DATABASE_URL")
if db_url:
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
else:
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(basedir, "smartbook.db")

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
bcrypt = Bcrypt(app)

DATA_FILE = os.path.join(basedir, "smartbook_catalog.csv")
ADMIN_EMAIL = "admin@smartbook.ai"
LEGACY_ADMIN_EMAIL = "admin@smartbook.local"
ADMIN_PASSWORD = "Admin123!"


def clean_float(val):
    if pd.isna(val) or val is None:
        return 0.0
    try:
        if math.isnan(val):
            return 0.0
    except TypeError:
        pass
    return float(val)


def clean_int(val):
    if pd.isna(val) or val is None:
        return 0
    try:
        if math.isnan(val):
            return 0
    except TypeError:
        pass
    return int(val)


def clean_str(val):
    if pd.isna(val) or val is None:
        return ""
    return str(val)


def ensure_admin_user():
    """Always make sure the default admin credentials work."""
    print(f"Ensuring default admin user ({ADMIN_EMAIL} / {ADMIN_PASSWORD})...")

    admin = User.query.filter_by(email=ADMIN_EMAIL).first()
    legacy_admin = None

    if not admin:
        legacy_admin = User.query.filter_by(email=LEGACY_ADMIN_EMAIL).first()

    hashed_pw = bcrypt.generate_password_hash(ADMIN_PASSWORD).decode("utf-8")

    if admin:
        admin.name = "Super Admin"
        admin.password_hash = hashed_pw
        admin.role = "admin"
        db.session.commit()
        print("Updated existing admin account.")
        return admin

    if legacy_admin:
        legacy_admin.name = "Super Admin"
        legacy_admin.email = ADMIN_EMAIL
        legacy_admin.password_hash = hashed_pw
        legacy_admin.role = "admin"
        db.session.commit()
        print("Migrated legacy admin account to admin@smartbook.ai.")
        return legacy_admin

    admin = User(
        name="Super Admin",
        email=ADMIN_EMAIL,
        password_hash=hashed_pw,
        role="admin",
    )
    db.session.add(admin)
    db.session.commit()
    print("Created new admin account.")
    return admin


def seed_books():
    if Book.query.count() > 0:
        print("Database already populated. Skipping book import.")
        return

    print("Loading smartbook_catalog.csv...")
    if not os.path.exists(DATA_FILE):
        print(f"Error: {DATA_FILE} not found!")
        return

    df = pd.read_csv(DATA_FILE)
    books_to_add = []

    for index, row in df.iterrows():
        try:
            product_id = row.get("product_id", index + 1)

            if Book.query.get(product_id):
                continue

            if "stock_quantity" in row and not pd.isna(row["stock_quantity"]):
                stock = clean_int(row["stock_quantity"])
            else:
                stock = random.randint(5, 100)
                if random.random() < 0.05:
                    stock = 0

            availability = "in_stock" if stock > 0 else "out_of_stock"

            book = Book(
                product_id=product_id,
                sku=clean_str(row.get("sku", "")),
                isbn13=clean_str(row.get("isbn13", "")),
                isbn10=clean_str(row.get("isbn10", "")),
                title=clean_str(row.get("title", "Unknown Title")),
                subtitle=clean_str(row.get("subtitle", "")),
                authors=clean_str(row.get("authors", "")),
                category=clean_str(row.get("category", "")),
                raw_category=clean_str(row.get("raw_category", "")),
                description=clean_str(row.get("description", "")),
                image_url=clean_str(row.get("thumbnail", row.get("image_url", ""))),
                published_year=clean_int(row.get("published_year", 0)),
                average_rating=clean_float(row.get("average_rating", 0.0)),
                page_count=clean_int(row.get("page_count", 0)),
                ratings_count=clean_int(row.get("ratings_count", 0)),
                price=clean_float(row.get("price", 0.0)),
                discount_percent=clean_float(row.get("discount_percent", 0.0)),
                final_price=clean_float(row.get("final_price", row.get("price", 0.0))),
                currency="USD",
                stock_quantity=stock,
                availability_status=availability,
                is_bestseller=clean_int(row.get("is_bestseller", 0)),
                is_featured=clean_int(row.get("is_featured", 0)),
                ai_text=clean_str(row.get("ai_text", "")),
            )
            books_to_add.append(book)

            if len(books_to_add) >= 1000:
                db.session.bulk_save_objects(books_to_add)
                db.session.commit()
                print(f"Inserted {index + 1} books...")
                books_to_add = []

        except Exception as e:
            print(f"Error inserting row {index}: {e}")

    if books_to_add:
        db.session.bulk_save_objects(books_to_add)
        db.session.commit()

    print(f"Migration complete! Total books: {Book.query.count()}")


def init_db():
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        ensure_admin_user()
        seed_books()


if __name__ == "__main__":
    init_db()
