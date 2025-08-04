// A helper function to get the CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Function to load comments for a post
async function loadComments(postId) {
    try {
        const response = await fetch(`/api/comments/${postId}`);
        if (!response.ok) {
            throw new Error('Failed to load comments');
        }
        const comments = await response.json();
        const commentsContainer = document.getElementById(`comments-${postId}`);
        if (!commentsContainer) {
            console.error('Comments container not found for post:', postId);
            return;
        }
        commentsContainer.innerHTML = '';

        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment mb-2 p-2 border rounded';
            commentElement.innerHTML = `
                <div class="d-flex justify-content-between">
                    <strong>${comment.user}</strong>
                    <small class="text-muted">${new Date(comment.timestamp).toLocaleString()}</small>
                </div>
                <div class="comment-content">${comment.content}</div>
            `;
            commentsContainer.appendChild(commentElement);
        });
    } catch (error) {
        console.error('Error loading comments:', error);
        alert('Failed to load comments. Please try again.');
    }
}

// Function to format date to a readable format
function formatDate(dateString) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to handle like button clicks
function handleLike(e) {
    const button = e.currentTarget;
    const postId = button.dataset.postId;
    const likeCount = button.querySelector('.like-count');
    const isLiked = button.classList.contains('liked');

    fetch(`/like/${postId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                likeCount.textContent = data.like_count;
                button.classList.toggle('liked', !isLiked);
                const icon = button.querySelector('i');
                if (isLiked) {
                    icon.classList.remove('fa-solid');
                    icon.classList.add('fa-regular');
                } else {
                    icon.classList.remove('fa-regular');
                    icon.classList.add('fa-solid');
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Function to handle comment toggle
function handleCommentToggle(e) {
    const button = e.target.closest('.comment');
    if (!button) return;

    const postId = button.dataset.postId;
    if (!postId) return;

    const commentSection = document.getElementById(`comment-section-${postId}`);
    if (commentSection) {
        commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
    }
}

// Function to handle edit post
function handleEdit(e) {
    const button = e.currentTarget;
    const postId = button.dataset.postId;
    const postContent = document.getElementById(`post-content-${postId}`);
    const originalContent = button.dataset.content;

    if (postContent.isContentEditable) {
        // Save changes
        const newContent = postContent.textContent;

        fetch(`/edit/${postId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ content: newContent })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    postContent.contentEditable = false;
                    button.dataset.content = newContent;
                    button.innerHTML = '<i class="fa-regular fa-pen-to-square"></i>';
                }
            });
    } else {
        // Enable editing
        postContent.contentEditable = true;
        postContent.focus();
        button.innerHTML = '<i class="fa-solid fa-check"></i>';
    }
}

// Function to handle comment submission
function handleCommentSubmit(e) {
    const button = e.currentTarget;
    const form = button.closest('.comment-form-container');
    const postId = form.dataset.postId;
    const textarea = form.querySelector('textarea');
    const comment = textarea.value.trim();

    if (!comment) return;

    fetch(`/comment/${postId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ content: comment })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Add the new comment to the comments list
                const commentsContainer = document.getElementById(`comments-${postId}`);
                if (commentsContainer) {
                    const commentElement = document.createElement('div');
                    commentElement.className = 'comment mb-2 p-2 border rounded';
                    commentElement.innerHTML = `
                    <div class="d-flex justify-content-between">
                        <strong>${data.comment.user}</strong>
                        <small class="text-muted">Just now</small>
                    </div>
                    <div class="comment-content">${data.comment.content}</div>
                `;
                    commentsContainer.prepend(commentElement);

                    // Update comment count
                    const commentCount = document.querySelector(`#comment-count-${postId}`);
                    if (commentCount) {
                        commentCount.textContent = parseInt(commentCount.textContent || '0') + 1;
                    }

                    // Clear the textarea
                    textarea.value = '';
                }
            }
        });
}

