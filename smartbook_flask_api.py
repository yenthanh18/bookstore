import os
import json
import logging
import pickle
import random
from datetime import datetime, timedelta
from functools import wraps

import jwt
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity

from models import db, User, Book, Order, OrderItem, Wishlist
from home_api import home_bp

# ======================================================
# SMARTBOOK AI STORE - PRODUCTION FLASK API (FIXED)
# ======================================================

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.register_blueprint(home_bp, url_prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("smartbook_api")

basedir = os.path.abspath(os.path.dirname(__file__))


def _build_database_uri() -> str:
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        # Render/Postgres often provides postgres://, SQLAlchemy 2 expects postgresql://
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        return database_url
    return "sqlite:///" + os.path.join(basedir, "smartbook.db")


app.config["SQLALCHEMY_DATABASE_URI"] = _build_database_uri()
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "smartbook_secret_key_pro_2026")

logger.info("Using database: %s", app.config["SQLALCHEMY_DATABASE_URI"].split("@")[-1])

db.init_app(app)
bcrypt = Bcrypt(app)

DATA_FILE = os.path.join(basedir, "smartbook_catalog.csv")
ROOT_VECTORIZER_FILE = os.path.join(basedir, "vectorizer.pkl")
ROOT_SIMILARITY_FILE = os.path.join(basedir, "similarity.npy")
MODELS_VECTORIZER_FILE = os.path.join(basedir, "models", "vectorizer.pkl")
MODELS_SIMILARITY_FILE = os.path.join(basedir, "models", "similarity.npy")

# Global references
vectorizer = None
similarity_matrix = None
tfidf_matrix = None
pid_to_index = {}
index_to_pid = {}
df_ai_texts = []


def _existing_path(*candidates: str) -> str | None:
    for path in candidates:
        if os.path.exists(path):
            return path
    return None


def initialize_ai() -> None:
    global vectorizer, similarity_matrix, pid_to_index, index_to_pid, df_ai_texts, tfidf_matrix

    vectorizer = None
    similarity_matrix = None
    tfidf_matrix = None
    pid_to_index = {}
    index_to_pid = {}
    df_ai_texts = []

    try:
        logger.info("Initializing AI resources...")

        if os.path.exists(DATA_FILE):
            df = pd.read_csv(DATA_FILE)
            for i, row in df.iterrows():
                pid = int(row.get("product_id", i + 1))
                pid_to_index[pid] = i
                index_to_pid[i] = pid
                df_ai_texts.append(str(row.get("ai_text", "")))
            logger.info("Loaded %s catalog rows for AI mapping.", len(df_ai_texts))
        else:
            logger.warning("Catalog CSV not found at %s", DATA_FILE)

        similarity_file = _existing_path(ROOT_SIMILARITY_FILE, MODELS_SIMILARITY_FILE)
        if similarity_file:
            similarity_matrix = np.load(similarity_file)
            logger.info("Loaded similarity matrix from %s", similarity_file)
        else:
            logger.warning("No similarity.npy file found.")

        vectorizer_file = _existing_path(ROOT_VECTORIZER_FILE, MODELS_VECTORIZER_FILE)
        if vectorizer_file:
            with open(vectorizer_file, "rb") as f:
                vectorizer = pickle.load(f)
            logger.info("Loaded vectorizer from %s", vectorizer_file)
        else:
            logger.warning("No vectorizer.pkl file found.")

        if vectorizer is not None and df_ai_texts:
            tfidf_matrix = vectorizer.transform(df_ai_texts)
            logger.info("Built TF-IDF matrix successfully.")

        logger.info("AI resources initialized.")
    except Exception as e:
        logger.exception("Failed to load AI resources: %s", e)


# ======================================================
# MIDDLEWARE & UTILS
# ======================================================


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

        if not token:
            return jsonify({"success": False, "error": "Token is missing"}), 401

        try:
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = db.session.get(User, data["user_id"])
            if not current_user:
                raise ValueError("User not found")
        except Exception:
            return jsonify({"success": False, "error": "Token is invalid"}), 401

        return f(current_user, *args, **kwargs)

    return decorated



def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(current_user, *args, **kwargs):
        if current_user.role != "admin":
            return jsonify({"success": False, "error": "Admin permissions required"}), 403
        return f(current_user, *args, **kwargs)

    return decorated



def ok(data, **kwargs):
    res = {"success": True, "data": data}
    res.update(kwargs)
    return jsonify(res), 200



def error(msg, code=400):
    return jsonify({"success": False, "error": msg}), code



