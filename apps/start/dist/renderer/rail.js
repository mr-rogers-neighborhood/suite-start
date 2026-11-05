/**
 * The rail, as a tab set.
 *
 * A listbox would describe a selection; these buttons swap the pane beside them,
 * which is what a tab set means. Arrow keys move and select together, Home and
 * End reach the ends, and only the selected tab is in the tab order.
 */
export function installRail(doc = document) {
  const tabs = [...doc.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((tab) => doc.getElementById(tab.getAttribute("aria-controls") ?? ""));

  function select(index, options = {}) {
    tabs.forEach((tab, at) => {
      const selected = at === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panel = panels[at];
      if (panel) panel.hidden = !selected;
    });
    if (options.focus) tabs[index]?.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(index));
    tab.addEventListener("keydown", (event) => {
      const last = tabs.length - 1;
      let next = null;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        next = index === last ? 0 : index + 1;
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        next = index === 0 ? last : index - 1;
      } else if (event.key === "Home") {
        next = 0;
      } else if (event.key === "End") {
        next = last;
      }
      if (next === null) return;
      event.preventDefault();
      select(next, { focus: true });
    });
  });

  return { select };
}
