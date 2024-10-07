/**
 * Represents a parameter value that can be used in a URL path.
 */
export type ParamValue = string | number | boolean | null | undefined;

/**
 * Represents a parameter value that can be used in a URL query.
 * This can be either a single value or an array of values.
 */
export type QueryValue = ParamValue | ParamValue[];

/**
 * Drops the protocol from the start of a url string
 */
export type DropProtocol<T extends string> = T extends `${infer _Protocol extends
	| "http"
	| "https"}://${infer Rest}`
	? Rest
	: T;

/**
 * Extracts url parameters from a route template string
 */
export type ExtractRouteParams<T extends string> = string extends T
	? string
	: T extends `${string}:${infer Param}/${infer Rest}`
	? Param | ExtractRouteParams<Rest>
	: T extends `${string}:${infer Param}`
	? Param
	: never;

/**
 * Represents a query object, where each key is a parameter name and each value is a parameter value.
 * If the template has URL params (like `/users/:user_id/posts`), the query object must contain at least the user_id param
 */
export type Query<Template extends string> = Record<ExtractRouteParams<Template>, ParamValue> &
	Record<string, QueryValue>;

// Defined early so we don't
// need to reallocate
const slash = "/";
const qmark = "?";
const eq = "=";
const amp = "&";
const emptyobj = {};

/**
 * Joins two paths together, removing up to 1 duplicate slashe between them
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
	const aEndsWithSlash = a.endsWith(slash);
	const bStartsWithSlash = b.startsWith(slash);

	if (aEndsWithSlash && bStartsWithSlash) {
		return a + b.slice(1);
	}

	if (!aEndsWithSlash && !bStartsWithSlash) {
		return a.concat(slash, b);
	}

	return a + b;
}

/**
 * Checks if a path template has parameters. Used to determine the order of arguments in `pathcat()`.
 */
export type DoesPathHaveParams<Path extends string> = string extends Path
	? false
	: ExtractRouteParams<DropProtocol<Path>> extends never
	? false
	: true;

/**
 * Joins a path template with a query object, returning a path with the query appended and parameters replaced.
 * @param template The path template to join with the query
 * @param base The base URL to join with the path
 * @param query The query to append to the path
 */
export function pathcat<Path extends string>(
	// prettier-ignore
	...args: DoesPathHaveParams<Path> extends false
		?
				| [base: string, path: Path | Query<DropProtocol<Path>>]
				| [base: string, path: Path, query: Query<Path>]
		:
				| [path: Path, query: Query<DropProtocol<Path>>]
				| [base: string, path: Path, query: Query<DropProtocol<Path>>]
): string;

export function pathcat(base: string, path?: string | Query<string>, query?: Query<string>) {
	return pathcatInternal(
		typeof path === "string" ? join(base, path) : base,
		typeof path === "object" ? path : query ?? emptyobj
	);
}

const regexp = /\/:([a-zA-Z0-9_]+)/g;

function paramValueToString(value: Exclude<ParamValue, undefined>) {
	return value === null ? "null" : String(value);
}

function pathcatInternal(template: string, params: Query<string>) {
	let path = template;
	const usedKeys = new Set<string>();

	path = path.replace(regexp, (full, key) => {
		// full is like `/:user_id` and key is like `user_id`
		if (key in params) {
			usedKeys.add(key);
			const value = params[key];

			if (value === undefined || Array.isArray(value)) {
				return full;
			}

			return slash.concat(paramValueToString(value));
		}

		return full;
	});

	const entries = Object.entries(params);

	if (usedKeys.size === entries.length) {
		return path;
	}

	let qs = "";

	for (const [key, value] of entries) {
		if (usedKeys.has(key)) {
			continue;
		}

		if (value === undefined) {
			continue;
		}

		if (Array.isArray(value)) {
			for (const item of value) {
				if (item !== undefined) {
					qs += key.concat(eq, paramValueToString(item), amp);
				}
			}
		} else {
			qs += key.concat(eq, paramValueToString(value), amp);
		}
	}

	if (qs.length) {
		return path.concat(qmark.concat(qs).slice(0, qs.length));
	}

	return path;
}
