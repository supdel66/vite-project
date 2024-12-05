import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, BrowserRouter } from 'react-router-dom';
import { supabase } from './createclient';
import Profile from './profile';
import BlogPage from "./blogspot";

// Home Component
const Home = () => {
   const navigate = useNavigate();

  useEffect(() => {
    const user = supabase.auth.getUser();
    console.log('Current user in Home component:', user);  // Log user state
    if (user) {
      navigate('/profile');  // If user is logged in, navigate to Profile page
    }
  }, [navigate]);


  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.error('Error during Google login:', error.message);
    } else {
      console.log('Redirecting to /profile...');
      navigate('/profile');
    }
  };
  return (
    <div>
      <h1>Welcome to the App</h1>
      <button onClick={handleGoogleLogin}>Login with Google</button>
    </div>
  );
};
// App Component
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/blogspot" element={<BlogPage />} />
      </Routes>
    </Router>
  );
};
export default App;
