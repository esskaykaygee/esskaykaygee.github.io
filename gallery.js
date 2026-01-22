import { supabase } from "./supabase.js";

// --- Login check ---
const username = localStorage.getItem('username');
if (!username) window.location.href = '/login.html';

// --- DOM references ---
const gallery = document.getElementById("gallery");
const commentModal = document.getElementById("commentModal");

// --- Keep track of current post for comments ---
let currentPostId = null;

// --- Load all posts ---
export async function loadPosts() {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return console.error(error);

  gallery.innerHTML = '';
  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "card";

    const deleteBtn = post.username === username
      ? `<button class="delete-btn" data-id="${post.id}">🗑️</button>`
      : '';

    card.innerHTML = `
      <img src="${post.image_url}" data-id="${post.id}" />
      <p><strong>${post.username}</strong>: ${post.caption}</p>
      ${deleteBtn}
    `;

    gallery.appendChild(card);
  });
}

loadPosts();

// --- Click gallery to open comments ---
gallery.addEventListener("click", async (e) => {
  const postId = e.target.dataset.id;
  if (!postId) return;

  currentPostId = postId;
  openCommentsModal(postId);
});

// --- Add/Delete functionality ---
gallery.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-btn")) return;

  const postId = e.target.dataset.id;
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) return console.error(error);
  loadPosts();
});

// --- Comments modal logic ---
async function openCommentsModal(postId) {
  commentModal.style.display = 'block';
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

  // Load comments
  const { data: comments, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) return console.error(error);

  commentsList.innerHTML = comments.map(c =>
    `<p><strong>${c.username}</strong>: ${c.text}</p>`).join('');

  // Add comment
  addCommentBtn.addEventListener("click", async () => {
    const text = commentInput.value.trim();
    if (!text) return;

    const { error } = await supabase.from("comments").insert([{
      post_id: postId,
      username,
      text
    }]);

    if (error) return console.error(error);

    commentsList.innerHTML += `<p><strong>${username}</strong>: ${text}</p>`;
    commentInput.value = '';
  });
}
