import os
import requests
import schedule
import time
import threading
import uuid # NOVO: Importa a biblioteca para gerar IDs únicos
from flask import Flask, request, jsonify
from mercadopago import SDK
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

sdk = SDK(os.environ.get("ACCESS_TOKEN"))

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

API_URL = "https://sytem-loja-master.onrender.com"

# NOVO: Lista global para armazenar os pedidos em memória.
# Em um sistema real, você usaria um banco de dados.
orders = []

def warmup_api():
    warmup_url = f"{API_URL}/warmup"
    print(f"[{time.strftime('%H:%M:%S')}] Enviando requisição de aquecimento para {warmup_url}...")
    try:
        response = requests.get(warmup_url)
        if response.status_code == 200:
            print(f"[{time.strftime('%H:%M:%S')}] Requisição de aquecimento bem-sucedida!")
        else:
            print(f"[{time.strftime('%H:%M:%S')}] Erro na requisição de aquecimento: Status {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"[{time.strftime('%H:%M:%S')}] Erro ao conectar com a API para aquecimento: {e}")

def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(1)

@app.after_request
def apply_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PATCH" # ATUALIZADO: Adiciona o método PATCH
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

@app.route('/warmup', methods=["GET"])
def warmup_endpoint():
    try:
        sdk.payment()
        return jsonify({"message": "API aquecida"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# NOVO ENDPOINT: Rota para criar um novo pedido
@app.route("/orders", methods=["POST"])
def create_order():
    try:
        data = request.get_json()
        
        # Gera um ID único e curto para o pedido
        order_id = str(uuid.uuid4())[:8].upper()
        
        # Estrutura do pedido
        new_order = {
            "id": order_id,
            "items": data.get("items", []),
            "total": data.get("total", 0),
            "payment": data.get("payment"),
            "status": data.get("status", "pendente")
        }
        
        # Adiciona o novo pedido à nossa lista em memória
        orders.append(new_order)
        print(f"Pedido {new_order['id']} criado com sucesso. Status: {new_order['status']}")
        
        return jsonify({"message": "Pedido criado com sucesso", "orderId": new_order["id"]}), 201
    except Exception as e:
        print(f"Erro ao criar pedido: {e}")
        return jsonify({"error": str(e)}), 500

# NOVO ENDPOINT: Rota para listar todos os pedidos
@app.route("/orders", methods=["GET"])
def list_orders():
    # Retorna a lista de pedidos em formato JSON
    return jsonify(orders)

# NOVO ENDPOINT: Rota para buscar um pedido por ID
@app.route("/orders/<order_id>", methods=["GET"])
def get_order(order_id):
    order = next((o for o in orders if str(o['id']) == order_id), None)
    if order:
        return jsonify(order)
    else:
        return jsonify({"error": "Pedido não encontrado"}), 404

# NOVO ENDPOINT: Rota para atualizar o status de um pedido
@app.route("/orders/<order_id>/status", methods=["PATCH"])
def update_order_status(order_id):
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({"error": "Status não fornecido"}), 400

        order = next((o for o in orders if str(o['id']) == order_id), None)
        
        if order:
            order['status'] = new_status
            print(f"Status do Pedido {order_id} atualizado para: {new_status}")
            return jsonify({"message": "Status do pedido atualizado com sucesso"}), 200
        else:
            return jsonify({"error": "Pedido não encontrado"}), 404
    except Exception as e:
        print(f"Erro ao atualizar status do pedido: {e}")
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


if __name__ == "__main__":
    schedule.every(5).minutes.do(warmup_api)
    
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    
    app.run(port=5000, debug=True)