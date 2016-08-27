"use strict";

$(function () {
    SetupToc();
    $(window).scroll(OnScroll);
    OnScroll();
});

var SetupToc = function () {
    $('.toc-content').toc({
        container: '.content',
        smoothScrolling: false,
        headerText: function (i, heading, $heading) {
            return $heading.text();
        }
    });
};

var OnScroll = function () {
    var headerH = $('.entry').offset().top;
    var scrollVal = $(this).scrollTop();
    $('.toc').css({
        'top': Math.max(headerH - scrollVal, 0) + 'px'
    });
};