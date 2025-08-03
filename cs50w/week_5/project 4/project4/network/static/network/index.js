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
});