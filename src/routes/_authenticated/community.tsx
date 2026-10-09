import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { TabBar } from "@/components/app/TabBar";
import { ChatTabContent } from "@/routes/_authenticated/chat";
import { EventsTabContent } from "@/routes/_authenticated/events";
import { LeaderboardTabContent } from "@/routes/_authenticated/leaderboard";
import { supabase, isConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEMO_POSTS } from "@/lib/demoData";

const COMMUNITY_TABS = [
  { id: "feed", label: "Feed" },
  { id: "events", label: "Events" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "chat", label: "Live Chat" },
] as const;

type CommunityTabId = (typeof COMMUNITY_TABS)[number]["id"];

function parseCommunityTab(tab: unknown): CommunityTabId {
  if (tab === "feed" || tab === "events" || tab === "leaderboard" || tab === "chat") return tab;
  return "feed";
}

export const Route = createFileRoute("/_authenticated/community")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: parseCommunityTab(search.tab),
  }),
  head: () => ({
    meta: [
      { title: "Community feed — MotoCompanion" },
      {
        name: "description",
        content: "Share ride reports, photos and road conditions with other MotoCompanion riders.",
      },
      { property: "og:title", content: "MotoCompanion community feed" },
      { property: "og:description", content: "Ride reports, photos and road updates from riders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommunityPage,
});

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

type DemoLike = { post_id: string; user_id: string };
type DemoComment = {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  comment_text: string;
  created_at: string;
};

function CommunityPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<CommunityTabId>(tab);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  const setTab = (id: string) => {
    const next = parseCommunityTab(id);
    setActiveTab(next);
    navigate({
      to: "/community",
      search: next === "feed" ? {} : { tab: next },
      replace: true,
    });
  };

  return (
    <AppShell title="Community" subtitle="Feed, events, leaderboard and live chat for Indian riders.">
      <TabBar tabs={COMMUNITY_TABS} activeTab={activeTab} onChange={setTab} />
      <div className="animate-page-in">
        {activeTab === "feed" ? <CommunityFeedTabContent /> : null}
        {activeTab === "events" ? <EventsTabContent /> : null}
        {activeTab === "leaderboard" ? <LeaderboardTabContent /> : null}
        {activeTab === "chat" ? <ChatTabContent /> : null}
      </div>
    </AppShell>
  );
}

export function CommunityFeedTabContent() {
  const { userId, displayName } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [demoPosts, setDemoPosts] = useState(DEMO_POSTS);
  const [demoLikes, setDemoLikes] = useState<DemoLike[]>([]);
  const [demoComments, setDemoComments] = useState<DemoComment[]>([]);

  const feed = useQuery({
    queryKey: ["feed"],
    enabled: isConfigured,
    queryFn: async () => {
      const [posts, likes, comments] = await Promise.all([
        supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("post_likes").select("post_id, user_id"),
        supabase.from("post_comments").select("*").order("created_at", { ascending: true }),
      ]);
      if (posts.error) throw posts.error;
      return {
        posts: posts.data ?? [],
        likes: likes.data ?? [],
        comments: comments.data ?? [],
      };
    },
  });

  const createPost = useMutation({
    mutationFn: async () => {
      if (!isConfigured) {
        setDemoPosts((prev) => [
          {
            id: `demo-post-${Date.now()}`,
            user_id: userId ?? "mock-user-001",
            user_name: displayName,
            content: content.trim(),
            image_url: imageUrl.trim() || null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        return;
      }
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase.from("posts").insert({
        user_id: userId,
        user_name: displayName,
        content: content.trim(),
        image_url: imageUrl.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      setImageUrl("");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const toggleLike = useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (!isConfigured) {
        const uid = userId ?? "mock-user-001";
        setDemoLikes((prev) =>
          liked ? prev.filter((l) => !(l.post_id === postId && l.user_id === uid)) : [...prev, { post_id: postId, user_id: uid }],
        );
        return;
      }
      if (!userId) throw new Error("Not signed in");
      if (liked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const addComment = useMutation({
    mutationFn: async (postId: string) => {
      if (!isConfigured) {
        setDemoComments((prev) => [
          ...prev,
          {
            id: `demo-comment-${Date.now()}`,
            post_id: postId,
            user_id: userId ?? "mock-user-001",
            user_name: displayName,
            comment_text: commentText.trim(),
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: userId,
        user_name: displayName,
        comment_text: commentText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      if (!isConfigured) {
        setDemoPosts((prev) => prev.filter((p) => p.id !== postId));
        setDemoLikes((prev) => prev.filter((l) => l.post_id !== postId));
        setDemoComments((prev) => prev.filter((c) => c.post_id !== postId));
        return;
      }
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const data = isConfigured
    ? feed.data
    : { posts: demoPosts, likes: demoLikes, comments: demoComments };

  return (
      <div className="max-w-2xl space-y-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (content.trim()) createPost.mutate();
          }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="How was the road today?"
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image link (optional)"
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={createPost.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground disabled:opacity-60"
            >
              {createPost.isPending ? "Posting…" : "Post"}
            </button>
          </div>
        </form>

        {isConfigured && feed.isLoading ? (
          <p className="text-[13px] text-muted-foreground">Loading feed…</p>
        ) : null}
        {data && data.posts.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            No posts yet — be the first to share a ride.
          </p>
        ) : null}

        {data?.posts.map((post) => {
          const postLikes = data.likes.filter((l) => l.post_id === post.id);
          const liked = postLikes.some((l) => l.user_id === userId);
          const postComments = data.comments.filter((c) => c.post_id === post.id);
          return (
            <article key={post.id} className="rounded-xl border border-border bg-card p-4">
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-[13px] font-semibold">
                    {post.user_name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{post.user_name}</p>
                    <p className="text-[12px] text-muted-foreground">{timeAgo(post.created_at)}</p>
                  </div>
                </div>
                {post.user_id === userId ? (
                  <button
                    type="button"
                    aria-label="Delete post"
                    onClick={() => deletePost.mutate(post.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </header>

              <p className="mt-3 whitespace-pre-line text-sm">{post.content}</p>
              {post.image_url ? (
                <img
                  src={post.image_url}
                  alt=""
                  loading="lazy"
                  className="mt-3 w-full rounded-lg border border-border object-cover"
                />
              ) : null}

              <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => toggleLike.mutate({ postId: post.id, liked })}
                  className={`flex items-center gap-1.5 text-[13px] ${liked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                >
                  <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {postLikes.length}
                </button>
                <button
                  type="button"
                  onClick={() => setOpenComments(openComments === post.id ? null : post.id)}
                  className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-primary"
                >
                  <MessageCircle className="h-4 w-4" /> {postComments.length}
                </button>
              </div>

              {openComments === post.id ? (
                <div className="mt-3 space-y-3">
                  {postComments.map((c) => (
                    <div key={c.id} className="rounded-lg bg-secondary px-3 py-2">
                      <p className="text-[12px] font-semibold">{c.user_name ?? "Rider"}</p>
                      <p className="text-[13px]">{c.comment_text}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {timeAgo(c.created_at)}
                      </p>
                    </div>
                  ))}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (commentText.trim()) addComment.mutate(post.id);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
                    />
                    <button
                      type="submit"
                      aria-label="Send comment"
                      className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
  );
}
