(function () {
  const tips = [
    { icon: '✨', text: '<strong>Small wins add up.</strong> Check off one task before your next class — momentum beats motivation.' },
    { icon: '🧠', text: '<strong>Spaced repetition works.</strong> Review flashcards for 10 minutes today and you\'ll remember more tomorrow.' },
    { icon: '📅', text: '<strong>Plan your week.</strong> Block study time on your calendar like you would a meeting.' },
    { icon: '🎯', text: '<strong>Focus in bursts.</strong> Use the Pomodoro timer — 25 minutes of deep work, then a real break.' },
    { icon: '📝', text: '<strong>Write it down.</strong> Notes taken by hand (or typed quickly) stick better than passive reading.' },
    { icon: '🌙', text: '<strong>Rest is productive.</strong> Sleep consolidates memory — your brain studies while you sleep.' },
  ];

  const el = document.getElementById('sf-insight-text');
  if (!el) return;

  const hour = new Date().getHours();
  let index = hour % tips.length;

  function showTip() {
    const tip = tips[index];
    el.innerHTML = '<span class="sf-insight-icon" aria-hidden="true">' + tip.icon + '</span><span>' + tip.text + '</span>';
    index = (index + 1) % tips.length;
  }

  showTip();
  setInterval(showTip, 12000);

  const heading = document.getElementById('sf-hero-heading');
  if (heading) {
    let msg = 'Good evening';
    if (hour < 12) msg = 'Good morning';
    else if (hour < 17) msg = 'Good afternoon';
    heading.textContent = msg + ', ' + heading.dataset.username;
  }
})();
