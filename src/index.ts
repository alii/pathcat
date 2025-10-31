/**
 * Represents a parameter value that can be used in a URL path.
 */
export type ParamValue = string | number | boolean | null | undefined;

/**
 * Represents a parameter value that can be used in a URL query. This can be
 * either a single value or an array of values.
 */
export type QueryValue = ParamValue | ParamValue[];

/**
 * Drops the protocol from the start of a url string
 */
export type DropProtocol<T extends string> = T extends `${'http' | 'https'}://${infer Rest}`
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
 * Represents a query object, where each key is a parameter name and each value
 * is a parameter value. If the template has URL params (like
 * `/users/:user_id/posts`), the query object must contain at least the user_id
 * param
 */
export type Query<Template extends string> = Record<ExtractRouteParams<Template>, ParamValue> &
	Record<string, QueryValue>;

const slash = '/';
const qmark = '?';
const eq = '=';
const amp = '&';
const empty = '';
const emptyobj = {};
const colon = ':';
const slashCharCode = 47; // "/".charCodeAt(0);

/**
 * Joins multiple paths together, removing up to 1 duplicate slash between each pair
 * @param paths The paths to join
 * @returns The joined path
 *
 * @example
 * ```ts
 * join("a", "b", "c"); // "a/b/c"
 * join("a/", "/b", "/c"); // "a/b/c"
 * join("a", "/b", "//c"); // "a/b//c"
 * ```
 */
export function join(...paths: [string, string, ...string[]]): string {
	let result = paths[0];

	for (let i = 1; i < paths.length; i++) {
		const path = paths[i]!;
		const accEndsWithSlash = result.charCodeAt(result.length - 1) === slashCharCode;
		const pathStartsWithSlash = path.charCodeAt(0) === slashCharCode;

		if (accEndsWithSlash && pathStartsWithSlash) {
			result = result.concat(path.slice(1));
		} else if (!accEndsWithSlash && !pathStartsWithSlash) {
			result = result.concat(slash, path);
		} else {
			result = result.concat(path);
		}
	}

	return result;
}

/**
 * Joins a path with a query object, returning a path with the parameters
 * inserted and remaining url query values appended.
 *
 * @param path The path that will have parameters replaced and query appended to
 * @param query The query to append to the path
 */
export function pathcat<Path extends string>(path: Path, query: Query<DropProtocol<Path>>): string;

/**
 * Joins a path with a query object, returning a path with the parameters
 * inserted and remaining url query values appended.
 *
 * @param base The base url, probably like `https://api.example.com`
 * @param path The path that will have parameters replaced and query appended to
 * @param query The query to append to the path
 */
export function pathcat<Path extends string>(
	base: string,
	path: Path,
	...query: [ExtractRouteParams<Path>] extends [never]
		? [query?: Query<Path>]
		: [query: Query<Path>]
): string;

export function pathcat(base: string, path?: string | Query<string>, query?: Query<string>) {
	return pathcatInternal(
		typeof path === 'string' ? join(base, path) : base,
		typeof path === 'object' ? path : query ?? emptyobj
	);
}

function paramValueToString(value: Exclude<ParamValue, undefined>) {
	return value === null ? 'null' : String(value);
}

function pathcatInternal(template: string, params: Query<string>) {
	let path = template;
	let qs = empty;

	for (const key in params) {
		const value = params[key];

		if (value === undefined) {
			continue;
		}

		const withColon = colon.concat(key);
		if (path.includes(withColon)) {
			path = path.replace(`:${key}`, paramValueToString(value));
			continue;
		}

		if (Array.isArray(value)) {
			for (let j = 0; j < value.length; j++) {
				const item = value[j];

				if (item !== undefined) {
					qs += key.concat(eq, paramValueToString(item), amp);
				}
			}
		} else {
			qs += key.concat(eq, paramValueToString(value), amp);
		}
	}

	const len = qs.length;
	if (len !== 0) {
		return path.concat(qmark.concat(qs).slice(0, len));
	}

	return path;
}

/**
 * Create a function that wraps a base URL, this is useful for repeated usage of
 * pathcat on a specific base URL, for example when writing a client for an
 * Restful HTTP API
 *
 * @param base - The base URL to use for the path
 *
 * @returns Function which accepts the path and query if required
 */
export function base(
	base: string
): <Path extends string>(
	path: Path,
	...query: [ExtractRouteParams<Path>] extends [never]
		? [query?: Query<Path>]
		: [query: Query<Path>]
) => string {
	return (path, ...query) => pathcat(base, path, ...query);
}
