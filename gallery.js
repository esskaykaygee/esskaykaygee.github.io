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

    const deleteBtn =
      post.name === username
        ? `<button class="delete-btn" data-id="${post.id}">🗑️</button>`
        : "";

    card.innerHTML = `
  <p class="posted-by">Posted by <strong>${post.name}</strong></p>
  <a href="photo.html?id=${post.id}">
    <img src="${post.image_url}" />
  </a>
  <p class="caption">${post.caption}</p>
  ${deleteBtn}
`;

    gallery.appendChild(card);
  });
}

loadPosts();

gallery.addEventListener("click", async (e) => {
  const postId = e.target.dataset.id;
  if (!postId) return;

  currentPostId = postId;
  openCommentsModal(postId);
});

gallery.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-btn")) return;

  const postId = e.target.dataset.id;
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) return console.error(error);
  loadPosts();
});

async function openCommentsModal(postId) {
  commentModal.style.display = "block";
  commentModal.innerHTML = `
    <div class="modal-content">
      <span id="closeModal" class="close">&times;</span>
      <h3>Comments</h3>
      <div id="commentsList"></div>
      <input type="text" id="commentInput" placeholder="Add a comment..." />
      <button id="addCommentBtn">Post Comment</button>
    </div>
  `;

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
}
