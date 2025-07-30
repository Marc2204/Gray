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
import os 

# Setup
app = Flask(__name__)
CORS(app)

MODEL_NAME = "google-bert/bert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

CHECKPOINT_DIR = "checkpoints"
CHECKPOINT_FILE = os.path.join(CHECKPOINT_DIR, "emotion_classifier_checkpoint.pth")
os.makedirs(CHECKPOINT_DIR, exist_ok=True) 

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

# --- Checkpoint functions ---
def save_checkpoint(model, optimizer, label_encoder_classes, num_labels, epoch, loss):
    """Saves model, optimizer, and label encoder state, including num_labels."""
    checkpoint_data = {
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'label_encoder_classes': list(label_encoder_classes), # Ensure it's a list
        'num_labels': num_labels, # Store num_labels explicitly
        'loss': loss
    }
    torch.save(checkpoint_data, CHECKPOINT_FILE)
    print(f"Checkpoint saved to {CHECKPOINT_FILE} at Epoch {epoch} with Loss: {loss:.4f}")

def load_checkpoint(model_instance, optimizer_instance, label_encoder_instance):
    """Loads model, optimizer, and label encoder state from a checkpoint.
    Returns start_epoch (always 0), checkpoint_loaded (bool), and num_labels_from_checkpoint.
    """
    if os.path.exists(CHECKPOINT_FILE):
        print(f"Loading checkpoint from {CHECKPOINT_FILE} for model/optimizer states...")
        checkpoint = torch.load(CHECKPOINT_FILE, map_location=device)
        
        # Load label encoder classes
        label_encoder_instance.classes_ = checkpoint['label_encoder_classes']
        num_labels_from_checkpoint = checkpoint.get('num_labels', len(label_encoder_instance.classes_))
        
        # Attempt to load model state_dict. If num_labels mismatches, strict=False will skip the classifier.
        # This is primarily for the /train endpoint to continue BERT fine-tuning.
        try:
            model_instance.load_state_dict(checkpoint['model_state_dict'], strict=False)
            print(f"Model state loaded (strict=False to handle potential classifier mismatches).")
        except RuntimeError as e:
            print(f"Warning: Could not load full model state dict: {e}. Classifier might be re-initialized.")
            # This can happen if the base BERT model also changed, but less likely.

        # Load optimizer state (only if model loaded, and it's compatible)
        optimizer_instance.load_state_dict(checkpoint['optimizer_state_dict'])
        print(f"Optimizer state loaded.")

        print(f"Checkpoint states loaded. Training will start new epoch counting from Epoch 1 (internally epoch 0).")
        return 0, True, num_labels_from_checkpoint
    
    return 0, False, None # No checkpoint, start from epoch 0, no num_labels from checkpoint

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

        df = shuffle(df)
        texts = df['text'].astype(str).tolist()
        
        # 1. Fit label_encoder to current data to get current_num_labels
        label_encoder.fit(df['label'].astype(str))
        labels = label_encoder.transform(df['label'].astype(str))
        current_num_labels = len(label_encoder.classes_)

        dataset = EmotionDataset(texts, labels)
        dataloader = DataLoader(dataset, batch_size=8, shuffle=True)

        if len(dataloader) == 0:
            return jsonify({"error": "Dataloader is empty. No data to train on."}), 400

        # Try to load checkpoint to see num_labels from previous run
        temp_model = EmotionClassifier(current_num_labels).to(device) # Temp model for loading check
        temp_optimizer = AdamW(temp_model.parameters(), lr=2e-5) # Temp optimizer
        
        # Try to load checkpoint to get its num_labels without applying to global model yet
        # load_checkpoint now handles loading into temp_model/optimizer and returns num_labels from checkpoint
        _, checkpoint_loaded, checkpoint_num_labels = load_checkpoint(temp_model, temp_optimizer, label_encoder)

        # 2. Initialize or re-initialize global model based on num_labels
        if checkpoint_loaded and checkpoint_num_labels is not None and current_num_labels != checkpoint_num_labels:
            print(f"Warning: Num_labels changed from checkpoint ({checkpoint_num_labels}) to current data ({current_num_labels}). "
                  "Re-initializing classifier head. BERT weights from checkpoint will be loaded.")
            model = EmotionClassifier(current_num_labels).to(device)
            # Load BERT part of the checkpoint, but not the classifier (strict=False)
            model_state_dict = temp_model.state_dict() # temp_model already has loaded states
            model.load_state_dict(model_state_dict, strict=False) 
            optimizer = AdamW(model.parameters(), lr=2e-5) # Re-initialize optimizer for new classifier
            start_epoch = 0 # Reset epoch count
        elif checkpoint_loaded:
            print(f"Num_labels consistent ({current_num_labels}). Resuming full model and optimizer state from checkpoint.")
            model = temp_model # Use the already loaded model
            optimizer = temp_optimizer # Use the already loaded optimizer
            start_epoch = 0 # Reset epoch count as per user request
        else: # No checkpoint found
            print("No checkpoint found. Initializing new model.")
            model = EmotionClassifier(current_num_labels).to(device)
            optimizer = AdamW(model.parameters(), lr=2e-5)
            start_epoch = 0

        model.train()

        target_loss = 3.0
        max_epochs = 100 

        current_epoch_num = start_epoch 
        final_loss = float('inf') 

        while current_epoch_num < max_epochs:
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
            
            print(f"Epoch {current_epoch_num + 1} Loss: {total_loss:.4f}")
            final_loss = total_loss 

            if total_loss <= target_loss:
                print(f"Target loss ({target_loss:.4f}) reached or exceeded. Stopping training.")
                break 

            current_epoch_num += 1
            
        if current_epoch_num >= max_epochs:
            print(f"Maximum epochs ({max_epochs}) reached without hitting target loss ({target_loss:.4f}).")

        epochs_completed = current_epoch_num 
        save_checkpoint(model, optimizer, label_encoder.classes_, current_num_labels, epochs_completed, final_loss) 

        return jsonify({"message": "Training complete", "labels": list(label_encoder.classes_), "final_loss": final_loss}) 

    except Exception as e:
        import traceback
        traceback.print_exc() 
        return jsonify({"error": str(e)}), 500

