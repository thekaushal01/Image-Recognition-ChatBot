from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions

app = Flask(__name__)
CORS(app)  # Enable CORS

# Load the MobileNetV2 model pre-trained on ImageNet
model = MobileNetV2(weights='imagenet')

def prepare_image(image, target_size=(224, 224)):
    # Convert the image to RGB if it's not already
    if len(image.shape) == 2 or image.shape[2] == 1:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    else:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Resize the image to the target size
    image = cv2.resize(image, target_size)
    
    # Convert the image to a numpy array and preprocess it
    image = np.array(image)
    image = np.expand_dims(image, axis=0)
    image = preprocess_input(image)
    
    return image

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    try:
        # Read the image file using OpenCV
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        # Prepare the image for the model
        processed_image = prepare_image(image)
        
        # Make predictions
        predictions = model.predict(processed_image)
        decoded_predictions = decode_predictions(predictions, top=3)[0]
        
        # Format the results
        results = [{"label": pred[1], "probability": float(pred[2])} for pred in decoded_predictions]
        return jsonify({"predictions": results})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
    # app.run(debug=True, port=5500)
    # app.run(host='0.0.0.0', port=5000)
