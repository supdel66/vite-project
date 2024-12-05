import { supabase } from "./createclient";

const getUserId = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        console.error('No active session found:', error);
        return null;
    }

    const userEmail = session.user.email; // Get the user email from the session
    console.log("User Email:", userEmail);

    return userEmail;
};

const saveItineraryAsJsonToSupabase = async (userEmail, itinerary) => {
    try {
        // Check if a similar itinerary already exists for the user
        const { data: existingItineraries, error: fetchError } = await supabase
            .from('itineraries')
            .select('id')
            .eq('user_id', userEmail)
            .eq('itinerary', JSON.stringify(itinerary)); // Compare as a JSON string

        if (fetchError) {
            console.error('Error checking existing itinerary:', fetchError);
            return { success: false, error: fetchError };
        }

        if (existingItineraries && existingItineraries.length > 0) {
            console.log('Duplicate itinerary exists. Skipping save.');
            return { success: false, message: 'Duplicate itinerary already exists.' };
        }

        // Insert new itinerary if no duplicates
        const { data, error } = await supabase.from('itineraries').insert([
            {
                user_id: userEmail,
                itinerary: itinerary, // Save itinerary as a JSON object
            },
        ]);

        if (error) {
            console.error('Error saving itinerary:', error);
            return { success: false, error };
        }

        console.log('Itinerary saved successfully:', data);
        return { success: true, data };

    } catch (err) {
        console.error('Unexpected error:', err);
        return { success: false, error: err };
    }
};

export const saveItinerary = async (itinerary) => {
    try {
        const userEmail = await getUserId(); // Await the user email retrieval
        if (!userEmail) {
            console.error('Failed to retrieve user email. Cannot save itinerary.');
            return;
        }

        const response = await saveItineraryAsJsonToSupabase(userEmail, itinerary); // Save the itinerary
        if (response.success) {
            console.log('Itinerary successfully saved to Supabase!');
        } else if (response.message) {
            console.log(response.message); // Log if duplicate
        } else {
            console.error('Failed to save itinerary:', response.error);
        }
    } catch (err) {
        console.error('Unexpected error during saving process:', err);
    }
};
