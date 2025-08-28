import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import './PeerSupport.css';

const userSpaces = [
    'Community Support',
    'Suggested Actions',
    'About Developers',
    'About System'
];

const adminSpaces = [
    'Admin Dashboard',
    'User Reports',
    'System Notifications',
    'Admin Actions',
];

const PeerSupport = ({ initialSpace = 'Community Support' }) => {
    const [activeSpace, setActiveSpace] = useState(initialSpace);
    const [postInput, setPostInput] = useState('');
    const [posts, setPosts] = useState(() => {
        const initial = {};
        [...userSpaces, ...adminSpaces].forEach(space => {
            initial[space] = [];
        });
        return initial;
    });

    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [csvFile, setCsvFile] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                setIsAdmin(user.email === 'admin@gmail.com');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, 'yourPassword');
        } catch (error) {
            console.error('Login failed:', error);
            alert('Failed to log in.');
        }
    };

    if (loading) return <div>Loading...</div>;

    const spaces = isAdmin ? adminSpaces : userSpaces;

    const handlePost = async () => {
        if (!postInput.trim()) return;
        const user = auth.currentUser;
        const userName = isAdmin && user ? user.email : 'Anonymous';

        try {
            const response = await fetch('http://localhost:5000/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: postInput }),
            });
            const analysis = await response.json();
            const emotion = analysis.label || 'neutral';

            if (analysis.is_negative) {
                alert("⚠️ Your post expresses strong negative emotions. If you're in crisis, please consider seeking help or contacting a support hotline.");
            }

            const newPost = {
                id: Date.now(),
                text: postInput,
                emotion,
                userName,
                comments: [],
            };

            setPosts(prev => ({
                ...prev,
                [activeSpace]: [newPost, ...prev[activeSpace]],
            }));
            setPostInput('');
        } catch (error) {
            console.error('Failed to analyze post:', error);
            alert('Error analyzing post.');
        }
    };

    const handleCSVUpload = async () => {
        if (!csvFile) {
            alert('Please select a CSV file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', csvFile);

        try {
            const response = await fetch('http://localhost:5000/train', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            alert(result.message || result.error);
        } catch (err) {
            console.error('CSV upload failed:', err);
            alert('CSV upload failed.');
        }
    };

    const renderMainContent = () => {
        if (activeSpace === 'Suggested Actions') {
            return (
                <div className="resource-links">
                    <h3>Suggested Actions</h3>
                    <ul>
                        <li>🏥 <a href="https://www.doh.gov.ph/mental-health" target="_blank" rel="noreferrer">DOH Mental Health Resources</a></li>
                        <li>📍 <a href="https://www.ncmh.gov.ph/" target="_blank" rel="noreferrer">National Center for Mental Health</a> – Hotline: 1553</li>
                        <li>📞 <a href="https://www.facebook.com/ncmhcrisishotline/" target="_blank" rel="noreferrer">NCMH Crisis Hotline (Facebook)</a></li>
                        <li>🧠 <a href="https://mentalhealthph.org/" target="_blank" rel="noreferrer">MentalHealthPH.org</a></li>
                        <li>🔍 <a href="https://directory.psychology.org.ph/" target="_blank" rel="noreferrer">Find a Psychologist</a></li>
                    </ul>
                    <p className="note">These resources are verified and can guide you to professional support. 💙</p>
                </div>
            );
        }

        if (activeSpace === 'About Developers') {
            return (
                <div className="about-developer">
                    <h3>👨‍💻 About the Developers</h3>
                    <p>
                        This platform was developed as part of the thesis project: <br />
                        <strong>"Mental Health Assessment Using Logistic Regression for Early Detection of Psychological Distress"</strong>.
                    </p>

                    <ul className="developer-team">
                        <li>👨‍💻 <strong>MARC RAINIER B. BUITIZON</strong> – Lead Programmer</li>
                        <li>📋 <strong>Jeffrey Ramirez</strong> – Project Leader</li>
                        <li>🛠 <strong>Gabriela Enriquez</strong> – System Manager</li>
                        <li>🎨 <strong>Jensha Maniflor</strong> – Designer</li>
                    </ul>

                    <p>
                        Our goal is to integrate AI-assisted analysis with peer support to encourage early detection 
                        of psychological distress while providing a safe and anonymous platform for sharing thoughts.
                    </p>
                    <p className="note">
                        💡 Disclaimer: This platform does not replace professional diagnosis or treatment. 
                        If you’re in crisis, please seek immediate help from a licensed professional or 
                        mental health hotline.
                    </p>
                </div>
            );
        }
        if (activeSpace === 'About System') {
    return (
        <div className="about-system">
            <h3>🖥️ About the System</h3>
            <p>
               This system is designed to help people in understanding and self-evaluation of their mental well-being using Artificial Intelligence. There are tests for anxiety, depression, general well- being, and personality characteristics. The scoring in different categories is analyzed via a logistic regression model, which further helps in classifying the results as per risk levels. An AI chatbot helps one in guided self-reflection; a peer support is there for enabling safe, anonymous sharing and encouragement. The system is designed with the perspective of user privacy, ethical interactions, and early detection to support overall mental well-being.
            </p>

        </div>
    );
}

        return (
            <>
                <div className="posts-list">
                    {posts[activeSpace]?.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            space={activeSpace}
                            posts={posts}
                            setPosts={setPosts}
                            isAdmin={isAdmin}
                        />
                    ))}
                </div>
                <div className="post-box">
                    <textarea
                        rows="3"
                        placeholder="Share your thoughts anonymously..."
                        value={postInput}
                        onChange={(e) => setPostInput(e.target.value)}
                    />
                    <button onClick={handlePost}>Post</button>
                </div>
            </>
        );
    };

    return (
        <div className="peer-layout">
            <aside className="left-sidebar">
                <h3>Spaces</h3>
                <ul>
                    {spaces.map(space => (
                        <li
                            key={space}
                            className={space === activeSpace ? 'active' : ''}
                            onClick={() => setActiveSpace(space)}
                        >
                            {space}
                        </li>
                    ))}
                </ul>
            </aside>
            <main className="main-content">
                <div className="space-header">
                    <h2>{activeSpace}</h2>
                    <p className="anonymous-note">All posts are anonymous 💬</p>
                </div>

                {renderMainContent()}

                {isAdmin && (
                    <div className="csv-upload">
                        <h4>📊 Train Emotion Classifier</h4>
                        <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
                        <button onClick={handleCSVUpload}>Upload & Train</button>
                    </div>
                )}
            </main>
            <aside className="right-sidebar">
                <h4>Related Topics</h4>
                <ul>
                    <li>Self-Care</li>
                    <li>Stress Relief</li>
                    <li>Motivational Stories</li>
                    <li>Dealing with Burnout</li>
                </ul>
            </aside>
        </div>
    );
};