def record_interaction(user, action_type, product_id):
    if not user:
        return
    try:
        interactions = json.loads(user.interactions or "{}")
        interactions.setdefault(action_type, [])
        if product_id not in interactions[action_type]:
            interactions[action_type].append(product_id)
            if len(interactions[action_type]) > 50:
                interactions[action_type].pop(0)
        user.interactions = json.dumps(interactions)
        db.session.commit()
    except Exception:
        db.session.rollback()


# ======================================================
# STARTUP
# ======================================================

with app.app_context():
    db.create_all()
    initialize_ai()


# ======================================================
# HEALTH
# ======================================================

@app.route("/health", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def api_health():
    try:
        books_count = Book.query.count()
        users_count = User.query.count()
        orders_count = Order.query.count()
        db_ok = True
    except Exception as e:
        logger.exception("Health check DB query failed: %s", e)
        books_count = 0
        users_count = 0
        orders_count = 0
        db_ok = False

    return jsonify(
        {
            "status": "ok" if db_ok else "degraded",
            "success": True,
            "database_connected": db_ok,
            "books_count": books_count,
            "users_count": users_count,
            "orders_count": orders_count,
            "vectorizer_loaded": vectorizer is not None,
            "similarity_loaded": similarity_matrix is not None,
            "tfidf_ready": tfidf_matrix is not None,
        }
    ), 200


# ======================================================
# AUTH API
# ======================================================

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    if not data.get("email") or not data.get("password") or not data.get("name"):
        return error("Missing required fields")

    if User.query.filter_by(email=data["email"]).first():
        return error("Email already exists")

    hashed_pw = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    new_user = User(name=data["name"], email=data["email"], password_hash=hashed_pw, role="customer")
    db.session.add(new_user)
    db.session.commit()

    token = jwt.encode(
        {"user_id": new_user.id, "exp": datetime.utcnow() + timedelta(days=7)},
        app.config["SECRET_KEY"],
        algorithm="HS256",
    )
    return ok({"token": token, "user": new_user.to_dict()})


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    if not data.get("email") or not data.get("password"):
        return error("Missing email or password")

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, data["password"]):
        return error("Invalid email or password", 401)

    token = jwt.encode(
        {"user_id": user.id, "exp": datetime.utcnow() + timedelta(days=7)},
        app.config["SECRET_KEY"],
        algorithm="HS256",
    )
    return ok({"token": token, "user": user.to_dict()})


@app.route("/api/auth/me", methods=["GET"])
@token_required
def get_me(current_user):
    return ok(current_user.to_dict())


@app.route("/api/user/orders", methods=["GET"])
@token_required
def get_user_orders(current_user):
    orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
    return ok([o.to_dict() for o in orders])


# ======================================================
# ADMIN API
# ======================================================

@app.route("/api/admin/stats", methods=["GET"])
@admin_required
def admin_stats(current_user):
    total_users = User.query.count()
    total_orders = Order.query.count()
    orders = Order.query.all()
    revenue = sum(o.total_amount for o in orders if o.status != "Cancelled")
    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(5).all()

    stats = {
        "total_revenue": round(revenue, 2),
        "total_orders": total_orders,
        "total_users": total_users,
        "recent_orders": [o.to_dict() for o in recent_orders],
    }
    return ok(stats)


@app.route("/api/admin/orders", methods=["GET"])
@admin_required
def admin_orders(current_user):
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    pagination = Order.query.order_by(Order.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)
    return ok(
        [o.to_dict() for o in pagination.items],
        pagination={"total": pagination.total, "pages": pagination.pages, "page": page},
    )


@app.route("/api/admin/orders/<order_id>", methods=["PATCH"])
@admin_required
def update_order_status(current_user, order_id):
    data = request.json or {}
    order = db.session.get(Order, order_id)
    if not order:
        return error("Order not found", 404)
    if "status" in data:
        order.status = data["status"]
        db.session.commit()
    return ok(order.to_dict())


@app.route("/api/admin/books/<int:book_id>", methods=["PATCH"])
@admin_required
def update_book(current_user, book_id):
    data = request.json or {}
    book = db.session.get(Book, book_id)
    if not book:
        return error("Book not found", 404)

    allowed = ["title", "price", "stock_quantity", "availability_status", "discount_percent"]
    for k in allowed:
        if k in data:
            setattr(book, k, data[k])

    if book.price and book.discount_percent:
        book.final_price = round(book.price * (1 - book.discount_percent / 100.0), 2)
    elif book.price:
        book.final_price = book.price

    db.session.commit()
    return ok(book.to_dict())


