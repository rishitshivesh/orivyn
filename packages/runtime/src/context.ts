/** Public, intentionally bounded UI context. Never put secrets or sensitive records here. */
export type ApplicationContext = {
  route: string;
  selection?: string;
  attributes?: Readonly<Record<string, string | number | boolean | null>>;
};

export function normalizeContext(
  context: ApplicationContext,
): ApplicationContext {
  if (!context.route.startsWith("/") || context.route.length > 512) {
    throw new Error(
      "Context route must be a relative path of at most 512 characters",
    );
  }
  if (context.route.startsWith("//"))
    throw new Error("Context route cannot be protocol-relative");
  if (context.selection && context.selection.length > 128)
    throw new Error("Selection too long");
  if (Object.keys(context.attributes ?? {}).length > 16)
    throw new Error("Too many context attributes");
  return {
    route: context.route,
    ...(context.selection ? { selection: context.selection } : {}),
    ...(context.attributes ? { attributes: { ...context.attributes } } : {}),
  };
}
