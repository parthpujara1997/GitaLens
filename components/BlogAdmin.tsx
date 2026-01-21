import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    author: string;
    category: string;
    created_at: string;
}

interface BlogAdminProps {
    onBack: () => void;
}

const BlogAdmin: React.FC<BlogAdminProps> = ({ onBack }) => {
    const { user, isAdmin } = useAuth();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (err: any) {
            console.error('Error fetching posts:', err.message);
            // Allow graceful failure if table doesn't exist yet
            if (err.code === '42P01') {
                setError('Database table "posts" does not exist yet. Please run the setup SQL.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!isAdmin) {
            alert('Unauthorized.');
            return;
        }
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const { error } = await supabase.from('posts').delete().match({ id });
            if (error) throw error;
            setPosts(posts.filter(p => p.id !== id));
        } catch (err: any) {
            alert('Error deleting post: ' + err.message);
        }
    };

    const handleSave = async () => {
        try {
            if (!isAdmin) {
                alert('Unauthorized. Only admins can publish posts.');
                return;
            }

            if (!currentPost.title || !currentPost.content) {
                alert('Title and Content are required');
                return;
            }

            // Auto-generate slug if missing
            const slug = currentPost.slug || currentPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

            const postData = {
                title: currentPost.title,
                slug: slug,
                excerpt: currentPost.excerpt || '',
                content: currentPost.content,
                category: currentPost.category || 'Mindfulness', // Default
                author: currentPost.author || 'GitaLens Team',
                // updated_at: new Date().toISOString()
            };

            if (currentPost.id) {
                // Update
                const { error } = await supabase
                    .from('posts')
                    .update(postData)
                    .match({ id: currentPost.id });
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('posts')
                    .insert([postData]);
                if (error) throw error;
            }

            setIsEditing(false);
            setCurrentPost({});
            fetchPosts();
        } catch (err: any) {
            alert('Error saving post: ' + err.message);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    if (isEditing) {
        return (
            <div className="max-w-4xl mx-auto p-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-serif text-charcoal">{currentPost.id ? 'Edit Post' : 'New Post'}</h2>
                    <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-stone-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4 bg-white p-6 rounded-2xl border border-stone-warm shadow-sm">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Title</label>
                        <input
                            className="w-full p-2 border border-stone-200 rounded-lg font-serif text-lg focus:ring-2 focus:ring-saffron-deep outline-none"
                            value={currentPost.title || ''}
                            onChange={e => setCurrentPost({ ...currentPost, title: e.target.value })}
                            placeholder="Enter post title..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Slug (URL)</label>
                            <input
                                className="w-full p-2 border border-stone-200 rounded-lg text-sm bg-stone-50"
                                value={currentPost.slug || ''}
                                onChange={e => setCurrentPost({ ...currentPost, slug: e.target.value })}
                                placeholder="article-url-slug"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Category</label>
                            <input
                                className="w-full p-2 border border-stone-200 rounded-lg text-sm"
                                value={currentPost.category || ''}
                                onChange={e => setCurrentPost({ ...currentPost, category: e.target.value })}
                                placeholder="e.g. Mindfulness"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Excerpt</label>
                        <textarea
                            className="w-full p-2 border border-stone-200 rounded-lg text-sm h-20 focus:ring-2 focus:ring-saffron-deep outline-none"
                            value={currentPost.excerpt || ''}
                            onChange={e => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
                            placeholder="Short summary..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Content (Markdown supported)</label>
                        <textarea
                            className="w-full p-4 border border-stone-200 rounded-lg font-mono text-sm h-96 focus:ring-2 focus:ring-saffron-deep outline-none"
                            value={currentPost.content || ''}
                            onChange={e => setCurrentPost({ ...currentPost, content: e.target.value })}
                            placeholder="Write your article content here..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-stone-100">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-stone-500 hover:text-charcoal"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center space-x-2 px-6 py-2 bg-charcoal text-white rounded-xl hover:bg-black transition-colors shadow-lg"
                        >
                            <Save size={18} />
                            <span>Save Post</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 animate-in fade-in">
            <div className="flex justify-between items-center mb-8">
                <button onClick={onBack} className="flex items-center space-x-2 text-stone-500 hover:text-charcoal">
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </button>
                <h1 className="text-3xl font-serif text-charcoal">Blog Admin</h1>
                <button
                    onClick={() => { setCurrentPost({}); setIsEditing(true); }}
                    className="flex items-center space-x-2 px-4 py-2 bg-saffron-deep text-white rounded-xl hover:bg-saffron-deep/90 shadow-md transition-all"
                >
                    <Plus size={20} />
                    <span>New Post</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><X size={16} /></button>
                </div>
            )}

            {posts.length === 0 ? (
                <div className="text-center py-20 bg-stone-50 rounded-2xl border border-stone-100">
                    <p className="text-stone-500">No posts found. Create your first one!</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-stone-warm shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500">Title</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500">Category</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500">Date</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {posts.map(post => (
                                <tr key={post.id} className="hover:bg-stone-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-charcoal">{post.title}</td>
                                    <td className="px-6 py-4 text-sm text-stone-500">{post.category}</td>
                                    <td className="px-6 py-4 text-sm text-stone-500">
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => { setCurrentPost(post); setIsEditing(true); }}
                                            className="p-2 text-stone-400 hover:text-charcoal hover:bg-stone-100 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default BlogAdmin;
