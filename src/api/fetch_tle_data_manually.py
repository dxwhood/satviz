import requests
from dotenv import load_dotenv
import os
import json

# Load environment variables
load_dotenv()

# Set up session
session = requests.Session()

# Space-Track API login URL
login_url = 'https://www.space-track.org/ajaxauth/login'

# Get username and password from .env
username = os.getenv('SPACE_TRACK_USERNAME')
password = os.getenv('SPACE_TRACK_PASSWORD')

# Payload with your credentials
login_payload = {
    'identity': username,
    'password': password
}

# Sending the POST request using session
response = session.post(login_url, data=login_payload)

if response.status_code == 200:
    print("Login (probably) successful!")
else:
    print("Login failed!", response.status_code)

# Now, session cookies are automatically handled
# API URL for fetching GP data
gp_url = 'https://www.space-track.org/basicspacedata/query/class/gp/decay_date/null-val/epoch/%3Enow-30/orderby/norad_cat_id/format/json'

# Making the GET request using the session
gp_response = session.get(gp_url)
# Check if the data was fetched successfully
if gp_response.status_code == 200:
    print("Data fetched successfully!")
    # Parse the JSON data
    gp_data = gp_response.json()

    # File path where the data will be saved
    file_path = 'ST_gp_data.json'

    # Writing data to a JSON file
    with open(file_path, 'w') as file:
        json.dump(gp_data, file, indent=4)
    print(f"Data successfully saved to {file_path}")

else:
    print("Failed to fetch data", gp_response.status_code)


