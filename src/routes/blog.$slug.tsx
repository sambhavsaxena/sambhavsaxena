import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Markdown } from "@/components/markdown";
import { getFingerprint } from "@/lib/fingerprint";
import { toast } from "sonner";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [fp, setFp] = useState<string>("");

  useEffect(() => setFp(getFingerprint()), []);

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // increment view once per mount
  useEffect(() => {
    if (!post) return;
    supabase.rpc("increment_post_view", { _slug: slug }).then(() => {
      qc.invalidateQueries({ queryKey: ["post", slug] });
    });
  }, [post?.id, slug, qc]);

  const { data: liked } = useQuery({
    queryKey: ["liked", slug, fp],
    enabled: !!post && !!fp,
    queryFn: async () => {
      const { data } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", post!.id)
        .eq("fingerprint", fp)
        .maybeSingle();
      return !!data;
    },
  });

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!post) return;
      if (liked) {
        await supabase.from("post_likes").delete().eq("post_id", post.id).eq("fingerprint", fp);
      } else {
        await supabase.from("post_likes").insert({ post_id: post.id, fingerprint: fp });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["liked", slug] });
      qc.invalidateQueries({ queryKey: ["post", slug] });
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", slug],
    enabled: !!post,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", post!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const addComment = useMutation({
    mutationFn: async () => {
      if (!post) return;
      const { error } = await supabase.from("comments").insert({
        post_id: post.id,
        author_name: name.trim() || "Anonymous",
        content: content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      qc.invalidateQueries({ queryKey: ["comments", slug] });
      toast.success("comment posted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 max-w-2xl mx-auto px-6 pt-20 font-mono text-sm text-muted-foreground">
          loading…
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 max-w-2xl mx-auto px-6 pt-20">
          <p className="font-mono text-sm">post not found.</p>
          <button onClick={() => navigate({ to: "/" })} className="mt-4 underline text-sm">
            ← back
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto px-6 w-full pt-16 pb-12">
        <motion.article initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <div className="font-mono text-xs text-muted-foreground mb-4 flex items-center gap-3">
            <time>
              {new Date(post.published_at ?? post.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
            <span>·</span>
            <span>{post.view_count} views</span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl leading-[1.1] tracking-tight mb-6">
            {post.title}
          </h1>

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((t: string) => (
                <span key={t} className="font-mono text-xs text-muted-foreground">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {post.cover_image && (
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full rounded border hairline mb-10"
            />
          )}

          <Markdown>{post.content || ""}</Markdown>
        </motion.article>

        <div className="mt-16 pt-6 border-t hairline flex items-center gap-4">
          <button
            onClick={() => toggleLike.mutate()}
            disabled={toggleLike.isPending}
            className="group flex items-center gap-2 font-mono text-sm hover:text-foreground transition-colors"
          >
            <Heart
              className={`w-4 h-4 transition-all ${
                liked ? "fill-foreground text-foreground" : "text-muted-foreground group-hover:scale-110"
              }`}
            />
            <span className={liked ? "text-foreground" : "text-muted-foreground"}>
              {post.like_count} {post.like_count === 1 ? "like" : "likes"}
            </span>
          </button>
        </div>

        <section className="mt-16">
          <h3 className="font-serif text-2xl mb-6">Comments</h3>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (content.trim()) addComment.mutate();
            }}
            className="border hairline rounded p-4 mb-8 space-y-3"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="your name (optional)"
              maxLength={80}
              className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground border-b hairline pb-2"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="leave a comment…"
              required
              maxLength={2000}
              rows={3}
              className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addComment.isPending || !content.trim()}
                className="font-mono text-xs px-3 py-1.5 border border-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-30"
              >
                post
              </button>
            </div>
          </form>

          <ul className="space-y-6">
            {comments.length === 0 && (
              <li className="font-mono text-xs text-muted-foreground">no comments yet.</li>
            )}
            {comments.map((c) => (
              <li key={c.id} className="border-l hairline pl-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-mono text-xs">{c.author_name}</span>
                  <time className="font-mono text-[10px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleString()}
                  </time>
                </div>
                <p className="text-sm text-foreground/85 whitespace-pre-wrap">{c.content}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
