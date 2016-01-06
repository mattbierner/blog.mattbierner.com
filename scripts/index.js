$(function() {
    SetupToc();
});

var SetupToc = function() {
  $('.entry').prepend($("<nav class='toc'></nav>"));
    
    $('.toc').toc({
        container: '.entry',
        'smoothScrolling': false
    });
    
   $(window).scroll(function() {
       var headerH = $('.entry').offset().top; console.log(headerH);
       var scrollVal = $(this).scrollTop();
       $('.toc').css({'position': scrollVal > headerH ? 'fixed' : 'static', 'top' :'0'});
    });
};