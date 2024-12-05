import { useState, useEffect } from "react";
import { supabase } from "./createclient"; // Ensure you have Supabase client setup


const BlogPage = () => {
    const [blogs, setBlogs] = useState([]);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch the blogs from Supabase
    const fetchBlogs = async () => {
        const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching blogs:', error);
        } else {
            setBlogs(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBlogs();

        // Subscribe to real-time changes
        const blogSubscription = supabase
            .channel('blogs-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'blogs' }, (payload) => {
                console.log('Realtime blog change:', payload);
                fetchBlogs(); // Refresh the blogs list
            })
            .subscribe();

        return () => {
            supabase.removeChannel(blogSubscription); // Cleanup subscription
        };
    }, []);

    // Handle blog post creation
    const addBlog = async () => {
        if (!newTitle.trim() || !newContent.trim()) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert("Please log in to add a blog.");
            return;
        }

        const userEmail = session.user.email;
        const userId = session.user.id;

        const { data, error } = await supabase.from('blogs').insert([
            { user_id: userId, title: newTitle, content: newContent, creator_email: userEmail }
        ]);

        if (error) {
            console.error('Error adding blog:', error);
        } else {
            alert('Blog added successfully:', data);
            setNewTitle(''); // Reset the title field
            setNewContent(''); // Reset the content field
        }
    };

    // Handle blog deletion
    const deleteBlog = async (id) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert("Please log in to delete a blog.");
            return;
        }

        const { data, error } = await supabase
            .from('blogs')
            .delete()
            .eq('id', id)
            .eq('user_id', session.user.id); // Ensure only the creator can delete

        if (error) {
            console.error('Error deleting blog:', error);
        } else {
            console.log('Blog deleted successfully:', data);
        }
    };

    // Handle blog update
    const updateBlog = async (id, newTitle, newContent) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert("Please log in to edit a blog.");
            return;
        }

        const { data, error } = await supabase
            .from('blogs')
            .update({ title: newTitle, content: newContent, updated_at: new Date() })
            .eq('id', id)
            .eq('user_id', session.user.id); // Ensure only the creator can update

        if (error) {
            console.error('Error updating blog:', error);
        } else {
            console.log('Blog updated successfully:', data);
        }
    };

    return (
        <div>
            <h1>Community Blogs</h1>

            {/* New Blog Section */}
            <div>
                <h2>Share Your Experience</h2>
                <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Title"
                />
                <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Content"
                    rows="5"
                    cols="50"
                />
                <br />
                <button onClick={addBlog}>Post</button>
            </div>

            <hr />

            {/* Blogs List */}
            <h2>All Blogs</h2>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <ul>
                    {blogs.map((blog) => (
                        <li key={blog.id}>
                            <h3>{blog.title}</h3>
                            <p>{blog.content}</p>
                            <small>Created by: {blog.creator_email}</small>
                            <br />
                            <small>{new Date(blog.created_at).toLocaleString()}</small>
                            
                            {/* Edit and Delete buttons */}
                            <div>
                                <button onClick={() => updateBlog(blog.id, prompt("New title:", blog.title), prompt("New content:", blog.content))}>Edit</button>
                                <button onClick={() => deleteBlog(blog.id)}>Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default BlogPage;