// Function to handle comment cancel
function handleCommentCancel(e) {
    const button = e.target.closest('.cancel-comment');
    if (!button) return;

    const form = button.closest('.comment-form-container');
    if (!form) return;

    const textarea = form.querySelector('textarea');
    if (textarea) {
        textarea.value = '';
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // Follow button functionality
    const toggleFollowBtn = document.getElementById("toggle-follow-btn");

    if (toggleFollowBtn) {
        toggleFollowBtn.addEventListener("click", function (e) {
            e.preventDefault();
            console.log('Follow button clicked');

            const username = toggleFollowBtn.dataset.username;
            const isFollowing = toggleFollowBtn.dataset.following === "true";
            const actionUrl = isFollowing ? `/unfollow/${username}` : `/follow/${username}`;

            // Fetch the follow/unfollow action
            fetch(actionUrl, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie('csrftoken')
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(result => {
                    if (result.success) {
                        const newFollowingState = !isFollowing;
                        toggleFollowBtn.innerHTML = newFollowingState ? "Unfollow" : "Follow";
                        toggleFollowBtn.dataset.following = newFollowingState;

                        if (newFollowingState) {
                            toggleFollowBtn.classList.remove("btn-primary");
                            toggleFollowBtn.classList.add("btn-secondary");
                        } else {
                            toggleFollowBtn.classList.remove("btn-secondary");
                            toggleFollowBtn.classList.add("btn-primary");
                        }
                    }
                })
                .catch(error => {
                    console.error('Follow error:', error);
                });
        });
    }

    // Post form submission
    const postForm = document.getElementById('post-form');
    if (postForm) {
        postForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const contentInput = this.querySelector('input[name="content"]');
            const content = contentInput.value.trim();

            if (!content) return;

            fetch('/All_posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ content: content })
            })
                .then(response => response.json())
                .then(post => {
                    // Create new post element
                    const postsContainer = document.querySelector('.posts-container');
                    const postElement = document.createElement('div');
                    postElement.className = 'post';
                    postElement.id = `post-${post.id}`;
                    postElement.innerHTML = `
                    <a href="/profile/${post.user.username}">
                        <p><strong>${post.user.username}</strong></p>
                    </a>
                    <p class="text-muted" style="font-size:0.9em;">Just now</p>
                    <p id="post-content-${post.id}">${post.content}</p>
                    <div class="post-actions">
                        <button class="post-action-btn like" data-post-id="${post.id}">
                            <i class="fa-regular fa-heart"></i>
                            <span class="like-count">0</span>
                        </button>
                        <button class="post-action-btn comment" title="Comment" data-post-id="${post.id}">
                            <i class="fa-regular fa-comment"></i>
                            <span class="comment-count">0</span>
                        </button>
                        <button class="post-action-btn edit" title="Edit" data-post-id="${post.id}"
                            data-content="${post.content}" data-user-id="${post.user.id}">
                            <i class="fa-regular fa-pen-to-square"></i>
                        </button>
                    </div>
                    <div class="comment-section" id="comment-section-${post.id}" style="display: none;">
                        <div class="comments-container mb-3" id="comments-${post.id}"></div>
                        <div class="comment-form-container mb-3" data-post-id="${post.id}">
                            <textarea class="form-control comment-text mb-2" placeholder="Write a comment..."></textarea>
                            <div class="d-flex justify-content-end gap-2">
                                <button class="btn btn-sm btn-secondary cancel-comment">Cancel</button>
                                <button class="btn btn-sm btn-primary submit-comment">Comment</button>
                            </div>
                        </div>
                    </div>
                `;

                    // Insert the new post at the top of the posts container
                    if (postsContainer.firstChild) {
                        postsContainer.insertBefore(postElement, postsContainer.firstChild);
                    } else {
                        postsContainer.appendChild(postElement);
                    }

                    // Clear the input field
                    contentInput.value = '';

                    // Re-initialize event listeners for the new post
                    setupEventListenersForPost(postElement);
                })
                .catch(error => {
                    console.error('Error creating post:', error);
                    alert('Failed to create post. Please try again.');
                });
        });
    }

    // Function to set up event listeners for a post
    function setupEventListenersForPost(postElement) {
        // Like button
        const likeBtn = postElement.querySelector('.like');
        if (likeBtn) {
            likeBtn.addEventListener('click', handleLike);
        }

        // Comment button
        const commentBtn = postElement.querySelector('.comment');
        if (commentBtn) {
            commentBtn.addEventListener('click', handleCommentToggle);
        }

        // Edit button
        const editBtn = postElement.querySelector('.edit');
        if (editBtn) {
            editBtn.addEventListener('click', handleEdit);
        }

        // Comment submission
        const commentForm = postElement.querySelector('.comment-form-container');
        if (commentForm) {
            const submitBtn = commentForm.querySelector('.submit-comment');
            const cancelBtn = commentForm.querySelector('.cancel-comment');
            const textarea = commentForm.querySelector('.comment-text');

            if (submitBtn) {
                submitBtn.addEventListener('click', handleCommentSubmit);
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', handleCommentCancel);
            }
        }
    }

    // Initialize event listeners for all existing posts
    document.querySelectorAll('.post').forEach(postElement => {
        setupEventListenersForPost(postElement);
    });

    // Initialize comment functionality after DOM is loaded
    setupCommentFunctionality();

    // Set up event delegation for dynamically loaded content
    document.addEventListener('click', function (e) {
        // Handle like button clicks
        if (e.target.closest('.like')) {
            handleLike(e);
        }
        // Handle comment button clicks
        else if (e.target.closest('.comment')) {
            handleCommentToggle(e);
        }
        // Handle edit button clicks
        else if (e.target.closest('.edit')) {
            handleEdit(e);
        }
        // Handle comment submission
        else if (e.target.closest('.submit-comment')) {
            e.preventDefault();
            const form = e.target.closest('form');
            if (!form) return;
            
            const button = e.target.closest('button');
            const commentContainer = form.closest('.comment-form-container');
            if (!commentContainer) return;
            
            const postId = commentContainer.dataset.postId;
            const textarea = form.querySelector('textarea');
            const comment = textarea.value.trim();

            if (!comment) return;

            fetch(`/comment/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    'content': comment
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Clear the textarea
                    textarea.value = '';
                    // Reload comments
                    const commentSection = document.getElementById(`comment-section-${postId}`);
                    if (commentSection) {
                        loadComments(postId);
                    }
                }
            })
            .catch(error => {
                console.error('Error submitting comment:', error);
            });
        }
        // Handle comment cancel
        else if (e.target.closest('.cancel-comment')) {
            handleCommentCancel(e);
        }
    });

    // Like button functionality is handled via event delegation above
    if (e.target.closest('.like')) {
        const likeButton = e.target.closest('.like');
        const postId = likeButton.dataset.postId;
        const csrftoken = getCookie('csrftoken');
        
        if (!csrftoken) {
            console.error('CSRF token not found');
            return;
        }
        
        if (!postId) {
            console.error('Post ID not found on like button');
            return;
        }
        
        likeButton.classList.add('loading');
        
            // Convert to promise-based approach instead of async/await
            fetch(`/like/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({})
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                console.log('Server response:', result);
                const likeCount = likeButton.querySelector('.like-count');
                const icon = likeButton.querySelector('i');

                if (result.success) {
                    if (likeCount) {
                        likeCount.textContent = result.like_count;
                        console.log('Updated like count to:', result.like_count);
                    } else {
                        console.error('Like count element not found');
                    }

                    if (result.liked) {
                        likeButton.classList.add('liked');
                        if (icon) {
                            icon.classList.replace('fa-regular', 'fa-solid');
                        }
                        console.log('Set liked state');
                    } else {
                        likeButton.classList.remove('liked');
                        if (icon) {
                            icon.classList.replace('fa-solid', 'fa-regular');
                        }
                        console.log('Set unliked state');
                    }
                }
            })
            .catch(error => {
                console.error('Like error:', error);
            })
            .finally(() => {
                likeButton.classList.remove('loading');
            });
        }
    });

