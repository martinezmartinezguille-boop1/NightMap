export interface BoardPost {
  id: string;
  clubId: string;
  nombre: string;
  message: string;
  postedAt: number;
}

const KEY = "nightmap-board-posts";

export function readBoardPosts(): BoardPost[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPost);
  } catch {
    return [];
  }
}

export function addBoardPost(post: Omit<BoardPost, "id" | "postedAt">): BoardPost {
  const next: BoardPost = {
    ...post,
    id: `${post.clubId}-${Date.now()}`,
    postedAt: Date.now(),
  };
  const posts = [next, ...readBoardPosts()].slice(0, 40);
  localStorage.setItem(KEY, JSON.stringify(posts));
  window.dispatchEvent(new Event("nightmap-board"));
  return next;
}

function isPost(row: unknown): row is BoardPost {
  if (!row || typeof row !== "object") return false;
  const post = row as Partial<BoardPost>;
  return (
    typeof post.id === "string" &&
    typeof post.clubId === "string" &&
    typeof post.nombre === "string" &&
    typeof post.message === "string" &&
    typeof post.postedAt === "number"
  );
}
