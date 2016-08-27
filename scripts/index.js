$(function() {
    SetupToc();
});

var SetupToc = function() {
    $('.toc-content').toc({
        container: '.content',
        smoothScrolling: false
    });

    $(window).scroll(function() {
       var headerH = $('.entry').offset().top;
       var scrollVal = $(this).scrollTop();
       $('.toc').css({
           'position': scrollVal > headerH ? 'fixed' : 'static'
        });
    });
};