@app.route("/api/admin/books", methods=["POST"])
@admin_required
def create_book(current_user):
    data = request.json or {}
    if not data.get("title") or data.get("price") is None:
        return error("Title and price are required")

    stock = int(data.get("stock_quantity", 0))
    avail = data.get("availability_status", "in_stock" if stock > 0 else "out_of_stock")
    price = float(data.get("price", 0))
    discount = float(data.get("discount_percent", 0.0))
    fprice = round(price * (1 - discount / 100.0), 2)

    try:
        max_id_query = db.session.query(db.func.max(Book.product_id)).scalar()
        new_product_id = int(max_id_query) + 1 if max_id_query else 1

        book = Book(
            product_id=new_product_id,
            title=data.get("title"),
            authors=data.get("authors", ""),
            category=data.get("category", ""),
            description=data.get("description", ""),
            image_url=data.get("image_url", ""),
            price=price,
            discount_percent=discount,
            final_price=fprice,
            stock_quantity=stock,
            availability_status=avail,
            published_year=int(data.get("published_year", 2024)),
            currency="USD",
            average_rating=0.0,
            ratings_count=0,
        )
        db.session.add(book)
        db.session.commit()
        return ok(book.to_dict())
    except Exception as e:
        db.session.rollback()
        return error(f"Failed to create book: {str(e)}")


# ======================================================
# CATALOG / BOOKS API
# ======================================================

@app.route("/api/books", methods=["GET"])
def get_books():
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 12))
    category = request.args.get("category")
    sort_by = request.args.get("sort_by", "trending")

    query = Book.query

    if category:
        query = query.filter(Book.category.ilike(f"%{category}%"))
    if request.args.get("featured") == "true":
        query = query.filter_by(is_featured=1)
    if request.args.get("bestseller") == "true":
        query = query.filter_by(is_bestseller=1)
    if request.args.get("on_sale") == "true":
        query = query.filter(Book.discount_percent > 0)

    if sort_by == "price_asc":
        query = query.order_by(Book.final_price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Book.final_price.desc())
    elif sort_by == "rating":
        query = query.order_by(Book.average_rating.desc(), Book.ratings_count.desc())
    elif sort_by == "newest":
        query = query.order_by(Book.published_year.desc())
    elif sort_by == "popular":
        query = query.order_by(Book.ratings_count.desc())
    else:
        query = query.order_by((Book.average_rating * Book.ratings_count).desc())

    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    return ok(
        [b.to_dict() for b in pagination.items],
        pagination={"total": pagination.total, "pages": pagination.pages, "page": page, "limit": limit},
    )


@app.route("/api/books/<int:book_id>", methods=["GET"])
def get_book_detail(book_id):
    book = db.session.get(Book, book_id)
    if not book:
        return error("Book not found", 404)

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ", 1)[1]
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            user = db.session.get(User, data["user_id"])
            record_interaction(user, "view_item", book_id)
        except Exception:
            pass

    return ok(book.to_detail_dict())


@app.route("/api/categories", methods=["GET"])
def get_categories():
    cats = db.session.query(Book.category, db.func.count(Book.product_id)).group_by(Book.category).all()
    res = [{"category": row[0] if row[0] else "Uncategorized", "count": row[1]} for row in cats if row[0]]
    return ok(res)


# ======================================================
# SEARCH & AI RECOMMENDER LOGIC
# ======================================================


def calculate_ai_score(similarities, ratings, popularity_counts):
    norm_rating = np.clip(ratings / 5.0, 0, 1)
    max_pop = np.max(popularity_counts) if len(popularity_counts) and np.max(popularity_counts) > 0 else 1
    norm_pop = np.clip(popularity_counts / max_pop, 0, 1)
    return 0.5 * similarities + 0.3 * norm_rating + 0.2 * norm_pop


