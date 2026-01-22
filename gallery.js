import { supabase } from "./supabase.js";

const username = localStorage.getItem("username");
if (!username) window.location.href = "/login.html";

const gallery = document.getElementById("gallery");
const commentModal = document.getElementById("commentModal");

let currentPostId = null;

export async function loadPosts() {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return console.error(error);

  gallery.innerHTML = "";
  posts.forEach((post) => {
    const card = document.createElement("div");
    card.className = "card";

    // Remove delete button completely
    card.innerHTML = `
      <p class="posted-by">posted by <strong>${post.name}</strong></p>
      <a href="photo.html?id=${post.id}">
        <img src="${post.image_url}" />
      </a>
      <p class="caption">${post.caption}</p>
    `;

    gallery.appendChild(card);
  });
}

loadPosts();

supabase
  .channel("posts-realtime")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "posts",
    },
    (payload) => {
      console.log("New post:", payload.new);
      loadPosts(); 
    }
  )
  .subscribe();


gallery.addEventListener("click", async (e) => {
  if (e.target.tagName === "IMG") {
    const postId = e.target.closest(".card").dataset.id || e.target.closest(".card").querySelector("a").href.split("id=")[1];
    currentPostId = postId;
    openCommentsModal(postId);
  }
});

// Comment modal functionality stays the same
async function openCommentsModal(postId) {
  commentModal.style.display = "block";

  const closeModal = document.getElementById("closeModal");
  const commentInput = document.getElementById("commentInput");
  const addCommentBtn = document.getElementById("addCommentBtn");
  const commentsList = document.getElementById("commentsList");

  closeModal.addEventListener("click", () => {
    commentModal.style.display = "none";
  });

  const { data: comments, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) return console.error(error);

  commentsList.innerHTML = comments
    .map((c) => `<p><strong>${c.username}</strong>: ${c.text}</p>`)
    .join("");

  addCommentBtn.addEventListener("click", async () => {
    const text = commentInput.value.trim();
    if (!text) return;

    const { error } = await supabase.from("comments").insert([
      {
        post_id: postId,
        username,
        text,
      },
    ]);

    if (error) return console.error(error);

    commentsList.innerHTML += `<p><strong>${username}</strong>: ${text}</p>`;
    commentInput.value = "";
  });

  supabase
  .channel(`comments-${postId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "comments",
      filter: `post_id=eq.${postId}`,
    },
    (payload) => {
      const c = payload.new;
      commentsList.innerHTML += `<p><strong>${c.username}</strong>: ${c.text}</p>`;
    }
  )
  .subscribe();
}
