from flask import Flask, Response, jsonify, request, send_from_directory
import json
import os
from src.backend.utils import json_utils

app = Flask(__name__, static_folder='../../frontend/static', static_url_path='/static')

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
