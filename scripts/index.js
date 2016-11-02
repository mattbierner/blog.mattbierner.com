"use strict";

$(function () {
    SetupToc();
    $(window).scroll(OnScroll);
    OnScroll();
});

var SetupToc = function () {
    $('.toc-content').toc({
        selectors: '.post > h1, .post > h2',
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