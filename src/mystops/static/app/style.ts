export const getStyleSheet = (styleSheet: CSSStyleSheet) => {
  const css = Array.from(styleSheet.cssRules)
    .map((rule) => rule.cssText)
    .join("\n");
  const clone = new CSSStyleSheet();
  clone.replaceSync(css);
  return clone;
};