const PostCard = ({ post, space, posts, setPosts, isAdmin }) => {
    const [comment, setComment] = useState('');

    const addComment = async () => {
        if (!comment.trim()) return;

        try {
            const response = await fetch('http://localhost:5000/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: comment }),
            });
            const analysis = await response.json();
            const emotion = analysis.label || 'neutral';

            if (analysis.is_negative) {
                alert("⚠️ Your comment expresses strong negative emotions. If you're in crisis, please consider seeking help or contacting a support hotline.");
            }

            const updatedPosts = posts[space].map(p =>
                p.id === post.id
                    ? {
                        ...p,
                        comments: [...p.comments, { id: Date.now(), text: comment, emotion }],
                    }
                    : p
            );
            setPosts({ ...posts, [space]: updatedPosts });
            setComment('');
        } catch (error) {
            console.error('Failed to analyze comment:', error);
            alert('Error analyzing comment.');
        }
    };

    const deleteComment = (commentId) => {
        const updatedPosts = posts[space].map(p =>
            p.id === post.id
                ? { ...p, comments: p.comments.filter(c => c.id !== commentId) }
                : p
        );
        setPosts({ ...posts, [space]: updatedPosts });
    };

    return (
        <div className="post-card">
            <p className="post-text">
                {isAdmin && post.userName && <span className="poster-name">{post.userName}:</span>}
                {!isAdmin && 'Anonymous:'} {post.text}
                <span className="emotion-tag"> ({post.emotion})</span>
                <button className='delete-button'>Delete</button>
            </p>
            <div className="comment-area">
                <input
                    type="text"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />
                <button onClick={addComment}>Comment</button>
            </div>
            <div className="comments">
                {post.comments.map(c => (
                    <div key={c.id} className="comment">
                        <p className="comment-text">
                            💬 {c.text}
                            {c.emotion && <span className="emotion-tag"> ({c.emotion})</span>}
                        </p>
                        {isAdmin && (
                            <button
                                className="delete-comment"
                                onClick={() => deleteComment(c.id)}
                            >
                                Delete
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PeerSupport;
