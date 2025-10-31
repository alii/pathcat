# `pathcat` 🐾

Simply path/URL building in JavaScript. Intelligently handles URL params and
query strings.

This library owes thanks to urlcat, which unfortunately seems to be abandoned.
Consider `pathcat` as a suitable replacement.

## Features

- Very intuitive API
- Supports URL params and query string
- Avoids double slashes
- Zero dependencies
- Absolutely tiny install size

## Install

```sh
bun add pathcat
```

## Usage

```typescript
import { pathcat } from 'pathcat';

pathcat('https://example.com', '/:id', {
	id: 123,
});
// => 'https://example.com/123'

pathcat('https://example.com', '/:id', {
	id: '123',
	foo: 'bar',
});
// => 'https://example.com/123?foo=bar'

// Base URL is optional, works on just paths as well.
pathcat('/users/:user_id/posts/:post_id', {
	user_id: '123',
	post_id: 456,
	cool_flag: true,
});
// => '/users/123/posts/456?cool_flag=true'

// You can also use arrays for query string values
pathcat('/users/:user_id/posts/:post_id', {
	user_id: '123',
	post_id: 456,
	cool_flag: true,
	fields: ['title', 'body'],
});
// => '/users/123/posts/456?cool_flag=true&fields=title&fields=body'
```

## `base()` Function

Create a reusable function with a base URL, useful for repeated usage on a specific base URL (e.g., when writing a RESTful HTTP API client):

```typescript
import { base } from 'pathcat';

const api = base('https://api.example.com');

api('/users/:id', { id: 123 });
// => 'https://api.example.com/users/123'

api('/posts/:post_id', { post_id: 456, include: ['author', 'comments'] });
// => 'https://api.example.com/posts/456?include=author&include=comments'
```

## Benchmark:

Results when running on an M4 Max

```
$ node -v
v22.18.0

$ node --import=tsx benchmark
pathcat() With a base URL x 3,576,027 ops/sec ±0.70% (91 runs sampled)
pathcat() With no base URL x 4,275,819 ops/sec ±0.57% (95 runs sampled)
pathcat() With a base URL, and no params x 80,913,930 ops/sec ±1.84% (89 runs sampled)
join() with 2 arguments x 72,378,677 ops/sec ±1.76% (89 runs sampled)
join() with many arguments x 5,595,168 ops/sec ±0.53% (92 runs sampled)
```

## Notes:

- Any params or query string values that are `undefined` will be omitted.
- Params that were not specified in the object will be left as is.
