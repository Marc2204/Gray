from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline

app = Flask(__name__)
CORS(app)

# Initialize zero-shot classifier using bert-base model
classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli"  # closest to bert-base for zero-shot tasks
)

# Define emotion labels to classify against
EMOTION_LABELS = ["anger", "sadness", "fear", "disgust", "guilt", "shame", "joy", "love", "surprise"]

NEGATIVE_EMOTIONS = {"anger", "sadness", "fear", "disgust", "guilt", "shame"}

@app.route('/analyze', methods=['POST'])
def analyze_text():
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        if not text:
            return jsonify({"error": "No text provided"}), 400

        results = classifier(text, EMOTION_LABELS)
        # Get the top label and its score
        top_label = results["labels"][0]
        top_score = results["scores"][0]

        is_negative = top_label.lower() in NEGATIVE_EMOTIONS and top_score >= 0.6

        return jsonify({
            "label": top_label,
            "score": top_score,
            "is_negative": is_negative
        })

    except Exception as e:
        print(f"Error during analysis: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
