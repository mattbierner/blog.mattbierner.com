$(function() {
    SetupToc();
});

var SetupToc = function() {
  $('.post-content').prepend($("<nav class='toc'></nav>"));
    
    $('.toc').toc({
        container: '.post-content',
        'smoothScrolling': false
    });
    
   $(window).scroll(function() {
       var headerH = $('.post-content').offset().top; console.log(headerH);
       var scrollVal = $(this).scrollTop();
       $('.toc').css({'position': scrollVal > headerH ? 'fixed' : 'static', 'top' :'0'});
    });
};