// Improved marquee.js - include this file and load it just before </body>
(function () {
  function setupMarquee(marqueeEl) {
    const track = marqueeEl.querySelector('.marquee-track');
    if (!track) return;

    let groups = track.querySelectorAll('.marquee-group');

    // If only one group exists, clone it to make seamless loop
    if (groups.length === 1) {
      const clone = groups[0].cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
      groups = track.querySelectorAll('.marquee-group');
    }

    // Ensure layout is settled before measuring
    requestAnimationFrame(() => {
      const firstGroup = track.querySelector('.marquee-group');
      if (!firstGroup) return;

      const groupRect = firstGroup.getBoundingClientRect();
      const groupWidth = Math.ceil(groupRect.width);

      // marquee container visible width
      const viewportWidth = Math.ceil(marqueeEl.getBoundingClientRect().width);

      // direction: "left" means content moves leftwards (enters from right)
      const direction = (marqueeEl.dataset.direction || 'left').toLowerCase();

      // speed in pixels per second (data-speed attribute). Default 95 px/s
      const speedAttr = Number(marqueeEl.dataset.speed) || 95;
      // duration = distance (groupWidth) / speed
      const durationSeconds = Math.max(5, groupWidth / speedAttr);

      // For a continuous loop with duplicated groups we need the animation to move by exactly one group's width.
      // For leftward movement: translate from 0 -> -groupWidth px
      // For rightward movement: translate from 0 -> +groupWidth px (rarely used)
      const translateValue = (direction === 'right') ? `${groupWidth}px` : `-${groupWidth}px`;

      // Set CSS variables for the animation
      track.style.setProperty('--marquee-duration', durationSeconds + 's');
      track.style.setProperty('--marquee-translate', translateValue);
      // Also set the CSS animation-duration explicitly
      track.style.animationDuration = durationSeconds + 's';

      // Accessibility: if track is narrower than the visible area, reduce motion (no need to animate)
      if (groupWidth <= 0 || groupWidth <= viewportWidth / 2) {
        track.style.animationPlayState = 'paused';
      }
    });

    // Pause animation when not visible to save CPU
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          track.style.animationPlayState = 'paused';
        } else {
          // avoid overriding a user hover-pause
          if (!marqueeEl.matches(':hover')) track.style.animationPlayState = '';
        }
      });
    }, { threshold: 0.05 });
    io.observe(marqueeEl);

    // Also pause when page is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) track.style.animationPlayState = 'paused';
      else if (!marqueeEl.matches(':hover')) track.style.animationPlayState = '';
    });

    // Pause on mouseenter (hover), resume on mouseleave
    marqueeEl.addEventListener('mouseenter', () => {
      track.style.animationPlayState = 'paused';
    });
    marqueeEl.addEventListener('mouseleave', () => {
      track.style.animationPlayState = '';
    });

    // Recompute on resize (with small debounce)
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // reset animation to recalc widths
        track.style.animationPlayState = 'paused';
        // force reflow then rerun setup for this marquee
        setTimeout(() => {
          track.style.animation = 'none';
          // remove the inline animation-duration / translate; we'll re-run setup
          track.style.removeProperty('--marquee-translate');
          track.style.removeProperty('--marquee-duration');
          track.style.removeProperty('animation-duration');
          // call setup again only for this marquee
          setupMarquee(marqueeEl);
        }, 20);
      }, 120);
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.marquee').forEach(setupMarquee);
  });
})();