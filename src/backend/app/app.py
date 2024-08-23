from flask import Flask, Response, jsonify, request, send_from_directory
import json
import os
#from src.backend.utils import json_utils
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address



app = Flask(__name__, static_folder='../../frontend/static', static_url_path='/static')
CORS(app)  # Enable CORS for the Flask app 

# Set up a global Limiter so you don't get wrecked by AWS bills
limiter = Limiter(
    key_func=lambda: "global",  # Use a static key to apply the same limit for all requests
    app=app,
    default_limits=["100 per hour"]  # Limit to 100 requests total per hour
)

@app.after_request
def add_coep_headers(response):
    response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    response.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
    return response
@app.route('/')
def home():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/gp_data', methods=['GET'])
def get_gp_data():
    file_path = os.path.join(app.static_folder, 'data', 'ST_gp_data.json')

    with open(file_path, 'r') as file:
        data = json.load(file)
    return jsonify(data)


if __name__ == '__main__':
    app.run(debug=True)
