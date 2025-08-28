import React, { useState, useEffect } from "react";
import "../componentDesign/Login.css";
import {
  doSignInWithGoogle,
  doCreateWithEmailAndPassword,
  doSignInWithEmailAndPassword,
  doSignOut,
  doPasswordReset
} from "../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase"; // Adjust according to your Firebase setup

const Login = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ name: "", email: "", phone: "", password: "" });
  const [user, setUser] = useState(null); // Track the current user

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Current user:", user);
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log("User state has been updated:", user);
  }, [user]);

  const handleLoginChange = (e) => {
    setLoginData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegisterChange = (e) => {
    setRegisterData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await doCreateWithEmailAndPassword(registerData.email, registerData.password);
      alert("Registration successful!");
      setIsLogin(true);
      setRegisterData({ name: "", email: "", phone: "", password: "" });
    } catch (error) {
      alert("The email is already in use.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await doSignInWithEmailAndPassword(loginData.email, loginData.password);
      alert("Login successful!");
      onClose();
    } catch (error) {
      alert("Invalid email or password.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await doSignInWithGoogle();
      alert("Google Login successful!");
      onClose();
    } catch (error) {
      alert("Google Login failed.");
    }
  };


  const handleForgotPassword = async () => {
    if (!loginData.email) {
      alert("Please enter your email to reset password.");
      return;
    }
    try {
      await doPasswordReset(loginData.email);
      alert("Password reset email sent!");
    } catch (error) {
      alert("Failed to send password reset email. Make sure the email is valid.");
    }
  };

  return (
    <div className="modal-overlay fullscreen">
      <div className="modal-content modal-fullscreen">
        <button className="close-button" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        <h2 className="modal-title">Mental Health</h2>

        <div className="modal-toggle">
          <button className={isLogin ? "active" : ""} onClick={() => setIsLogin(true)}>
            Login
          </button>
          <button className={!isLogin ? "active" : ""} onClick={() => setIsLogin(false)}>
            Sign Up
          </button>
        </div>

        {isLogin ? (
          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={loginData.email}
              onChange={handleLoginChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={loginData.password}
              onChange={handleLoginChange}
              required
            />
            <button type="submit">Login</button>
            <button type="button" onClick={handleGoogleSignIn} className="google-sign-in">
              Login with Google
            </button>
            <p className="forgot-password" onClick={handleForgotPassword}>
              Forgot Password?
            </p>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleRegister}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={registerData.name}
              onChange={handleRegisterChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={registerData.email}
              onChange={handleRegisterChange}
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number (Optional)"
              value={registerData.phone}
              onChange={handleRegisterChange}
              //required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={registerData.password}
              onChange={handleRegisterChange}
              required
            />
            <button type="submit">Sign Up</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
