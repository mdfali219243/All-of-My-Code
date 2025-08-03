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
    const toggleFollowBtn = document.getElementById("toggle-follow-btn");

    if (toggleFollowBtn) {
        toggleFollowBtn.addEventListener("click", function (e) {
            e.preventDefault();

            const username = toggleFollowBtn.dataset.username;
            const isFollowing = toggleFollowBtn.dataset.following === "true";

            // Determine the URL and new state based on the current state
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

                        // Update the data-following attribute
                        toggleFollowBtn.dataset.following = newFollowingState;

                        // Optional: Change the button's class for styling
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
                    console.error('There was a problem with the fetch operation:', error);
                });
        });
    }

    const likeBtn = document.getElementById("like-btn");
    likeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        console.log("Like button clicked");
        const post_count = document.getElementById("post-count");
        const like_count = document.getElementById("like-count");
        const postId = likeBtn.dataset.postId;
        const isLiked = likeBtn.dataset.liked;
        const likeIcon = likeBtn.querySelector('i');
        const csrftoken = getCookie('csrftoken');
        if (isLiked === "true") {
            likeIcon.classList.remove('fa-solid');
            likeIcon.classList.add('fa-regular');
            like_count.textContent = parseInt(like_count.textContent) - 1;
        } else {
            likeIcon.classList.remove('fa-regular');
            likeIcon.classList.add('fa-solid');
            like_count.textContent = parseInt(like_count.textContent) + 1;
        }
        likeBtn.dataset.liked = !isLiked;
    });
});