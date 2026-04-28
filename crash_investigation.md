# Investigation: Why Book.jsx is Crashing (Error Code: 9)

After investigating the codebase and assets, I've identified the root cause of the "Aw, Snap!" crash (Error Code: 9) when navigating to the `/book` page.

### Root Cause: Asset Resource Exhaustion
The `CityCarousel.jsx` component, which is rendered at the bottom of the `Book.jsx` page, is trying to load a massive image file:

- **File**: `src/assets/Peshawar.jpg`
- **Size on disk**: **22.5 Megabytes**
- **Resolution**: **9580 x 3543 pixels**

When Chrome tries to decode a JPEG of this resolution (over 34 million pixels), it consumes a significant amount of RAM. On many systems (especially in a development environment or on Linux), this memory spike triggers the browser's safety mechanisms, leading to a `RESULT_CODE_KILLED_BAD_MESSAGE` (Error code 9) and crashing the tab.

### Other Assets Checklist
- `Karachi.jpg`: 105 KB (Optimal)
- `Islamabad.jpg`: 83 KB (Optimal)
- `Lahore.jpg`: 1.5 MB (Slightly large, but manageable)
- `Peshawar.jpg`: **22.5 MB (CRITICAL)**

### Recommended Fixes

1. **Resize the Image**: Downscale `Peshawar.jpg` to a more reasonable resolution (e.g., 800x600 or 1200x800). A 22MB image is overkill for a small card in a carousel.
2. **Temporary Fix (for testing)**: Use a different image or a placeholder URL to verify that the crash stops.
3. **Lazy Loading**: While not a direct fix for the crash on load, using `loading="lazy"` for carousel images is a good practice.

---

### Step-by-Step Resolution

1. **Option A: Replace with Karachi Image (Testing)**
   You can temporarily point `Peshawar` to use the `Karachi` image to confirm the crash is resolved.
   
2. **Option B: Use a Placeholder**
   Use an online placeholder service to test.

I will now apply a temporary fix to `CityCarousel.jsx` to use a smaller image source for Peshawar so you can at least use the page while you resize the actual asset.
