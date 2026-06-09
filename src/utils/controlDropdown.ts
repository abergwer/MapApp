/**
 * Shared, generic dropdown utility.
 *
 * Framework-agnostic plain DOM so it can be reused anywhere in the project.
 * It knows nothing about maps or measurements — callers supply the icon, title
 * and class names for their specific use case.
 */

export interface ControlDropdownOptions {
  /** Tooltip + aria-label for the toggle button. */
  title: string;
  /** Inline SVG (or other HTML) markup for the toggle icon. */
  icon: string;
  /** CSS class applied to the toggle button. */
  toggleClassName: string;
  /** CSS class toggled on the group when expanded. Defaults to `'expanded'`. */
  expandedClassName?: string;
}

/**
 * Collapses an existing button group into a dropdown: prepends a single toggle
 * button that expands/collapses the group's other buttons by toggling a class
 * on the group element.
 *
 * @param group The group element whose buttons should collapse.
 * @param options Caller-supplied icon, title and class names.
 * @returns A cleanup function that removes the toggle and listeners.
 */
export function setupControlDropdown(
  group: HTMLElement,
  options: ControlDropdownOptions,
): () => void {
  const { title, icon, toggleClassName, expandedClassName = 'expanded' } = options;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = toggleClassName;
  toggle.title = title;
  toggle.setAttribute('aria-label', title);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = icon;

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    const open = group.classList.toggle(expandedClassName);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', handleClick);
  group.insertBefore(toggle, group.firstChild);

  return () => {
    toggle.removeEventListener('click', handleClick);
    toggle.remove();
  };
}
