import sanitizeHtml from "sanitize-html";

/**
 * Allow-list sanitiser for the rich-text advert description — the only place a
 * user can submit HTML. A hand-rolled regex is not good enough for this job
 * (mutation XSS, nested tags, attribute smuggling), so it uses a parser.
 *
 * Anything not on the list is dropped, including all attributes, so there is no
 * href, no style, no data-*, and nothing for an event handler to attach to.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "em", "u", "ul", "ol", "li", "h3", "h4", "blockquote"],
  allowedAttributes: {},
  allowedSchemes: [],
  disallowedTagsMode: "discard",
  // Drop the contents of these outright rather than keeping their text.
  nonTextTags: ["style", "script", "textarea", "option", "noscript", "iframe", "object", "embed"],
  enforceHtmlBoundary: true,
};

export function sanitiseHtml(input: string) {
  return sanitizeHtml(input, OPTIONS);
}

/** Plain text for cards, search snippets and meta descriptions. */
export function toPlainText(html: string, limit = 200) {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

/**
 * For anything rendered as an attribute or into a non-HTML context (email
 * subjects, notification titles). React escapes JSX text automatically, so this
 * is only for the places that bypass it.
 */
export function stripTags(input: string) {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
}
