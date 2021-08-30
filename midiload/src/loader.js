module.exports = function (source) {
  source = source.replace(/\[name\]/g, "s");

  return `export default ${JSON.stringify(source)}`;
};
