const gallery = document.getElementById("gallery");
const blocks = document.querySelectorAll(".block");
const radius = 300;
const maxScale = 2.5;

// Store block center positions and original rotations
const blockData = [];

// Extract rotation from CSS - get the original rotate value from CSS
function getOriginalRotation(element) {
  // Get the computed style to see the actual rotate value
  const computedStyle = window.getComputedStyle(element);
  const rotate = computedStyle.rotate;

  if (rotate && rotate !== "none") {
    return parseFloat(rotate);
  }

  // If no rotate property, try to extract from transform
  const transform = computedStyle.transform;
  if (transform === "none") return 0;

  const matrix = transform.match(/matrix.*\((.+)\)/);
  if (matrix) {
    const values = matrix[1].split(", ");
    const a = parseFloat(values[0]);
    const b = parseFloat(values[1]);
    return Math.round(Math.atan2(b, a) * (180 / Math.PI));
  }

  return 0;
}

// Initialize block data
function initializeBlocks() {
  blocks.forEach((block, index) => {
    const rect = block.getBoundingClientRect();
    const galleryRect = gallery.getBoundingClientRect();

    // Get original rotation from CSS - we need to extract this from the CSS rule
    // Since the rotate is applied via CSS, we need to parse it differently
    let originalRotation = 0;

    // Try to get from CSS rules (for the rotate values set in CSS)
    const cssRules = document.styleSheets;
    for (let sheet of cssRules) {
      try {
        for (let rule of sheet.cssRules) {
          if (
            rule.selectorText &&
            rule.selectorText.includes(`nth-child(${index + 1})`)
          ) {
            const rotateMatch = rule.style.rotate.match(/-?\d+/);
            if (rotateMatch) {
              originalRotation = parseInt(rotateMatch[0]);
              break;
            }
          }
        }
      } catch (e) {
        // Handle CORS or other stylesheet access issues
      }
    }

    // Fallback: hardcode the rotations from your CSS
    const rotations = [
      9, -8, 11, -12, 7, -9, 12, -7, 8, -11, 10, -9, 7, -12, 11, -10, 9, -8, 12,
      -7, 8, -9, 11, -12, 7, -10, 9,
    ];

    if (originalRotation === 0 && index < rotations.length) {
      originalRotation = rotations[index];
    }

    blockData[index] = {
      element: block,
      // Store relative positions within gallery
      centerX: rect.left + rect.width / 2 - galleryRect.left,
      centerY: rect.top + rect.height / 2 - galleryRect.top,
      originalRotation: originalRotation,
    };
  });
}

// Calculate distance-based scale
function calculateScale(distance) {
  if (distance > radius) return 1;
  const proximity = Math.max(0, (radius - distance) / radius);
  return 1 + (maxScale - 1) * proximity;
}

// Calculate distance-based rotation (same logic as scale)
function calculateRotation(distance, originalRotation) {
  if (distance > radius) return originalRotation; // Outside radius = original rotation
  const proximity = Math.max(0, (radius - distance) / radius); // 0 to 1
  // When proximity = 1 (very close), rotation = 0
  // When proximity = 0 (far), rotation = originalRotation
  return originalRotation * (1 - proximity);
}

// Mouse move handler
function handleMouseMove(e) {
  const mouseX = e.clientX;
  const mouseY = e.clientY;

  // Gallery panning
  const xDecimal = mouseX / window.innerWidth;
  const yDecimal = mouseY / window.innerHeight;

  const maxX = gallery.offsetWidth - window.innerWidth;
  const maxY = gallery.offsetHeight - window.innerHeight;

  const panX = maxX * xDecimal * -1;
  const panY = maxY * yDecimal * -1;
  

  gallery.animate(
    {
      transform: `translate(${panX}px, ${panY}px)`,
    },
    {
      duration: 4000,
      fill: "forwards",
      easing: "ease-out",
    }
  );

  // Block scaling and rotation based on mouse proximity
  const galleryRect = gallery.getBoundingClientRect();
  const relativeMouseX = mouseX - galleryRect.left;
  const relativeMouseY = mouseY - galleryRect.top;

  blockData.forEach((data) => {
    const dx = data.centerX - relativeMouseX;
    const dy = data.centerY - relativeMouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const scale = calculateScale(distance);
    const rotation = calculateRotation(distance, data.originalRotation);

    // Use GSAP for smooth scaling and rotation
    gsap.to(data.element, {
      scale: scale,
      rotation: rotation,
      duration: 0.3,
      ease: "power2.out",
    });
  });
}

// Initialize on load
window.addEventListener("load", () => {
  initializeBlocks();
  window.addEventListener("mousemove", handleMouseMove);
});

// Reinitialize on resize
window.addEventListener("resize", initializeBlocks);
