JSON.stringify(
  require("child_process").execSync("ls -rS static").trim().split("\n")
);
