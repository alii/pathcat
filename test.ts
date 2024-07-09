import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { join, pathcat } from "./src/index.ts";

describe("join()", () => {
	it("Should correctly join two paths", () => {
		assert.equal(join("first", "second"), "first/second");
		assert.equal(join("first/", "second"), "first/second");
		assert.equal(join("first", "/second"), "first/second");
		assert.equal(join("first/", "/second"), "first/second");
		assert.equal(join("first////", "////second"), "first///////second");
		assert.equal(join("", "second"), "/second");
		assert.equal(join("first", ""), "first/");
		assert.equal(join("/", "second"), "/second");
		assert.equal(join("first", "/"), "first/");
		assert.equal(join("", ""), "/");
		assert.equal(join("/", "/"), "/");
	});
});

describe("pathcat()", () => {
	it("Basic usage", () => {
		assert.equal(pathcat("first", "second"), "first/second");

		assert.equal(pathcat("https://example.com", ":id", { id: "123" }), "https://example.com/123");

		assert.equal(
			pathcat("/users/:user/posts/:post", {
				user: "1",
				post: "2",
			}),
			"/users/1/posts/2"
		);

		assert.equal(
			pathcat("/users/:user/posts/:post", {
				user: "1",
				post: "2",
				param: true,
			}),
			"/users/1/posts/2?param=true"
		);

		assert.equal(
			pathcat("/users/:user/posts/:post", {
				user: "1",
				post: "2",
				field: ["name", "age"],
				param: true,
			}),
			"/users/1/posts/2?field=name&field=age&param=true"
		);

		assert.equal(
			pathcat("https://example.com", "/users/:user_id/posts", {
				user_id: "1234",
				limit: 20,
				skip: 20,
			}),
			"https://example.com/users/1234/posts?limit=20&skip=20"
		);
	});

	it("Should correct handle double slashes", () => {
		assert.equal(
			pathcat("/first", "//second/:user_id", {
				user_id: "1234",
			}),
			"/first//second/1234"
		);

		assert.equal(
			pathcat("/first/", "/second/:user_id", {
				user_id: "1234",
			}),
			"/first/second/1234"
		);

		assert.equal(
			pathcat("/first/", "//second/:user_id", {
				user_id: "1234",
			}),
			"/first//second/1234"
		);
	});

	it("Should handle missing params by avoiding them", () => {
		// @ts-expect-error
		assert.equal(pathcat("/users/:user/posts/:post", { user: "1" }), "/users/1/posts/:post");

		assert.equal(
			// @ts-expect-error
			pathcat("https://example.com", "/users/:user/posts/:post", { user: "1" }),
			"https://example.com/users/1/posts/:post"
		);
	});

	it("Should work with just a base path and query object", () => {
		assert.equal(
			pathcat("https://example.com", { user_id: "1234" }),
			"https://example.com?user_id=1234"
		);
	});

	it("Should handle empty params as if they existed anyway", () => {
		assert.equal(
			pathcat("/users/:user/posts/:post/test", { user: "1", post: "" }),
			"/users/1/posts//test"
		);

		assert.equal(
			pathcat("https://example.com", "/users/:user/posts/:post/test", { user: "1", post: "" }),
			"https://example.com/users/1/posts//test"
		);
	});

	it("Should work with untyped base paths", () => {
		let base: string = "test";

		assert.equal(
			pathcat(base, {
				user_id: "1234",
			}),
			"test?user_id=1234"
		);

		assert.equal(pathcat(base, "/path/to/resource"), "test/path/to/resource");
	});

	it("Passing undefined should be treated as if the param was missing", () => {
		assert.equal(
			pathcat("/users/:user/posts/:post", { user: "1", post: undefined }),
			"/users/1/posts/:post"
		);

		assert.equal(
			pathcat("https://example.com", "/users/:user/posts/:post", { user: "1", post: undefined }),
			"https://example.com/users/1/posts/:post"
		);
	});
});
