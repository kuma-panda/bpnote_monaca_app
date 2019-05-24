module.exports = function(grunt){
     grunt.initConfig({
          browserify: {
               dist: {
                    src: 'www/js/main.js',
                    dest: 'www/bundle.js'
               }
          },
          sass: {
               compile: {
                    expand: true,
                    flatten: true,
                    src: ['www/css/*.scss'],
                    dest: './www/css',
                    ext: '.css'
               }
          }
     });
     grunt.loadNpmTasks('grunt-browserify');
     grunt.loadNpmTasks('grunt-contrib-sass');
     grunt.registerTask('default', ['browserify', 'sass']);
     grunt.registerTask('js', ['browserify']);
     grunt.registerTask('css', ['sass']);
};