@app.route("/api/search", methods=["GET"])
def semantic_search():
    q = request.args.get("q", "").strip()
    top_n = int(request.args.get("top_n", 20))
    if not q:
        return error("Missing query")

    fuzzy_matches = Book.query.filter(
        db.or_(
            Book.title.ilike(f"%{q}%"),
            Book.authors.ilike(f"%{q}%"),
            Book.category.ilike(f"%{q}%"),
        )
    ).limit(100).all()

    def score_book(b):
        lower_q = q.lower()
        lower_title = (b.title or "").lower()
        lower_author = (b.authors or "").lower()
        lower_cat = (b.category or "").lower()
        if lower_q == lower_title:
            return 100
        if lower_title.startswith(lower_q):
            return 90
        if lower_q in lower_title:
            return 80
        if lower_q in lower_author:
            return 60
        if lower_q == lower_cat:
            return 50
        if lower_q in lower_cat:
            return 40
        return 10

    fuzzy_matches.sort(key=score_book, reverse=True)
    combined_ids = [b.product_id for b in fuzzy_matches]
    semantic_ids = []

    if len(combined_ids) < top_n and vectorizer is not None and tfidf_matrix is not None:
        try:
            q_vec = vectorizer.transform([q])
            if q_vec.nnz > 0:
                scores = cosine_similarity(q_vec, tfidf_matrix).flatten()
                top_indices = scores.argsort()[-30:][::-1]
                for idx in top_indices:
                    if scores[idx] > 0.05:
                        pid = index_to_pid.get(idx)
                        if pid and pid not in combined_ids:
                            semantic_ids.append(pid)
        except Exception:
            logger.exception("Semantic search fallback failed")

    final_books = list(fuzzy_matches)
    if semantic_ids:
        s_books = Book.query.filter(Book.product_id.in_(semantic_ids[:top_n])).all()
        s_dict = {b.product_id: b for b in s_books}
        for pid in semantic_ids:
            if pid in s_dict:
                final_books.append(s_dict[pid])

    return ok([b.to_dict() for b in final_books][:top_n])


@app.route("/api/recommend", methods=["GET"])
def recommend_similar():
    title = request.args.get("title", "").strip()
    top_n = int(request.args.get("top_n", 6))
    if not title:
        return error("Missing title")

    book = Book.query.filter(Book.title.ilike(f"%{title}%")).first()
    if not book:
        return ok([])

    if similarity_matrix is None:
        fallback_books = (
            Book.query.filter(Book.category == book.category, Book.product_id != book.product_id)
            .order_by((Book.average_rating * Book.ratings_count).desc())
            .limit(top_n)
            .all()
        )
        return ok([b.to_dict() for b in fallback_books])

    idx = pid_to_index.get(book.product_id)
    if idx is None:
        fallback_books = (
            Book.query.filter(Book.category == book.category, Book.product_id != book.product_id)
            .order_by((Book.average_rating * Book.ratings_count).desc())
            .limit(top_n)
            .all()
        )
        return ok([b.to_dict() for b in fallback_books])

    sim_scores = similarity_matrix[idx]
    top_sim_indices = sim_scores.argsort()[-51:][::-1]
    candidate_pids = [index_to_pid[i] for i in top_sim_indices if i != idx and i in index_to_pid]
    candidates = Book.query.filter(Book.product_id.in_(candidate_pids)).all()

    scored_candidates = []
    for c in candidates:
        c_idx = pid_to_index.get(c.product_id)
        s_score = sim_scores[c_idx] if c_idx is not None else 0
        ai_score = calculate_ai_score(np.array([s_score]), np.array([c.average_rating]), np.array([c.ratings_count]))[0]
        scored_candidates.append((ai_score, c))

    scored_candidates.sort(key=lambda x: x[0], reverse=True)
    return ok([c[1].to_dict() for c in scored_candidates[:top_n]])


@app.route("/api/chatbot", methods=["POST"])
def chatbot():
    data = request.json or {}
    message = data.get("message", "").strip()
    if not message:
        return ok({"reply": "Can I help you find something specific?", "books": []})

    q = message.lower()
    clean_q = (
        q.replace("find", "")
        .replace("book", "")
        .replace("books", "")
        .replace("about", "")
        .replace("me", "")
        .replace("some", "")
        .replace("recommend", "")
        .replace("show", "")
        .strip()
    )
    search_term = clean_q if len(clean_q) > 1 else q

    all_books = Book.query.all()
    scored_books = []
    for b in all_books:
        title = (b.title or "").lower()
        author = (b.authors or "").lower()
        cat = (b.category or "").lower()

        score = 0
        if search_term == title:
            score = 100
        elif title.startswith(search_term):
            score = 90
        elif search_term in title:
            score = 80
        elif search_term == author or search_term in author:
            score = 70
        elif search_term == cat or search_term in cat:
            score = 60

        if score > 0:
            scored_books.append((score, b))

    scored_books.sort(key=lambda x: x[0], reverse=True)
    best_matches = [b for _, b in scored_books]

    if best_matches:
        return ok(
            {
                "reply": f"I found these fantastic books matching '{search_term}':",
                "books": [b.to_dict() for b in best_matches[:6]],
                "intent": "keyword_match",
            }
        )

    if vectorizer is not None and tfidf_matrix is not None:
        try:
            q_vec = vectorizer.transform([message])
            if q_vec.nnz > 0:
                scores = cosine_similarity(q_vec, tfidf_matrix).flatten()
                top_indices = scores.argsort()[-20:][::-1]
                pids = [index_to_pid[i] for i in top_indices if scores[i] > 0.05][:6]
                if pids:
                    books = Book.query.filter(Book.product_id.in_(pids)).all()
                    if books:
                        return ok(
                            {
                                "reply": "Here are some top picks based on your request:",
                                "books": [bk.to_dict() for bk in books],
                                "intent": "semantic_search",
                            }
                        )
        except Exception:
            logger.exception("Chatbot semantic fallback failed")

    popular_books = Book.query.order_by(Book.ratings_count.desc()).limit(6).all()
    return ok(
        {
            "reply": "I couldn't find an exact match, but check out these highly rated popular books!",
            "books": [bk.to_dict() for bk in popular_books],
            "intent": "global_fallback",
        }
    )


