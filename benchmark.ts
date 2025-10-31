import Benchmark from 'benchmark';
import { join, pathcat } from './src/index.ts';

const suite = new Benchmark.Suite();

suite
	.add('pathcat() With a base URL', () => {
		pathcat('https://example.com', '/users/:user_id/posts/:post_id/reactions', {
			user_id: 1,
			post_id: 2,
			limit: 10,
			skip: 10,
		});
	})
	.add('pathcat() With no base URL', () => {
		pathcat('/users/:user_id/posts/:post_id/reactions', {
			user_id: 1,
			post_id: 2,
			limit: 10,
			skip: 10,
		});
	})
	.add('pathcat() With a base URL, and no params', () => {
		// @ts-expect-error
		pathcat('https://example.com', '/users/:user_id/posts/:post_id/reactions');
	})
	.add('join() with 2 arguments', () => {
		join('https://example.com', 'test');
	})
	.add('join() with many arguments', () => {
		join(
			'https://example.com',
			'test',
			'///test',
			'//test',
			'test',
			'/test',
			'test',
			'/123124124/123'
		);
	})
	.on('cycle', (event: Event) => {
		console.log(String(event.target));
	})
	.run({ async: true });
