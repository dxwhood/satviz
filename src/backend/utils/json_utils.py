# Damien Hood's JSON utils
import json

def samplep(data, num_samples=5):
    """Print a specified number of samples from the data."""
    if isinstance(data, list):
        # If the list is shorter than the requested number of samples, adjust the number
        num_samples = min(len(data), num_samples)
        for i in range(num_samples):
            print(f"Sample {i+1}:", data[i])
            print()  # Print a newline for better readability
    elif isinstance(data, dict):
        print("Data is a dictionary. Here are the first few key-value pairs:")
        for key, value in list(data.items())[:num_samples]:
            print(f"{key}: {value}")
    else:
        print("Unsupported data type for sampling.")
        
def pprint(datum):
    print(json.dumps(datum, indent=4))


def schema(data, level=0):
    """Recursively print the schema of the JSON data."""
    indent = " " * (level * 4)  # Indentation for nested elements
    if isinstance(data, dict):
        for key, value in data.items():
            print(f"{indent}{key}: {type(value).__name__}")
            if isinstance(value, (dict, list)):
                schema(value, level + 1)
    elif isinstance(data, list) and data:
        print(f"{indent}List of {type(data[0]).__name__}")
        if isinstance(data[0], (dict, list)):
            schema(data[0], level + 1)
    else:
        print(f"{indent}{type(data).__name__}")


def verify_keys(data, required_keys):
    """Verify that certain keys are present in the data."""
    if isinstance(data, dict):
        missing_keys = [key for key in required_keys if key not in data]
        if missing_keys:
            print("Missing keys:", missing_keys)
        else:
            print("All required keys are present.")
    elif isinstance(data, list) and all(isinstance(item, dict) for item in data):
        missing_keys = {key: 0 for key in required_keys}
        for item in data:
            for key in required_keys:
                if key not in item:
                    missing_keys[key] += 1
        if any(missing_keys.values()):
            print("Missing keys in list items:")
            for key, count in missing_keys.items():
                if count > 0:
                    print(f"{key}: missing in {count} items")
        else:
            print("All required keys are present in all items.")
    else:
        print("Data format is not compatible for key verification.")

