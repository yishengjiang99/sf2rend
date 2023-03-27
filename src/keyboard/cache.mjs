import {renderToStaticMarkup} from "react-dom/server";
import {createElement} from "react";
// import pkg from "./like.js";
import {Select} from 'antd'
const html = renderToStaticMarkup(createElement(Select, {options: [{title: "a", value: "b"}], defaultValue: "b"}));
console.log(html)