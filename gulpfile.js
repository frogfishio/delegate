const { src, dest, series } = require('gulp');

async function clean() {
  const del = require('del');
  await del(['build/release']);
  require('mkdirp')('build/release');
}

async function compile() {
  const ts = require('gulp-typescript');
  var tsProject = ts.createProject('./tsconfig.json');

  await src(['src/**/*.ts']).pipe(tsProject()).js.pipe(dest('build/release'));
}

async function package() {
  var fs = require('fs');
  var pkg = require('./package');
  delete pkg.devDependencies;
  delete pkg.scripts;

  fs.writeFileSync(
    './build/release/package.json',
    JSON.stringify(pkg, null, 2)
  );
}

async function services() {
  await src(['service/*']).pipe(dest('build/release'));
}

exports.clean = clean;
exports.compile = compile;
exports.build = series(compile, package, services);
