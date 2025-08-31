CREATE DATABASE IF NOT EXISTS mental_health_db;
USE mental_health_db;

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


SELECT*FROM comments;
SELECT*FROM posts;