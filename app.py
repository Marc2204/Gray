from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModel
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.optim import AdamW
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from torch.utils.data import DataLoader, Dataset
from sklearn.utils import shuffle
import mysql.connector
import os

# Flask + Config
app = Flask(__name__)
CORS(app)

MODEL_NAME = "google-bert/bert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

CHECKPOINT_DIR = "checkpoints"
CHECKPOINT_FILE = os.path.join(CHECKPOINT_DIR, "emotion_classifier_checkpoint.pth")
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

training_status = {"status": "idle", "epoch": 0, "loss": None}
model = None
label_encoder = LabelEncoder()

# MySQL
db = mysql.connector.connect(
    host="127.0.0.1",
    user="root",         
    password="Marc2204@", 
    database="mental_health_db"
)
cursor = db.cursor(dictionary=True)

# Dataset + Model
class EmotionDataset(Dataset):
    def __init__(self, texts, labels):
        self.texts = texts
        self.labels = labels

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = tokenizer(self.texts[idx], return_tensors='pt',
                             truncation=True, padding='max_length', max_length=128)
        input_ids = encoding['input_ids'].squeeze(0)
        attention_mask = encoding['attention_mask'].squeeze(0)
        return {
            'input_ids': input_ids,
            'attention_mask': attention_mask,
            'label': torch.tensor(self.labels[idx], dtype=torch.long)
        }


class EmotionClassifier(nn.Module):
    def __init__(self, num_labels):
        super(EmotionClassifier, self).__init__()
        self.bert = AutoModel.from_pretrained(MODEL_NAME)
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(self.bert.config.hidden_size, num_labels)
        self.anomaly_head = nn.Linear(self.bert.config.hidden_size, 1)

    def forward(self, input_ids, attention_mask, labels=None, anomaly=False):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        cls_output = outputs.last_hidden_state[:, 0]

        if anomaly:
            score = torch.sigmoid(self.anomaly_head(self.dropout(cls_output)))
            return {"anomaly_score": score}

        logits = self.classifier(self.dropout(cls_output))
        loss = F.cross_entropy(logits, labels) if labels is not None else None
        return {"logits": logits, "loss": loss}


# Analyze endpoint
@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400

    result = analyze_text(text)
    
    # Optional: simple negative detection
    is_negative = result.get("label") in ["negative", "sad", "angry"]  # adjust as needed

    return jsonify({
        "label": result.get("label", "neutral"),
        "score": result.get("score", 0.0),
        "is_negative": is_negative
    })


# Helper: Load/Analyze
def load_model():
    global model
    if model is None:
        if os.path.exists(CHECKPOINT_FILE):
            checkpoint = torch.load(CHECKPOINT_FILE, map_location=device)
            num_labels = checkpoint.get('num_labels', len(checkpoint['label_encoder_classes']))
            model = EmotionClassifier(num_labels).to(device)
            model.load_state_dict(checkpoint['model_state_dict'])
            label_encoder.classes_ = checkpoint['label_encoder_classes']
    return model


def analyze_text(text):
    model = load_model()
    if model is None:
        return {"label": "neutral"}

    model.eval()
    with torch.no_grad():
        inputs = tokenizer(text, return_tensors='pt',
                           truncation=True, padding='max_length', max_length=128)
        input_ids = inputs['input_ids'].to(device)
        attention_mask = inputs['attention_mask'].to(device)

        output = model(input_ids=input_ids, attention_mask=attention_mask)
        logits = output['logits']
        probs = F.softmax(logits, dim=-1)
        top_prob, top_idx = torch.max(probs, dim=1)
        predicted_label = label_encoder.inverse_transform([top_idx.item()])[0]

    return {"label": predicted_label, "score": round(top_prob.item(), 4)}

# Posts + Comments APIs
@app.route('/posts/<space>', methods=['GET'])
def get_posts(space):
    cursor.execute("SELECT * FROM posts WHERE space = %s ORDER BY created_at DESC", (space,))
    posts = cursor.fetchall()
    for post in posts:
        cursor.execute("SELECT * FROM comments WHERE post_id = %s ORDER BY created_at ASC", (post['id'],))
        post['comments'] = cursor.fetchall()
    return jsonify(posts)


@app.route('/posts', methods=['POST'])
def create_post():
    data = request.get_json()
    text = data.get("text", "")
    space = data.get("space", "Community Support")

    result = analyze_text(text)
    emotion = result.get("label", "neutral")

    cursor.execute(
        "INSERT INTO posts (space, text, emotion) VALUES (%s, %s, %s)",
        (space, text, emotion)
    )
    db.commit()
    post_id = cursor.lastrowid
    return jsonify({"id": post_id, "space": space, "text": text, "emotion": emotion, "comments": []})


@app.route('/posts/<int:post_id>/comments', methods=['POST'])
def add_comment(post_id):
    data = request.get_json()
    text = data.get("text", "")

    result = analyze_text(text)
    emotion = result.get("label", "neutral")

    cursor.execute(
        "INSERT INTO comments (post_id, text, emotion) VALUES (%s, %s, %s)",
        (post_id, text, emotion)
    )
    db.commit()
    comment_id = cursor.lastrowid
    return jsonify({"id": comment_id, "post_id": post_id, "text": text, "emotion": emotion})


@app.route('/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    cursor.execute("DELETE FROM posts WHERE id = %s", (post_id,))
    db.commit()
    return jsonify({"message": "Post deleted"})


@app.route('/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    cursor.execute("DELETE FROM comments WHERE id = %s", (comment_id,))
    db.commit()
    return jsonify({"message": "Comment deleted"})


# Training endpoint
@app.route('/train', methods=['POST'])
def train():
    global model, label_encoder, training_status
    training_status["status"] = "training"

    try:
        file = request.files['file']
        df = pd.read_csv(file)
        df = shuffle(df)

        label_encoder.fit(df['label'])
        labels = label_encoder.transform(df['label'])
        dataset = EmotionDataset(df['text'].tolist(), labels)
        dataloader = DataLoader(dataset, batch_size=8, shuffle=True)

        model = EmotionClassifier(len(label_encoder.classes_)).to(device)
        optimizer = AdamW(model.parameters(), lr=2e-5)

        for epoch in range(5):
            model.train()
            total_loss = 0
            for batch in dataloader:
                input_ids = batch['input_ids'].to(device)
                attention_mask = batch['attention_mask'].to(device)
                labels = batch['label'].to(device)

                output = model(input_ids, attention_mask, labels)
                loss = output['loss']

                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            training_status.update({"epoch": epoch + 1, "loss": total_loss})

        torch.save({
            'model_state_dict': model.state_dict(),
            'label_encoder_classes': label_encoder.classes_,
            'num_labels': len(label_encoder.classes_)
        }, CHECKPOINT_FILE)

        training_status["status"] = "completed"
        return jsonify({"message": "Training complete", "loss": total_loss})

    except Exception as e:
        training_status["status"] = "error"
        return jsonify({"error": str(e)}), 500


@app.route('/training_status', methods=['GET'])
def get_training_status():
    return jsonify(training_status)


if __name__ == '__main__':
    app.run(debug=True)
