import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import * as dartSass from 'sass';
import postcss from 'gulp-postcss';
import tailwindcssPostcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import rename from 'gulp-rename';

const sass = gulpSass(dartSass);

const createBundle = (theme) => {
    return gulp.src([
        `src/styles/main-${theme}.scss`
    ])
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([
            tailwindcssPostcss({ config: './tailwind.config.cjs' }),
            autoprefixer(),
            cssnano()
        ]))
        .pipe(rename(`bundle-${theme}.css`))
        .pipe(gulp.dest('static/styles'));
};

gulp.task('bundle-light', () => createBundle('light'));
gulp.task('bundle-dark', () => createBundle('dark'));

gulp.task('watch', () => {
    gulp.watch(['src/styles/*.scss', 'src/styles/*.css', 'tailwind.config.cjs'], gulp.parallel('bundle-light', 'bundle-dark'));
});

gulp.task('default', gulp.parallel('bundle-light', 'bundle-dark', 'watch'));