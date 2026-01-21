import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    content: string; // Stored as text/markdown
    author: string;
    created_at: string;
    readTime?: string; // We can calculate this
    category: string;
}

const Blog: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [scrollProgress, setScrollProgress] = useState(0);
    const articleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    // Scroll progress tracker
    useEffect(() => {
        if (!selectedPost) {
            setScrollProgress(0);
            return;
        }

        const handleScroll = () => {
            if (!articleRef.current) return;

            const element = articleRef.current;
            const scrollTop = window.scrollY;
            const docHeight = element.offsetHeight;
            const winHeight = window.innerHeight;
            const scrollPercent = scrollTop / (docHeight - winHeight);
            setScrollProgress(Math.min(Math.max(scrollPercent, 0), 1));
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [selectedPost]);

    const fetchPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn("Supabase fetch error (likely table doesn't exist yet):", error.message);
                // Fallback or empty state is handled by initial state
            } else {
                setPosts(data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calculateReadTime = (content: string) => {
        const words = content.trim().split(/\s+/).length;
        const time = Math.ceil(words / 200);
        return `${time} min read`;
    };

    if (selectedPost) {
        return (
            <div ref={articleRef} className="animate-in fade-in slide-in-from-right-8 duration-500 w-full max-w-2xl mx-auto pb-20 relative">
                {/* Saffron Progress Bar */}
                <div
                    className="fixed top-0 left-0 h-1 bg-saffron-deep/80 z-50 transition-all duration-100"
                    style={{ width: `${scrollProgress * 100}%` }}
                />

                <button
                    onClick={() => setSelectedPost(null)}
                    className="mb-6 flex items-center space-x-2 text-stone-500 hover:text-charcoal transition-colors group sticky top-4 z-40 bg-[#F2EFE9]/80 backdrop-blur-sm py-2 px-3 rounded-full w-fit"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium text-sm">Back</span>
                </button>

                <article className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-100">
                    <div className="flex items-center space-x-2 mb-6">
                        <span className="px-3 py-1 bg-stone-100 text-stone-600 text-[10px] uppercase tracking-widest font-bold rounded-full">
                            {selectedPost.category || 'Insight'}
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="text-xs text-stone-400 font-medium">
                            {calculateReadTime(selectedPost.content)}
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-serif text-charcoal mb-6 leading-tight">
                        {selectedPost.title}
                    </h1>

                    <div className="flex items-center justify-between border-b border-stone-100 pb-8 mb-8">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-saffron-deep/10 rounded-full flex items-center justify-center text-saffron-deep font-bold font-serif">
                                {(selectedPost.author || 'G')[0]}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-charcoal">{selectedPost.author || 'GitaLens Team'}</p>
                                <p className="text-xs text-stone-500">
                                    {new Date(selectedPost.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Optimized Prose Layer */}
                    <div
                        className="max-w-[650px] mx-auto whitespace-pre-wrap font-serif text-lg text-stone-700 leading-[1.75] tracking-tight"
                        style={{ lineHeight: '1.75' }}
                    >
                        {selectedPost.content}
                    </div>
                </article>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-700 pb-20">
            <div className="flex items-center justify-between mb-8 px-4">
                <div className="flex items-center space-x-4">
                    {/* Mobile back button */}
                    <button onClick={onBack} className="md:hidden text-stone-500">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-serif text-charcoal">Insights</h1>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400"></div>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-stone-50 rounded-2xl mx-4">
                    <p className="text-stone-500 mb-2">No articles published yet.</p>
                    <p className="text-xs text-stone-400">Check back soon for insights.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                    {posts.map((post) => (
                        <button
                            key={post.id}
                            onClick={() => setSelectedPost(post)}
                            className="group flex flex-col items-start text-left bg-white p-6 rounded-2xl border border-stone-warm shadow-sm hover:shadow-md transition-all hover:-translate-y-1 h-full"
                        >
                            <div className="flex items-center justify-between w-full mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-saffron-deep">
                                    {post.category || 'Mindfulness'}
                                </span>
                                <span className="text-[10px] text-stone-400">
                                    {new Date(post.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 className="text-xl font-serif text-charcoal mb-3 group-hover:text-saffron-deep/90 transition-colors">
                                {post.title}
                            </h3>

                            <p className="text-sm text-stone-500 leading-relaxed mb-6 line-clamp-3">
                                {post.excerpt || post.content.substring(0, 150) + '...'}
                            </p>

                            <div className="mt-auto flex items-center text-xs font-semibold text-charcoal group-hover:underline decoration-saffron-deep/50 underline-offset-4">
                                <span>Read Article</span>
                                <ChevronRight size={14} className="ml-1" />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Blog;
