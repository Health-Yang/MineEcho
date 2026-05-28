const { copySync } = require("fs-extra");
const { join } = require("path");

exports.default = function(context) {
  const { appOutDir } = context;
  const source = join(__dirname, "..", "bff-bundle");
  const dest = join(appOutDir, "resources", "bff");
  console.log(`[afterPack] Copying BFF from ${source} to ${dest}`);
  copySync(source, dest, { overwrite: true });
  console.log(`[afterPack] BFF copied successfully`);
};
