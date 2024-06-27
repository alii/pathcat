import Benchmark from "benchmark";
import { pathcat } from "./src";

const suite = new Benchmark.Suite();

suite
	.add("With a base URL", () => {
		pathcat("https://example.com", "/users/:user_id/posts/:post_id/reactions", {
			user_id: 1,
			post_id: 2,
			limit: 10,
			skip: 10,
		});
	})
	.add("With no base URL", () => {
		pathcat("/users/:user_id/posts/:post_id/reactions", {
			user_id: 1,
			post_id: 2,
			limit: 10,
			skip: 10,
		});
	})
	.add("With a base URL, and no params", () => {
		// @ts-expect-error
		pathcat("https://example.com", "/users/:user_id/posts/:post_id/reactions");
	})
	.on("cycle", (event: Event) => {
		console.log(String(event.target));
	})
	.run({ async: true });
