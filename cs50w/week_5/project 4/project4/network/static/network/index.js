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

    // Like button functionality
    const likeBtns = document.querySelectorAll('.like');
    console.log('Found like buttons:', likeBtns.length);
    console.log('First like button data:', likeBtns[0]?.dataset.postId);

    likeBtns.forEach((btn) => {
        btn.addEventListener('click', async function (e) {
            e.preventDefault();
            console.log('Like button clicked for post:', this.dataset.postId);

            if (this.classList.contains('loading')) return;

            const postId = this.dataset.postId;
            const icon = this.querySelector('i');
            const likeCount = this.querySelector('span.like-count');
            const csrftoken = getCookie('csrftoken');

            console.log('Like button data:', {
                postId,
                icon: icon ? 'found' : 'not found',
                likeCount: likeCount ? 'found' : 'not found',
                csrftoken: csrftoken ? 'found' : 'not found'
            });

            if (!csrftoken) {
                console.error('CSRF token not found');
                return;
            }

            this.classList.add('loading');

            try {
                const response = await fetch(`/like/${postId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                    },
                    body: JSON.stringify({})
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log('Server response:', result);

                if (result.success) {
                    if (likeCount) {
                        likeCount.textContent = result.like_count;
                        console.log('Updated like count to:', result.like_count);
                    } else {
                        console.error('Like count element not found');
                    }

                    if (result.liked) {
                        this.classList.add('liked');
                        icon.classList.replace('fa-regular', 'fa-solid');
                        console.log('Set liked state');
                    } else {
                        this.classList.remove('liked');
                        icon.classList.replace('fa-solid', 'fa-regular');
                        console.log('Set unliked state');
                    }
                }
            } catch (error) {
                console.error('Like error:', error);
            } finally {
                this.classList.remove('loading');
            }
        });
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

    // Comment functionality
    function setupCommentFunctionality() {
        // Toggle comment section visibility
        document.querySelectorAll('.comment').forEach(button => {
            button.addEventListener('click', async function (e) {
                e.preventDefault();
                const postId = this.dataset.postId;
                const commentSection = document.getElementById(`comment-section-${postId}`);

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
        document.querySelectorAll('.cancel-comment').forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                const formContainer = e.target.closest('.comment-form-container');
                const textarea = formContainer.querySelector('.comment-text');
                textarea.value = '';
                formContainer.style.display = 'none';
            });
        });
    }

    // Initialize comment functionality
    setupCommentFunctionality();
});