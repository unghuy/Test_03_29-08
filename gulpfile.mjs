import gulp from "gulp";
import connect from "gulp-connect";
import fileinclude from "gulp-file-include";
import watch from "gulp-watch";
import prettify from "gulp-jsbeautifier";
import useref from "gulp-useref";
import rev from "gulp-rev";
import revReplace from "gulp-rev-replace";
import gulpif from "gulp-if";
import uglify from "gulp-uglify";
import cleanCSS from "gulp-clean-css";
import imagemin from "gulp-imagemin";
import del from "del";
import htmlhint from "gulp-htmlhint";
import postcss from "gulp-postcss";
import reporter from "postcss-reporter";
import syntax_scss from "postcss-scss";
import stylelint from "stylelint";
import * as sass from "sass";
import gulpSass from "gulp-sass";
import postcssUrl from 'postcss-url';
import replacePathHTML from 'gulp-replace';

// Set the Sass compiler for gulp-sass
const sassCompiler = gulpSass(sass);

const sources = {
  src: "./src",
  dist: "./html"
};

// Start server dev
export function connectDev(done) {
  connect.server({
    root: [sources.src, ".tmp", "./"],
    livereload: true,
    port: 9000,
    host: "0.0.0.0",
    fallback: `${sources.src}/index.html`
  });
  done();
}

// Start server product
export function connectProd(done) {
  connect.server({
    root: [sources.dist],
    livereload: true,
    port: 9090,
    host: "0.0.0.0",
    fallback: `${sources.dist}/index.html`
  });
  done();
}

// Watch
export function stream() {
  gulp.watch(`${sources.src}/views/**/*.html`, fileIncludeTask);
  gulp.watch(`${sources.src}/styles/**/*.scss`, sassTask);
  gulp.watch(`${sources.src}/scripts/**/*.js`, scriptTask);
  watch("**/*.css").pipe(connect.reload());
}

// Include HTML
export function fileIncludeTask() {
  return gulp
    .src([`${sources.src}/views/pages/*.html`])
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "@file"
      })
    )
    .pipe(gulp.dest(sources.src))
    .pipe(connect.reload());
}

// Minify CSS, JS
export function minify() {
  return gulp
    .src(`${sources.src}/*.html`)
    .pipe(useref())
    .pipe(
      gulpif(
        "*.js",
        uglify({
          compress: false
        })
      )
    )
    .pipe(
      gulpif(
        "*.css",
        cleanCSS({
          specialComments: 0
        })
      )
    )
    .pipe(gulp.dest(sources.dist));
}

// Sass
export const sassTask = gulp.series(htmlHintTask, () => {
  return gulp
    .src(`${sources.src}/styles/**/*.scss`)
    .pipe(sassCompiler().on("error", sassCompiler.logError))
    .pipe(
      postcss([
        postcssUrl({
          url: (asset) => {
            if (asset.url.startsWith('../../../../fonts/webfonts/')) {
              return asset.url.replace('../../../../fonts/webfonts/', '../fonts/webfonts/');
            }
            // Example: Change "../images" to "/assets/images"
            if (asset.url.startsWith('../../')) {
              return asset.url.replace('../../', '../');
            }
            return asset.url;
          }
        })
      ])
    )
    .pipe(gulp.dest(".tmp/styles"))
    .pipe(connect.reload());
});

// Lint CSS
export function lintCssTask() {
  return gulp
    .src(`${sources.src}/styles/base/_utility.scss`)
    .pipe(
      postcss([stylelint(), reporter({ clearMessages: true })], {
        syntax: syntax_scss
      })
    )
    .pipe(connect.reload());
}

// Javascript
export function scriptTask() {
  return gulp.src(`${sources.src}/scripts/**/*.js`).pipe(connect.reload());
}

// Minify images
export function imageminTask() {
  return gulp
    .src(`${sources.src}/images/**/*`)
    .pipe(
      imagemin({
        optimizationLevel: 5,
        progressive: true,
        interlaced: true,
        verbose: true
      })
    )
    .pipe(gulp.dest(`${sources.dist}/images`));
}

// HTML hint
export function htmlHintTask() {
  return gulp
    .src(`${sources.src}/*.html`)
    .pipe(htmlhint())
    .pipe(htmlhint.failReporter());
}

// Copy fonts
export function copyFonts() {
  return gulp
    .src(`${sources.src}/fonts/**/*`)
    .pipe(gulp.dest(`${sources.dist}/fonts`));
}

// HTML beautify
export const prettifyTask = gulp.series(copyFonts, () => {
  return gulp
    .src([`${sources.dist}/*.html`])
    .pipe(replacePathHTML('../../images', './images'))
    .pipe(
      prettify({
        indent_char: " ",
        indent_size: 2
      })
    )
    .pipe(gulp.dest(sources.dist));
});

// Revision
export function revision() {
  return gulp
    .src([`${sources.dist}/styles/*.css`, `${sources.dist}/scripts/*.js`], {
      base: sources.dist
    })
    .pipe(rev())
    .pipe(gulp.dest(sources.dist))
    .pipe(rev.manifest())
    .pipe(gulp.dest(".tmp"));
}

// Replace revision
export const revReplaceTask = gulp.series(revision, () => {
  const manifest = gulp.src(".tmp/rev-manifest.json");

  return gulp
    .src(`${sources.dist}/*.html`)
    .pipe(revReplace({ manifest: manifest }))
    .pipe(gulp.dest(sources.dist));
});

// Remove dist, tmp
export function clean() {
  return del([".tmp", sources.dist]);
}

// Remove files
export const cleanFiles = gulp.series(revReplaceTask, () => {
  return del([
    `${sources.dist}/styles/style.min.css`,
    `${sources.dist}/styles/vendor.min.css`,
    `${sources.dist}/scripts/script.min.js`,
    `${sources.dist}/scripts/vendor.min.js`
  ]);
});

// Build source
export const build = gulp.series(
  clean,
  fileIncludeTask,
  htmlHintTask,
  sassTask,
  minify,
  imageminTask,
  prettifyTask,
  cleanFiles,
  (done) => {
    console.log("Success!");
    done();
  }
);

// Start development server
export const dev = gulp.series(
  clean,
  gulp.parallel(connectDev, fileIncludeTask, sassTask, stream),
  (done) => {
    console.log("Development version is running...");
    done();
  }
);

// Start production server
export const prod = gulp.series(build, connectProd, (done) => {
  console.log("Production version is running...");
  done();
});

export default { build, dev, prod };
