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

    // like button functionality
    // get all like buttons
    // add event listener to each like button
    // send a POST request to the server to update the like count
    // update the like count on the client side
    // change the like button icon to solid if the user liked the post
    // change the like button icon to regular if the user unliked the post
    // if user liked the post then change the like button icon to solid red
    // if user unliked the post then change the like button icon to regular white
    const likeBtns = document.querySelectorAll(".like");
    likeBtns.forEach((btn) => {
        btn.addEventListener("click", function (e) {
            e.preventDefault();
            const postId = btn.dataset.postId;
            const csrftoken = getCookie("csrftoken");
            fetch(`/like/${postId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrftoken,
                },
            })

                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then((result) => {
                    if (result.success) {
                        const likeCount = document.getElementById("like-count");
                        likeCount.textContent = result.like_count;
                        btn.dataset.liked = result.liked;
                        if (result.liked) {
                            btn.classList.add("liked");
                        } else {
                            btn.classList.remove("liked");
                        }
                    }
                })
                .catch((error) => {
                    console.error("There was a problem with the fetch operation:", error);
                });
        });
    });
});