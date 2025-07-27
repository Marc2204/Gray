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

# Setup
app = Flask(__name__)
CORS(app)

MODEL_NAME = "google-bert/bert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Custom Dataset
class EmotionDataset(Dataset):
    def __init__(self, texts, labels):
        self.texts = texts
        self.labels = labels

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = tokenizer(
            self.texts[idx],
            return_tensors='pt',
            truncation=True,
            padding='max_length',
            max_length=128
        )
        input_ids = encoding['input_ids'].squeeze(0)
        attention_mask = encoding['attention_mask'].squeeze(0)
        return {
            'input_ids': input_ids,
            'attention_mask': attention_mask,
            'label': torch.tensor(self.labels[idx], dtype=torch.long)
        }

# Model
class EmotionClassifier(nn.Module):
    def __init__(self, num_labels):
        super(EmotionClassifier, self).__init__()
        self.bert = AutoModel.from_pretrained(MODEL_NAME)
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(self.bert.config.hidden_size, num_labels)

    def forward(self, input_ids, attention_mask, labels=None):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        cls_output = outputs.last_hidden_state[:, 0]
        logits = self.classifier(self.dropout(cls_output))
        loss = F.cross_entropy(logits, labels) if labels is not None else None
        return {"logits": logits, "loss": loss}

# Globals
model = None
label_encoder = LabelEncoder()

# Training endpoint
@app.route('/train', methods=['POST'])
def train():
    global model, label_encoder

    try:
        if 'file' not in request.files:
            return jsonify({"error": "CSV file missing"}), 400

        file = request.files['file']
        df = pd.read_csv(file)

        if 'text' not in df.columns or 'label' not in df.columns:
            return jsonify({"error": "CSV must contain 'text' and 'label' columns"}), 400

        # Shuffle and encode
        df = shuffle(df)
        texts = df['text'].astype(str).tolist()
        labels = label_encoder.fit_transform(df['label'].astype(str))
        num_labels = len(label_encoder.classes_)

        dataset = EmotionDataset(texts, labels)
        dataloader = DataLoader(dataset, batch_size=8, shuffle=True)

        model = EmotionClassifier(num_labels).to(device)
        optimizer = AdamW(model.parameters(), lr=2e-5)
        model.train()

        # Train for 3 epochs
        for epoch in range(3):
            total_loss = 0
            for batch in dataloader:
                input_ids = batch['input_ids'].to(device)
                attention_mask = batch['attention_mask'].to(device)
                label = batch['label'].to(device)

                output = model(input_ids=input_ids, attention_mask=attention_mask, labels=label)
                loss = output['loss']

                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

                total_loss += loss.item()

            print(f"Epoch {epoch + 1} Loss: {total_loss:.4f}")

        return jsonify({"message": "Training complete", "labels": label_encoder.classes_.tolist()})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Inference endpoint
@app.route('/analyze', methods=['POST'])
def analyze():
    global model, label_encoder

    try:
        if model is None:
            return jsonify({"error": "Model not trained yet"}), 400

        data = request.get_json()
        text = data.get('text', '').strip()

        if not text:
            return jsonify({"error": "No text provided"}), 400

        model.eval()
        with torch.no_grad():
            inputs = tokenizer(
                text,
                return_tensors='pt',
                truncation=True,
                padding='max_length',
                max_length=128
            )
            input_ids = inputs['input_ids'].to(device)
            attention_mask = inputs['attention_mask'].to(device)

            output = model(input_ids=input_ids, attention_mask=attention_mask)
            logits = output['logits']
            probs = F.softmax(logits, dim=-1)
            top_prob, top_idx = torch.max(probs, dim=1)

            predicted_label = label_encoder.inverse_transform([top_idx.item()])[0]
            NEGATIVE = {"anger", "sadness", "fear", "disgust", "guilt", "shame"}
            is_negative = predicted_label.lower() in NEGATIVE and top_prob.item() > 0.6

            return jsonify({
                "label": predicted_label,
                "score": round(top_prob.item(), 4),
                "is_negative": is_negative
            })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
