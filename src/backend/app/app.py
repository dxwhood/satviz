from flask import Flask, Response, jsonify, request, send_from_directory
import json
import os
from src.backend.utils import json_utils

app = Flask(__name__, static_folder='../../frontend/static', static_url_path='/static')

@app.route('/')
def home():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/data', methods=['GET'])
def get_data():

    # Path to the JSON file
    current_dir = os.path.dirname(os.path.realpath(__file__))
    data_dir = os.path.join(current_dir, '../../../data/ST_gp_data.json')
    
    # Open and read the JSON file
    with open(data_dir, 'r') as file:
        data = json.load(file)  # assuming this is a list

    print("DEBUG: ")
    json_utils.pprint(data[1])

    return jsonify(data)

@app.route('/test/earth_texture')
def test_earth_texture():
    return send_from_directory(os.path.join(app.static_folder, 'assets/textures'), 'earth_texture.jpg')


if __name__ == '__main__':
    app.run(debug=True)
