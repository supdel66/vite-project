import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, BrowserRouter } from 'react-router-dom';
import { supabase } from "./createclient";
import { generateItinerary } from "./logic";
import './profile.css';

const Profile = () => {

  const navigate = useNavigate(); // Declare useNavigate hook at the start
  
  const [allActivities, setAllActivities] = useState([]);
  const [categories, setCategories] = useState([]); // Keep track of selected categories
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState([]);
  const [totalHours, setTotalHours] = useState("3"); 

  // Available categories to choose from
  const userLocation = { lat: 27.7172, lon: 85.324 }; // Replace with actual user location
  const availableCategories = ['local food', 'modern food', 'fast food'];

  const handleCategoryChange = (event) => {
    const { value, checked } = event.target;

    setCategories((prevCategories) => {
      if (checked) {
        // Add the selected category if checked
        return [...prevCategories, value];
      } else {
        // Remove the category if unchecked
        return prevCategories.filter((category) => category !== value);
      }
    });
  };

  // Fetch activities from Supabase
  const fetchActivities = async () => {
    try {
      setLoading(true);
      let alldata = [];

      // Fetch activities for each selected category
      for (let category of categories) {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('category', category) // Filter by category
          .order('rating', { ascending: false });

        if (error) {
          throw error;
        }

        alldata.push(...data);
      }

      // Sort activities by rating
      alldata.sort((a, b) => b.rating - a.rating);

      setAllActivities(alldata); // Set fetched activities to state
    } catch (error) {
      console.log('Error fetching activities:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHoursChange = (event) => {
    setTotalHours(event.target.value);
  };

  const handleGenerateItinerary = () => {
    const totalMinutes = totalHours * 60;
    const generatedItinerary = generateItinerary(
      allActivities,
      userLocation,
      totalMinutes,
      categories
    );
    
    console.log(generatedItinerary);
    setItinerary(generatedItinerary);

  };


  const handleBlogSpot = async () => {
   
  
    const { data: { session }, error } = await supabase.auth.getSession();
  
    if (error || !session) {
      console.error('No active session found:', error);
      alert('You must be logged in first!');
      return; // Exit the function if no active session is found
    }
  
    const userId = session.user.id;
  
    if (!userId) {
      alert('Login first');
      return;
    }
  
    // Proceed to the blogspot page if session exists and userId is valid
    navigate('/blogspot');
  };
  

  // UseEffect to fetch activities when categories change
  useEffect(() => {
    if (categories.length > 0) {
      fetchActivities(); // Fetch activities when categories change
    } else {
      setAllActivities([]); // If no categories are selected, clear activities list
      setItinerary([]);
    }
  }, [categories]);




  return (
    <div>
      <h2>Give your preferences or categories.</h2>
      <br />
      <h3>How many hours do you have?</h3>
      <select value={totalHours} onChange={handleHoursChange}>
        <option value="" disabled>
          -- Select --
        </option>
        {[1, 2, 3, 4, 5, 6].map((number) => (
          <option key={number} value={number}>
            {number}
          </option>
        ))}
      </select>

      <h3>Food preferences</h3>
      {availableCategories.map((category) => (
        <div key={category}>
          <input
            type="checkbox"
            value={category}
            checked={categories.includes(category)}
            onChange={handleCategoryChange}
          />
          <label>{category}</label>
        </div>
      ))}

      <br />
      <button onClick={handleGenerateItinerary}>Generate Itinerary</button>

      <button onClick={handleBlogSpot}>Go to BlogSpot</button>

      {loading ? (
        <p>Loading activities...</p>
      ) : (
        <div>
          <h3>Activities</h3>
          {allActivities.length > 0 ? (
            <ul>
              {allActivities.map((activity) => (
                <li key={activity.id}>
                  <h4>{activity.name}</h4>
                  <p>{activity.description}</p>
                  <p>Rating: {activity.rating}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No activities found.</p>
          )}
        </div>
      )}

      {itinerary.length > 0 && (
        <div>
          <h3>Your Itinerary</h3>
          <table>
            <thead>
              <tr>
                <th>Place</th>
                <th>Category</th>
                <th>Time Spent (Minutes)</th>
                <th>Walking Time(Minutes)</th>
                <th>Total Duration (Minutes)</th>
              </tr>
            </thead>
            <tbody>
              {itinerary.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.place}</td>
                  <td>{entry.category}</td>
                  <td>{entry.timeForActivity}</td>
                  <td>{entry.walkingTime}</td>
                  <td>{entry.totalDuration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Profile;
