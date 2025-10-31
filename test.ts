import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { base, join, pathcat } from './src/index.ts';

describe('join()', () => {
	it('Should correctly join two paths', () => {
		assert.equal(join('first', 'second'), 'first/second');
		assert.equal(join('first/', 'second'), 'first/second');
		assert.equal(join('first', '/second'), 'first/second');
		assert.equal(join('first/', '/second'), 'first/second');
		assert.equal(join('first////', '////second'), 'first///////second');
		assert.equal(join('', 'second'), '/second');
		assert.equal(join('first', ''), 'first/');
		assert.equal(join('/', 'second'), '/second');
		assert.equal(join('first', '/'), 'first/');
		assert.equal(join('', ''), '/');
		assert.equal(join('/', '/'), '/');
	});

	it('Should work with many paths', () => {
		assert.equal(join('first', 'second/', 'third', 'fourth'), 'first/second/third/fourth');
		assert.equal(join('first', 'second/', 'third', 'fourth/'), 'first/second/third/fourth/');

		assert.equal(
			join('first////', '////second', '///third///', '////fourth'),
			'first///////second///third//////fourth'
		);
	});
});

describe('pathcat()', () => {
	it('Basic usage', () => {
		assert.equal(pathcat('first', 'second'), 'first/second');

		assert.equal(pathcat('https://example.com', ':id', { id: '123' }), 'https://example.com/123');
		assert.equal(pathcat('https://example.com', '/:id', { id: '123' }), 'https://example.com/123');

		assert.equal(
			pathcat('/users/:user/posts/:post', {
				user: '1',
				post: '2',
			}),
			'/users/1/posts/2'
		);

		assert.equal(
			pathcat('/users/:user/posts/:post', {
				user: '1',
				post: '2',
				param: true,
			}),
			'/users/1/posts/2?param=true'
		);

		assert.equal(
			pathcat('/users/:user/posts/:post', {
				user: '1',
				post: '2',
				field: ['name', 'age'],
				param: true,
			}),
			'/users/1/posts/2?field=name&field=age&param=true'
		);

		assert.equal(pathcat('/d', { field: ['name', 'age'] }), '/d?field=name&field=age');
		assert.equal(pathcat('/a', '/d', { field: ['name', 'age'] }), '/a/d?field=name&field=age');

		assert.equal(
			pathcat('https://example.com', '/users/:user_id/posts', {
				user_id: '1234',
				limit: 20,
				skip: 20,
			}),
			'https://example.com/users/1234/posts?limit=20&skip=20'
		);
	});

	it('Should correct handle double slashes', () => {
		assert.equal(
			pathcat('/first', '//second/:user_id', {
				user_id: '1234',
			}),
			'/first//second/1234'
		);

		assert.equal(
			pathcat('/first/', '/second/:user_id', {
				user_id: '1234',
			}),
			'/first/second/1234'
		);

		assert.equal(
			pathcat('/first/', '//second/:user_id', {
				user_id: '1234',
			}),
			'/first//second/1234'
		);
	});

	it('Should handle trailing slashes by including them in the path', () => {
		assert.equal(
			pathcat('/users/:user/posts/:post/', {
				user: '1',
				post: '2',
			}),
			'/users/1/posts/2/'
		);

		assert.equal(
			pathcat('/users/:user/posts/:post/', {
				user: '1',
				post: '2',
				limit: 10,
			}),
			'/users/1/posts/2/?limit=10'
		);
	});

	it('Should handle missing params by avoiding them', () => {
		assert.equal(
			// @ts-expect-error
			pathcat('/users/:user/posts/:post', { user: '1' }),
			'/users/1/posts/:post'
		);

		assert.equal(
			// @ts-expect-error
			pathcat('https://example.com', '/users/:user/posts/:post', { user: '1' }),
			'https://example.com/users/1/posts/:post'
		);
	});

	it('Should work with just a base path and query object', () => {
		assert.equal(
			pathcat('https://example.com', { user_id: '1234' }),
			'https://example.com?user_id=1234'
		);
	});

	it('Should work with a base path and subpath with no required params', () => {
		assert.equal(
			pathcat('https://example.com', '/example', { user_id: '1234' }),
			'https://example.com/example?user_id=1234'
		);
	});

	it('Should handle empty params as if they existed anyway', () => {
		assert.equal(
			pathcat('/users/:user/posts/:post/test', { user: '1', post: '' }),
			'/users/1/posts//test'
		);

		assert.equal(
			pathcat('https://example.com', '/users/:user/posts/:post/test', {
				user: '1',
				post: '',
			}),
			'https://example.com/users/1/posts//test'
		);
	});

	it('Should work with untyped base paths', () => {
		let base: string = 'test';

		assert.equal(
			pathcat(base, {
				user_id: '1234',
			}),
			'test?user_id=1234'
		);

		assert.equal(pathcat(base, '/path/to/resource'), 'test/path/to/resource');
	});

	it('should require the params object', () => {
		// @ts-expect-error
		pathcat('/users/:user/posts/:post');
	});

	it('Passing undefined should be treated as if the param was missing', () => {
		assert.equal(
			pathcat('/users/:user/posts/:post', { user: '1', post: undefined }),
			'/users/1/posts/:post'
		);

		assert.equal(
			pathcat('https://example.com', '/users/:user/posts/:post', {
				user: '1',
				post: undefined,
			}),
			'https://example.com/users/1/posts/:post'
		);
	});
});

