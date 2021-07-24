import { range } from "./range.js";
import { load } from "./sf2-service/read.js";

const { getFont } = await load("file.sf2");
console.log(getFont(0, 0, 55, 33));
