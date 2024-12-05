import { saveItinerary } from "./save";

// Function to calculate radius based on walking speed and duration in minutes
const calculateRadius = (walkingSpeedKmHr, walkingDuration) => {
    const hours = walkingDuration / 60; // Convert minutes to hours
    return walkingSpeedKmHr * hours; // Distance = Speed * Time
};

// Function to calculate the distance between two locations using their latitudes and longitudes
const getDistance = (lat1, lon1, lat2, lon2) => {
    const deg2rad = (deg) => deg * (Math.PI / 180);
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

// Main function to generate the itinerary
export const generateItinerary = (
    allActivities,
    userLocation,
    totalMinutes,
    selectedCategories
) => {
    const walkingSpeedKmHr = 5; // Average walking speed in km/h
    const walkingDuration = Math.floor(totalMinutes / 3); // 1/3 of the total time for walking
    const walkingRadiusKm = calculateRadius(walkingSpeedKmHr, walkingDuration); // Walking radius based on time
    let remainingTime = totalMinutes; // Keep track of remaining time
    const finalItinerary = []; // Final itinerary to be generated

    // Step 1: Filter activities by walking radius
    const filteredActivities = allActivities.filter((activity) => {
        const distanceKm = getDistance(userLocation.lat, userLocation.lon, activity.latitude, activity.longitude);
        return distanceKm <= walkingRadiusKm;
    });

    // Step 2: Filter places by category
    const categoryDistribution = {};
    selectedCategories.forEach((category) => {
        // Group the filtered activities by category
        categoryDistribution[category] = filteredActivities.filter((activity) => activity.category === category);
    });

    // Step 3: Allocate time for each place in the itinerary
    let remainingActivityTime = Math.floor((2 / 3) * totalMinutes); // Allocate 2/3 of total time to activity
    let remainingWalkingTime = walkingDuration; // Remaining walking time

    selectedCategories.forEach((category) => {
        const placesInCategory = categoryDistribution[category];

        // Step 3.1: Add one place from each category (if available)
        if (placesInCategory.length > 0 && remainingTime > 0) {
            const place = placesInCategory[0]; // Take the first place (you can sort by rating if you want)
            const distanceKm = getDistance(userLocation.lat, userLocation.lon, place.latitude, place.longitude);
            const walkingTimeForFirstPlace = (distanceKm / walkingSpeedKmHr) * 60;

            if (remainingTime >= walkingTimeForFirstPlace + place.duration) {
                finalItinerary.push({
                    category,
                    place: place.name,
                    timeForActivity: place.duration,
                    walkingTime: walkingTimeForFirstPlace,
                    totalDuration: walkingTimeForFirstPlace + place.duration,
                    latitude: place.latitude,
                    longitude: place.longitude,
                });

                remainingTime -= walkingTimeForFirstPlace + place.duration; // Deduct used time
                remainingActivityTime -= place.duration; // Deduct activity time
                remainingWalkingTime -= walkingTimeForFirstPlace; // Deduct walking time
            }
        }

        // Step 3.2: Add more places from the category if there is time remaining
        placesInCategory.slice(1).forEach((place) => {
            if (remainingTime <= 0 || remainingActivityTime <= 0) return;

            const lastPlace = finalItinerary[finalItinerary.length - 1];
            const distanceKm = getDistance(lastPlace.latitude, lastPlace.longitude, place.latitude, place.longitude);
            const walkingTime = (distanceKm / walkingSpeedKmHr) * 60;

            if (remainingTime >= walkingTime + place.duration) {
                finalItinerary.push({
                    category,
                    place: place.name,
                    timeForActivity: place.duration,
                    walkingTime,
                    totalDuration: walkingTime + place.duration,
                    latitude: place.latitude,
                    longitude: place.longitude,
                });

                remainingTime -= walkingTime + place.duration; // Deduct used time
                remainingActivityTime -= place.duration; // Deduct activity time
                remainingWalkingTime -= walkingTime; // Deduct walking time
            }
        });
    });

    // Step 4: Ensure the total itinerary duration does not exceed `totalMinutes`
    let totalDuration = finalItinerary.reduce((sum, item) => sum + item.totalDuration, 0);
    if (totalDuration > totalMinutes) {
        const excessTime = totalDuration - totalMinutes;
        const lastPlace = finalItinerary[finalItinerary.length - 1];
        lastPlace.timeForActivity -= excessTime; // Trim the time for the last activity
        lastPlace.totalDuration -= excessTime;
        totalDuration = totalMinutes;
    }

    // Step 5: Calculate walking time between consecutive places and assign it
    for (let i = 0; i < finalItinerary.length - 1; i++) {
        const fromPlace = finalItinerary[i];
        const toPlace = finalItinerary[i + 1];

        // Calculate the walking distance between the places
        const distanceKm = getDistance(
            fromPlace.latitude,
            fromPlace.longitude,
            toPlace.latitude,
            toPlace.longitude
        );

        const walkingTimeMinutes = (distanceKm / walkingSpeedKmHr) * 60;

        // Update the next place's walking time and total duration
        if (walkingTimeMinutes > 0 && remainingTime >= walkingTimeMinutes) {
            finalItinerary[i + 1].walkingTime = walkingTimeMinutes;
            finalItinerary[i + 1].totalDuration += walkingTimeMinutes;
            remainingTime -= walkingTimeMinutes;
        }
    }
      
    // Return the final itinerary
   if (finalItinerary.length>0){
    saveItinerary(finalItinerary);
   }

    return finalItinerary;
};