# ======================================================
# WISHLIST API
# ======================================================

@app.route("/api/wishlist", methods=["GET", "POST"])
@token_required
def manage_wishlist(current_user):
    if request.method == "GET":
        items = Wishlist.query.filter_by(user_id=current_user.id).all()
        return ok([item.to_dict() for item in items])

    product_id = (request.json or {}).get("product_id")
    if not product_id:
        return error("Product ID required")

    existing = Wishlist.query.filter_by(user_id=current_user.id, product_id=product_id).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
        return ok({"status": "removed", "product_id": product_id})

    w = Wishlist(user_id=current_user.id, product_id=product_id)
    db.session.add(w)
    db.session.commit()
    return ok({"status": "added", "product_id": product_id})


@app.route("/api/same-author", methods=["GET"])
def get_same_author_books():
    title = request.args.get("title", "").strip()
    if not title:
        return error("Missing title")

    target_book = Book.query.filter(Book.title.ilike(f"%{title}%")).first()
    if not target_book or not target_book.authors:
        return ok([])

    books = (
        Book.query.filter(Book.authors == target_book.authors, Book.product_id != target_book.product_id)
        .order_by(Book.average_rating.desc())
        .limit(8)
        .all()
    )
    return ok([b.to_dict() for b in books])


# ======================================================
# CHECKOUT API
# ======================================================

@app.route("/api/checkout", methods=["POST"])
def checkout():
    data = request.json or {}
    req_fields = ["customer_name", "email", "phone", "address", "items"]
    for f in req_fields:
        if not data.get(f):
            return error(f"Missing {f}")

    items = data["items"]
    if not items:
        return error("Cart is empty")

    subtotal = 0.0
    order_items_to_save = []

    user_id = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ", 1)[1]
            token_data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            user_id = token_data["user_id"]
        except Exception:
            pass

    for item in items:
        pid = item["product_id"]
        qty = int(item["quantity"])
        book = db.session.get(Book, pid)
        if not book:
            return error(f"Book {pid} not found")
        if book.stock_quantity < qty:
            return error(f"Not enough stock for book: {book.title}")

        line_subtotal = book.final_price * qty
        subtotal += line_subtotal
        oi = OrderItem(product_id=pid, quantity=qty, unit_price=book.final_price, subtotal=line_subtotal)
        order_items_to_save.append((oi, book, qty))

    tax = round(subtotal * 0.08, 2)
    total_amount = round(subtotal + tax, 2)
    order_id = f"ORD-{random.randint(100000, 999999)}"

    order = Order(
        id=order_id,
        user_id=user_id,
        customer_name=data["customer_name"],
        email=data["email"],
        phone=data["phone"],
        address=data["address"],
        payment_method="Cash on Delivery",
        status="Pending",
        subtotal=subtotal,
        tax=tax,
        total_amount=total_amount,
    )

    db.session.add(order)
    user = db.session.get(User, user_id) if user_id else None

    for oi, book, qty in order_items_to_save:
        oi.order_id = order.id
        db.session.add(oi)
        book.stock_quantity -= qty
        if book.stock_quantity == 0:
            book.availability_status = "out_of_stock"
        if user:
            record_interaction(user, "purchase", book.product_id)

    db.session.commit()
    return ok({"order_id": order.id, "status": "success", "message": "Order placed successfully!"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
