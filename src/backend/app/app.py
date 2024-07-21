from flask import Flask, Response, jsonify, request
import json
import os
from src.backend.utils import json_utils

app = Flask(__name__)

@app.route('/')
def home():
    return 'Hello, World!'

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

if __name__ == '__main__':
    app.run(debug=True)
