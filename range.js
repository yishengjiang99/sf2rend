export default const range = (x, y) =>
	Array.from(
		(function* _(x, y) {
			while (x++ < y) yield x;
		})(x, y)
	);

// range(0, 16);
// console.log(range(0, 44));