# Inference endpoint
@app.route('/analyze', methods=['POST'])
def analyze():
    global model, label_encoder

    try:
        # If model or label_encoder classes are not set, attempt to load from checkpoint
        if model is None or not hasattr(label_encoder, 'classes_') or len(label_encoder.classes_) == 0:
            if os.path.exists(CHECKPOINT_FILE):
                print(f"Attempting to load model and label encoder for analysis from {CHECKPOINT_FILE}...")
                checkpoint_data = torch.load(CHECKPOINT_FILE, map_location=device)
                
                # Ensure num_labels is available from checkpoint
                num_labels_from_checkpoint = checkpoint_data.get('num_labels', None)
                if num_labels_from_checkpoint is None:
                    # Fallback if old checkpoint without 'num_labels' key
                    num_labels_from_checkpoint = len(checkpoint_data['label_encoder_classes'])
                    print("Warning: 'num_labels' not found in checkpoint. Inferring from 'label_encoder_classes'.")
                
                if num_labels_from_checkpoint == 0: # Sanity check for empty classes
                     return jsonify({"error": "Checkpoint has no defined labels. Train a model with labels first."}), 400

                model = EmotionClassifier(num_labels_from_checkpoint).to(device)
                model.load_state_dict(checkpoint_data['model_state_dict'])
                
                label_encoder.classes_ = checkpoint_data['label_encoder_classes']
                
                print("Model and LabelEncoder loaded from checkpoint for analysis.")
            else:
                return jsonify({"error": "Model not trained yet and no checkpoint found."}), 400

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

            if not hasattr(label_encoder, 'classes_') or len(label_encoder.classes_) == 0:
                 return jsonify({"error": "Label encoder not initialized. Train the model first."}), 400

            predicted_label = label_encoder.inverse_transform([top_idx.item()])[0]
            NEGATIVE_EMOTIONS = {"anger", "sadness", "fear", "disgust", "guilt", "shame"} 
            is_negative = predicted_label.lower() in NEGATIVE_EMOTIONS and top_prob.item() > 0.6

            return jsonify({
                "label": predicted_label,
                "score": round(top_prob.item(), 4),
                "is_negative": is_negative
            })

    except Exception as e:
        import traceback
        traceback.print_exc() 
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)