describe('base()', () => {
	it('Should work with a base URL', () => {
		const api = base('https://example.com');
		assert.equal(
			api('/users/:user/posts/:post', { user: '1', post: '2' }),
			'https://example.com/users/1/posts/2'
		);

		assert.equal(
			api('/users/:user/posts/:post', { user: '1', post: '2', limit: 10, skip: 10 }),
			'https://example.com/users/1/posts/2?limit=10&skip=10'
		);

		assert.equal(
			api('/users/:user/posts/:post', {
				user: '1',
				post: '2',
				limit: 10,
				skip: 10,
				fields: ['title', 'body'],
			}),
			'https://example.com/users/1/posts/2?limit=10&skip=10&fields=title&fields=body'
		);
	});

	it('Should handle missing params by avoiding them', () => {
		const api = base('https://example.com');
		assert.equal(
			// @ts-expect-error
			api('/users/:user/posts/:post', { user: '1' }),
			'https://example.com/users/1/posts/:post'
		);

		assert.equal(
			// @ts-expect-error
			api('/users/:user_id/posts/:post_id/comments/:comment_id', {
				user_id: '123',
				post_id: '456',
			}),
			'https://example.com/users/123/posts/456/comments/:comment_id'
		);
	});

	it('Should handle trailing slashes by including them in the path', () => {
		const api = base('https://example.com');
		assert.equal(
			api('/users/:user/posts/:post/', { user: '1', post: '2' }),
			'https://example.com/users/1/posts/2/'
		);

		assert.equal(
			api('/users/:user/posts/:post/', { user: '1', post: '2', limit: 10 }),
			'https://example.com/users/1/posts/2/?limit=10'
		);
	});

	it('Should handle empty params as if they existed anyway', () => {
		const api = base('https://example.com');
		assert.equal(
			api('/users/:user/posts/:post/test', { user: '1', post: '' }),
			'https://example.com/users/1/posts//test'
		);

		assert.equal(
			api('/users/:user_id/posts/:post_id', { user_id: '', post_id: '123' }),
			'https://example.com/users//posts/123'
		);
	});

	it('Should work with paths that have no required params', () => {
		const api = base('https://example.com');
		assert.equal(api('/example'), 'https://example.com/example');
		assert.equal(api('/example', { user_id: '1234' }), 'https://example.com/example?user_id=1234');
		assert.equal(
			api('/example', { limit: 10, skip: 20 }),
			'https://example.com/example?limit=10&skip=20'
		);
	});

	it('Should handle double slashes correctly', () => {
		const api = base('https://example.com');
		assert.equal(
			api('/first//second/:user_id', { user_id: '1234' }),
			'https://example.com/first//second/1234'
		);

		assert.equal(
			api('//users/:user_id/posts', { user_id: '1234' }),
			'https://example.com//users/1234/posts'
		);

		assert.equal(
			api('/users/:user_id//posts/:post_id', { user_id: '1234', post_id: '567' }),
			'https://example.com/users/1234//posts/567'
		);
	});

	it('Passing undefined should be treated as if the param was missing', () => {
		const api = base('https://example.com');
		assert.equal(
			api('/users/:user/posts/:post', { user: '1', post: undefined }),
			'https://example.com/users/1/posts/:post'
		);

		assert.equal(
			api('/users/:user_id/posts/:post_id', {
				user_id: '1',
				post_id: undefined,
			}),
			'https://example.com/users/1/posts/:post_id'
		);
	});

	it('Should handle multiple path segments with params', () => {
		const api = base('https://api.example.com');
		assert.equal(
			api('/users/:user_id/posts/:post_id/comments/:comment_id', {
				user_id: '1',
				post_id: '2',
				comment_id: '3',
			}),
			'https://api.example.com/users/1/posts/2/comments/3'
		);

		assert.equal(
			api('/users/:user_id/posts/:post_id/comments/:comment_id', {
				user_id: '1',
				post_id: '2',
				comment_id: '3',
				include: ['author', 'replies'],
			}),
			'https://api.example.com/users/1/posts/2/comments/3?include=author&include=replies'
		);
	});

	it('Should require all path params when query object is provided', () => {
		const api = base('https://example.com');
		// @ts-expect-error
		api('/users/:user/posts/:post', { user: '1', limit: 10 });

		// @ts-expect-error
		api('/users/:user_id/posts/:post_id/comments/:comment_id', {
			user_id: '123',
			post_id: '456',
		});

		// @ts-expect-error
		api('/users/:user_id/posts', { limit: 10 });
	});

	it('should require the params object', () => {
		const api = base('https://example.com');
		// @ts-expect-error
		api('/users/:user/posts/:post');
	});

	it('Should work with numeric and boolean param values', () => {
		const api = base('https://example.com');
		assert.equal(api('/users/:id', { id: 123 }), 'https://example.com/users/123');

		assert.equal(
			api('/users/:id/active/:status', { id: 456, status: true }),
			'https://example.com/users/456/active/true'
		);

		assert.equal(
			api('/users/:id/active/:status', { id: 789, status: false }),
			'https://example.com/users/789/active/false'
		);
	});
});
