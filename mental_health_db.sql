CREATE DATABASE IF NOT EXISTS mental_health;
USE mental_health;

-- Community Section
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    space ENUM(
        'Community Support',
        'Suggested Actions',
        'About Developers',
        'About System',
        'Admin Dashboard',
        'User Reports',
        'System Notifications',
        'Admin Actions'
    ) NOT NULL,
    text TEXT NOT NULL,
    emotion VARCHAR(50) DEFAULT 'neutral',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    text TEXT NOT NULL,
    emotion VARCHAR(50) DEFAULT 'neutral',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Anxiety Test (GAD-7)
CREATE TABLE IF NOT EXISTS anxiety_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(100) NULL,
    score INT NOT NULL,
    result_text VARCHAR(255) NOT NULL,
    description TEXT,
    lr_score DECIMAL(5,4) NULL,
    bert_anomaly_score DECIMAL(5,4) NULL,
    final_risk VARCHAR(100) NULL,
    is_high_risk BOOLEAN DEFAULT FALSE,
    answers_json JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Depression Test (PHQ-9)
CREATE TABLE IF NOT EXISTS depression_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(100) NULL,
    score INT NOT NULL,                
    result_text VARCHAR(255) NOT NULL, 
    description TEXT,                 
    lr_score DECIMAL(5,4) NULL,
    bert_anomaly_score DECIMAL(5,4) NULL,
    hybrid_risk_score DECIMAL(5,4) NULL,
    risk_level VARCHAR(100) NULL,
    is_high_risk BOOLEAN DEFAULT FALSE,
    answers_json JSON NOT NULL, 9 answers in JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Personality Test (BFI-10)
CREATE TABLE IF NOT EXISTS personality_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(100) NULL,
    extraversion INT NOT NULL,
    agreeableness INT NOT NULL,
    neuroticism INT NOT NULL,
    openness INT NOT NULL,
    conscientiousness INT NOT NULL,
    hybrid_score DECIMAL(5,4) NULL,
    risk_level VARCHAR(50) NULL,
    lr_score DECIMAL(5,4) NULL,
    bert_score DECIMAL(5,4) NULL,
    is_high_risk BOOLEAN DEFAULT FALSE,
    answers_json JSON NOT NULL,        
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wellbeing_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(100) NULL,           
    score INT NOT NULL,                
    result_text VARCHAR(255) NOT NULL,     
    description TEXT,                      
    lr_score DECIMAL(5,4) NULL,            
    bert_score DECIMAL(5,4) NULL,          
    hybrid_score DECIMAL(5,4) NULL,        
    risk_level VARCHAR(100) NULL,          
    is_high_risk BOOLEAN DEFAULT FALSE,
    answers_json JSON NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Views / Queries
SELECT * FROM posts;
SELECT * FROM comments;
SELECT * FROM anxiety_results;
SELECT * FROM depression_results;
SELECT * FROM personality_results;
SELECT * FROM wellbeing_results; 
