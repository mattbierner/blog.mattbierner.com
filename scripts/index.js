"use strict";

var tocSelector = '.post > h1, .post > h2';

$(function () {
    SetupToc();
    $(window).scroll(OnScroll);
    OnScroll();
});


var SetupToc = function () {
    if (!$(tocSelector).size())
        return;
    
    $('.toc').removeClass('hidden')
    $('.toc-content').toc({
        selectors: tocSelector,
        smoothScrolling: false,
        headerText: function (i, heading, $heading) {
            return $heading.text();
        }
    });
};

var OnScroll = function () {
    var headerH = $('.post').offset().top;
    var scrollVal = $(this).scrollTop();
    $('.toc').css({
        'top': Math.max(headerH - scrollVal, 0) + 'px'
    });
};