// Edit button functionality
// user can edit their own posts
const editBtns = document.querySelectorAll('.edit');
editBtns.forEach((btn) => {
    // Only show edit button if user owns the post
    const userId = btn.dataset.userId;
    const isLoggedInUser = window.currentUserId && userId === String(window.currentUserId);

    if (!isLoggedInUser) {
        btn.style.display = 'none';
        return;
    }

    //when edit button is clicked
    btn.addEventListener('click', async function (e) {
        e.preventDefault();
        console.log('Edit button clicked for post:', this.dataset.postId);

        const postId = this.dataset.postId;
        const originalContent = this.dataset.content;
        const csrftoken = getCookie('csrftoken');
        const postContent = document.querySelector(`#post-content-${postId}`);

        if (!csrftoken) {
            console.error('CSRF token not found');
            return;
        }

        // Store the original content element and its parent
        const originalContentElement = postContent;
        const parentElement = postContent.parentNode;

        // Create edit form
        const editForm = document.createElement('div');
        editForm.className = 'edit-form';
        editForm.innerHTML = `
                <textarea class="edit-textarea" rows="3">${originalContent}</textarea>
                <div class="edit-buttons">
                    <button type="button" class="btn btn-primary save-edit">Save</button>
                    <button type="button" class="btn btn-secondary cancel-edit">Cancel</button>
                </div>
            `;

        // Replace post content with edit form
        parentElement.replaceChild(editForm, originalContentElement);

        // Add save/cancel handlers
        const saveBtn = editForm.querySelector('.save-edit');
        const cancelBtn = editForm.querySelector('.cancel-edit');
        const textarea = editForm.querySelector('.edit-textarea');

        saveBtn.addEventListener('click', async () => {
            const newContent = textarea.value.trim();
            if (newContent === originalContent) {
                console.log('No changes made');
                return;
            }

            try {
                const response = await fetch(`/edit/${postId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                    },
                    body: JSON.stringify({
                        'content': newContent,
                        'user_id': userId,
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log('Server response:', result);

                if (result.success) {
                    // Replace edit form with updated content
                    const updatedContent = document.createElement('p');
                    updatedContent.id = `post-content-${postId}`;
                    updatedContent.textContent = result.content;
                    editForm.parentNode.replaceChild(updatedContent, editForm);
                }
            } catch (error) {
                console.error('Edit error:', error);
            }
        });

        cancelBtn.addEventListener('click', () => {
            // Replace edit form with original content
            parentElement.replaceChild(originalContentElement, editForm);
        });
    });
});

// Comment functionality will be initialized after DOM is loaded
function setupCommentFunctionality() {
    console.log('Setting up comment functionality...');
    // Toggle comment section visibility
    const commentButtons = document.querySelectorAll('.post-action-btn.comment');
    console.log('Found comment toggle buttons:', commentButtons.length);

    commentButtons.forEach((button, index) => {
        console.log(`Setting up comment button ${index + 1}:`, button);
        button.addEventListener('click', async function (e) {
            console.log('Comment button clicked', this);
            e.preventDefault();
            const postId = this.dataset.postId;
            console.log('Post ID from button:', postId);
            const commentSection = document.getElementById(`comment-section-${postId}`);
            console.log('Comment section element:', commentSection);
            console.log('Current display style:', commentSection?.style.display);
            console.log('Data loaded:', commentSection?.dataset.loaded);

            if (!commentSection) {
                console.error('Comment section not found for post:', postId);
                return;
            }

            // Toggle the comment section
            if (commentSection.style.display === 'none' || !commentSection.style.display) {
                commentSection.style.display = 'block';
                // Load comments if not already loaded
                if (!commentSection.dataset.loaded) {
                    await loadComments(postId);
                    commentSection.dataset.loaded = 'true';
                }
            } else {
                commentSection.style.display = 'none';
            }
        });
    });

    // Handle comment submission
    document.querySelectorAll('.submit-comment').forEach(button => {
        button.addEventListener('click', async function (e) {
            e.preventDefault();
            const formContainer = e.target.closest('.comment-form-container');
            const postId = formContainer.dataset.postId;
            if (!postId) {
                console.error('Post ID not found in form container');
                alert('Error: Post ID not found');
                return;
            }

            const textarea = formContainer.querySelector('.comment-text');
            const content = textarea.value.trim();
            const csrftoken = getCookie('csrftoken');

            if (!content) {
                alert('Please enter a comment');
                return;
            }

            try {
                // Create form data
                const formData = new FormData();
                formData.append('content', content);

                const response = await fetch(`/comment/${postId}`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrftoken
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result.success) {
                    // Clear the textarea and hide the form
                    textarea.value = '';
                    formContainer.style.display = 'none';
                    // Instead of reloading, update the UI dynamically
                    const commentsContainer = document.getElementById(`comments-${postId}`);
                    const newComment = document.createElement('div');
                    newComment.className = 'comment mb-2 p-2 border rounded';
                    newComment.innerHTML = `
                            <div class="d-flex justify-content-between">
                                <strong>${result.user}</strong>
                                <small class="text-muted">${new Date(result.timestamp).toLocaleString()}</small>
                            </div>
                            <div class="comment-content">${result.comment}</div>
                        `;
                    commentsContainer.insertBefore(newComment, commentsContainer.firstChild);

                    // Update comment count
                    const commentCountElement = document.getElementById(`comment-count-${postId}`);
                    if (commentCountElement) {
                        const currentCount = parseInt(commentCountElement.textContent) || 0;
                        commentCountElement.textContent = currentCount + 1;
                    }
                }
            } catch (error) {
                console.error('Comment error:', error);
                alert('Error adding comment: ' + error.message);
            }
        });
    });

    // Handle cancel button
    // Comment cancel functionality is handled by handleCommentCancel
}