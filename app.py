import os
import requests
import schedule
import time
import threading
from flask import Flask, request, jsonify
from mercadopago import SDK
from dotenv import load_dotenv
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSONB, NUMERIC

# ------------------------------
# Configuração inicial
# ------------------------------
load_dotenv()

sdk = SDK(os.environ.get("ACCESS_TOKEN"))

app = Flask(__name__)
CORS(app)

API_URL = "https://sytem-loja-master.onrender.com"

# ------------------------------
# Banco de dados (Supabase/Postgres)
# ------------------------------
db_url = os.environ.get("SUPABASE_DB_URL")
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

class Order(db.Model):
    __tablename__ = "orders"
    id = db.Column(db.String, primary_key=True)
    items = db.Column(JSONB, nullable=False)
    total = db.Column(NUMERIC(10, 2), nullable=False)
    payment = db.Column(db.String, nullable=False)
    status = db.Column(db.String, nullable=False)

# ------------------------------
# Rotas de Pedidos
# ------------------------------
@app.route('/orders', methods=['POST'])
def create_order():
    data = request.json
    order = Order(
        id=str(data.get("id")),
        items=data.get("items", []),
        total=float(data.get("total", 0)),
        payment=data.get("payment", "N/A"),
        status=data.get("status", "pendente")
    )
    db.session.add(order)
    db.session.commit()
    return jsonify({"success": True, "orderId": order.id}), 201

@app.route('/orders', methods=['GET'])
def list_orders():
    orders = Order.query.all()
    return jsonify([{
        "id": o.id,
        "items": o.items,
        "total": float(o.total),
        "payment": o.payment,
        "status": o.status
    } for o in orders])

@app.route('/orders/<order_id>', methods=['GET'])
def get_order(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Pedido não encontrado"}), 404
    return jsonify({
        "id": order.id,
        "items": order.items,
        "total": float(order.total),
        "payment": order.payment,
        "status": order.status
    })

@app.route('/orders/<order_id>/status', methods=['PATCH'])
def update_order_status(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Pedido não encontrado"}), 404
    new_status = request.json.get("status")
    order.status = new_status
    db.session.commit()
    return jsonify({
        "success": True,
        "order": {
            "id": order.id,
            "items": order.items,
            "total": float(order.total),
            "payment": order.payment,
            "status": order.status
        }
    })

# ------------------------------
# Rotas Mercado Pago (Pix)
# ------------------------------
@app.route('/warmup', methods=["GET"])
def warmup_endpoint():
    try:
        sdk.payment()
        return jsonify({"message": "API aquecida"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/create_pix_payment", methods=["POST"])
def create_pix_payment():
    try:
        data = request.get_json()

        items_payload = []
        for item in data['items']:
            items_payload.append({
                "title": item['name'],
                "unit_price": float(item['price']),
                "quantity": item.get('quantity', 1)
            })

        payment_data = {
            "transaction_amount": sum(item['unit_price'] * item['quantity'] for item in items_payload),
            "description": "Pagamento do seu pedido de Açaí",
            "payment_method_id": "pix",
            "external_reference": data['orderId'],
            "payer": {
                "first_name": data.get("customerName", "Cliente"),
                "email": data.get("customerEmail", "test_user@gmail.com"),
            }
        }

        payment_response = sdk.payment().create(payment_data)

        if payment_response['status'] == 201:
            payment = payment_response['response']
            pix_data = payment['point_of_interaction']['transaction_data']
            return jsonify({
                "id": payment['id'],
                "qr_code": pix_data['qr_code'],
                "qr_code_base64": pix_data['qr_code_base64']
            }), 200
        else:
            return jsonify({
                "error": "Erro ao criar o pagamento Pix",
                "details": payment_response
            }), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/payment_status/<payment_id>", methods=["GET"])
def payment_status(payment_id):
    try:
        payment_info = sdk.payment().get(payment_id)
        status = payment_info['response']['status']
        return jsonify({"status": status}), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

# ------------------------------
# Warmup scheduler
# ------------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    # O Render gerencia a execução da aplicação, então não precisamos chamar app.run()
    # app.run(port=5000, debug=True)
