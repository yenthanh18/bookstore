from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='customer') # 'admin' or 'customer'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Interactions: dictionary stored as JSON string -> {"view_item": [book_ids], "add_to_cart": [book_ids], "purchase": [book_ids]}
    interactions = db.Column(db.Text, default='{"view_item": [], "add_to_cart": [], "purchase": []}')
    
    orders = db.relationship('Order', backref='user', lazy=True)
    wishlist = db.relationship('Wishlist', backref='user', lazy=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat()
        }

class Book(db.Model):
    __tablename__ = 'books'
    
    product_id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(50))
    isbn13 = db.Column(db.String(20))
    isbn10 = db.Column(db.String(20))
    title = db.Column(db.Text, nullable=False)
    subtitle = db.Column(db.Text)
    authors = db.Column(db.Text)
    category = db.Column(db.Text)
    raw_category = db.Column(db.String(100))
    description = db.Column(db.Text)
    image_url = db.Column(db.Text)
    published_year = db.Column(db.Integer)
    average_rating = db.Column(db.Float, default=0.0)
    page_count = db.Column(db.Integer)
    ratings_count = db.Column(db.Integer, default=0)
    price = db.Column(db.Float, default=0.0)
    discount_percent = db.Column(db.Float, default=0.0)
    final_price = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(10), default='USD')
    stock_quantity = db.Column(db.Integer, default=50)
    availability_status = db.Column(db.String(50), default='in_stock')
    is_bestseller = db.Column(db.Integer, default=0)
    is_featured = db.Column(db.Integer, default=0)
    ai_text = db.Column(db.Text)
    
    def to_dict(self):
        return {
            "product_id": self.product_id,
            "sku": self.sku,
            "title": self.title,
            "authors": self.authors,
            "category": self.category,
            "image_url": self.image_url,
            "final_price": self.final_price,
            "average_rating": self.average_rating,
            "availability_status": self.availability_status,
            "stock_quantity": self.stock_quantity,
            "is_bestseller": self.is_bestseller,
            "is_featured": self.is_featured
        }
        
    def to_detail_dict(self):
        return {
            "product_id": self.product_id,
            "sku": self.sku,
            "isbn13": self.isbn13,
            "isbn10": self.isbn10,
            "title": self.title,
            "subtitle": self.subtitle,
            "authors": self.authors,
            "category": self.category,
            "raw_category": self.raw_category,
            "description": self.description,
            "image_url": self.image_url,
            "published_year": self.published_year,
            "average_rating": self.average_rating,
            "page_count": self.page_count,
            "ratings_count": self.ratings_count,
            "price": self.price,
            "discount_percent": self.discount_percent,
            "final_price": self.final_price,
            "currency": self.currency,
            "stock_quantity": self.stock_quantity,
            "availability_status": self.availability_status,
            "is_bestseller": self.is_bestseller,
            "is_featured": self.is_featured
        }

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.String(20), primary_key=True) # e.g. ORD-123456
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # null for guest
    customer_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=False)
    payment_method = db.Column(db.String(50), default='Cash on Delivery')
    status = db.Column(db.String(50), default='Pending') # Pending, Processing, Shipped, Delivered, Cancelled
    subtotal = db.Column(db.Float, default=0.0)
    tax = db.Column(db.Float, default=0.0)
    total_amount = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "customer_name": self.customer_name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "payment_method": self.payment_method,
            "status": self.status,
            "subtotal": self.subtotal,
            "tax": self.tax,
            "total_amount": self.total_amount,
            "created_at": self.created_at.isoformat(),
            "items": [item.to_dict() for item in self.items]
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.String(20), db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('books.product_id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    subtotal = db.Column(db.Float, nullable=False) # quantity * unit_price
    
    book = db.relationship('Book', lazy=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "subtotal": self.subtotal,
            "book": {
                "title": self.book.title if self.book else "Unknown",
                "image_url": self.book.image_url if self.book else ""
            }
        }

class Wishlist(db.Model):
    __tablename__ = 'wishlists'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('books.product_id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    book = db.relationship('Book', lazy=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "product_id": self.product_id,
            "book": self.book.to_dict() if self.book else None,
            "created_at": self.created_at.isoformat()
        }
