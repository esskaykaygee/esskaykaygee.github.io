import { supabase } from "./supabase.js";

const username = localStorage.getItem('username');
if (!username) window.location.href = '/login.html';

const main = document.getElementById('photoDetail');

// Get post ID from URL
const params = new URLSearchParams(window.location.search);
const postId = params.get('id');

if (!postId) {
  main.innerHTML = "<p>No photo selected.</p>";
}

// Load post and comments
async function loadPost() {
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (postError) return console.error(postError);

  // Only show trash icon if current user is the poster
  const deleteBtn = post.name === username
    ? `<button id="deletePost" class="trash-btn">🗑️ Delete Photo</button>`
    : '';

  main.innerHTML = `
    <p class="posted-by">Posted by <strong>${post.name}</strong></p>
    <img src="${post.image_url}" />
    <p class="caption">${post.caption}</p>
    ${deleteBtn}
    <h3>Comments</h3>
    <div id="commentsList"></div>
    <input type="text" id="commentInput" placeholder="Add a comment..." />
    <button id="addCommentBtn">Post Comment</button>
  `;

  loadComments();
}

// Load comments
async function loadComments() {
  const commentsList = document.getElementById("commentsList");
  const { data: comments, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) return console.error(error);

  commentsList.innerHTML = comments.map(c =>
    `<p><strong>${c.username}</strong>: ${c.text}</p>`
  ).join('');
}

// Handle clicks for comments and delete
document.addEventListener("click", async (e) => {
  // Add comment
  if (e.target.id === "addCommentBtn") {
    const input = document.getElementById("commentInput");
    const text = input.value.trim();
    if (!text) return;

    const { error } = await supabase.from("comments").insert([{
      post_id: postId,
      username,
      text
    }]);
    if (error) return console.error(error);

    input.value = '';
    loadComments();
  }

if (e.target.id === "deletePost") {
  const confirmDelete = confirm("Are you sure you want to delete this post?");
  if (!confirmDelete) return;

  const { error: commentError } = await supabase
    .from("comments")
    .delete()
    .eq("post_id", postId);

  if (commentError) {
    console.error("Error deleting comments:", commentError);
    return;
  }

  const { error: postError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (postError) {
    console.error("Error deleting post:", postError);
    return;
  }

  window.location.href = "index.html";
}
});

loadPost();
