let counter = 0;
function count() {
    counter++;
    document.querySelector('.js-show').innerHTML = counter;

    if (counter % 10 === 0) {
        alert(`You have clicked ${counter} times!`);
    }
}
document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('button').onclick = count;
});
