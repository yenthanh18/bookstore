from flask import Blueprint, jsonify, request
from models import Book

home_bp = Blueprint("home", __name__)

@home_bp.route("/bestsellers", methods=["GET", "OPTIONS"])
def bestsellers():
    top_n = int(request.args.get("top_n", 8))
    books = (
        Book.query.filter_by(is_bestseller=1)
        .order_by(Book.average_rating.desc())
        .limit(top_n)
        .all()
    )
    return jsonify({"data": [b.to_dict() for b in books]})

@home_bp.route("/deals", methods=["GET", "OPTIONS"])
def deals():
    top_n = int(request.args.get("top_n", 8))
    books = (
        Book.query.order_by(Book.discount_percent.desc(), Book.average_rating.desc())
        .limit(top_n)
        .all()
    )
    return jsonify({"data": [b.to_dict() for b in books]})

@home_bp.route("/trending", methods=["GET", "OPTIONS"])
def trending():
    top_n = int(request.args.get("top_n", 8))
    books = (
        Book.query.order_by((Book.average_rating * Book.ratings_count).desc())
        .limit(top_n)
        .all()
    )
    return jsonify({"data": [b.to_dict() for b in books]})