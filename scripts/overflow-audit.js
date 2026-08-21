/**
 * Barberhome - horizontal overflow audit.
 *
 * Run in the page console (or through a devtools client) on every route at
 * 375, 768 and 1440 wide. Expected result everywhere: zero offenders.
 *
 * An offender is an element that pokes past the document's edges AND is not
 * clipped by an ancestor. The second half matters: a decorative layer sitting
 * inside an `overflow: hidden` box is visually contained and cannot scroll the
 * document, so counting it would make the audit cry wolf forever and train
 * everyone to ignore it. Fixed-position layers are skipped for the same
 * reason: they are outside the flow and never widen the document.
 */
(() => {
  const CLIPS = new Set(["hidden", "clip", "auto", "scroll"]);
  const docWidth = document.documentElement.clientWidth;

  /** True when some ancestor clips horizontally and the element sits inside it. */
  const isClipped = (el) => {
    let node = el.parentElement;
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node);
      const overflowX = style.overflowX;
      if (CLIPS.has(overflowX)) return true;
      node = node.parentElement;
    }
    return false;
  };

  const offenders = [];
  for (const el of document.querySelectorAll("body *")) {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    if (style.position === "fixed") continue;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;

    const left = rect.left + window.scrollX;
    const right = rect.right + window.scrollX;
    if (right <= docWidth + 1 && left >= -1) continue;
    if (isClipped(el)) continue;

    offenders.push({
      tag: el.tagName.toLowerCase(),
      cls: (typeof el.className === "string" ? el.className : "").slice(0, 70),
      left: Math.round(left),
      right: Math.round(right),
      width: Math.round(rect.width),
    });
  }

  return {
    url: location.pathname,
    viewport: window.innerWidth,
    docWidth,
    scrollWidth: document.documentElement.scrollWidth,
    hasHorizontalScroll: document.documentElement.scrollWidth > docWidth + 1,
    offenderCount: offenders.length,
    offenders: offenders.slice(0, 12),
  };
})();
