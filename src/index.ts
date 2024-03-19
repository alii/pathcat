export type ParamValue = string | number | boolean | null | undefined;

export type DropProtocol<T extends string> = T extends `${infer _Protocol extends
	| "http"
	| "https"}://${infer Rest}`
	? Rest
	: T;

export type ExtractRouteParams<T extends string> = string extends T
	? string
	: T extends `${string}:${infer Param}/${infer Rest}`
	? Param | ExtractRouteParams<Rest>
	: T extends `${string}:${infer Param}`
	? Param
	: never;

export type Query<Template extends string> = Record<ExtractRouteParams<Template>, ParamValue> &
	Record<string, ParamValue>;

/**
 * Joins two paths together, removing any duplicate slashes between them.
 * @param a The first path to join
 * @param b The second path to join
 * @returns The joined path
 *
 * @example
 * ```ts
 * join("a", "b"); // "a/b"
 * join("a/", "/b"); // "a/b"
 * join("a", "/b"); // "a/b"
 * join("a/", "//b"); // "a//b"
 * join("a", "//b"); // "a//b"
 * ```
 */
export function join(a: string, b: string): string {
	const aEndsWithSlash = a.endsWith("/");
	const bStartsWithSlash = b.startsWith("/");

	if (aEndsWithSlash && bStartsWithSlash) {
		return a + b.slice(1);
	}

	if (!aEndsWithSlash && !bStartsWithSlash) {
		return `${a}/${b}`;
	}

	return a + b;
}

/**
 * Joins a path template with a query object, returning a path with the query appended and parameters replaced.
 * @param template The path template to join with the query
 * @param base The base URL to join with the path
 * @param query The query to append to the path
 */
export function pathcat<Path extends string>(
	...[base, path, query]: ExtractRouteParams<DropProtocol<Path>> extends never
		? [path: Path, query?: Query<string>] | [base: string, path: Path, query?: Query<string>]
		:
				| [path: Path, query: Query<DropProtocol<Path>>]
				| [base: string, path: Path, query: Query<DropProtocol<Path>>]
): string {
	return pathcatInternal(
		typeof path === "string" ? join(base, path) : base,
		(typeof path === "object" ? path : query) ?? {}
	);
}

const regexp = /\/:([a-zA-Z0-9_]+)/g;

function pathcatInternal(template: string, params: Query<string>) {
	const usedKeys = new Set<string>();

	const path = template.replace(regexp, (match, key) => {
		if (params[key] !== undefined) {
			usedKeys.add(key);
			return `/${encodeURIComponent(params[key] as string)}`;
		}

		return match;
	});

	const queryParams = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (!usedKeys.has(key) && value !== undefined) {
			queryParams.set(key, value as string);
		}
	}

	const queryString = queryParams.toString();
	return queryString ? `${path}?${queryString}` : path;
}
