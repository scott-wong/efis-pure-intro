
require('docs/ie-emulation-modes-warning');
require('bootstrap/scrollspy');
require('bootstrap/tooltip');
require('bootstrap/affix');
require('bootstrap/popover');

// NOTICE!! DO NOT USE ANY OF THIS JAVASCRIPT
// IT'S ALL JUST JUNK FOR OUR DOCS!
// ++++++++++++++++++++++++++++++++++++++++++

/*!
 * JavaScript for Bootstrap's docs (http://getbootstrap.com)
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under the Creative Commons Attribution 3.0 Unported License. For
 * details, see http://creativecommons.org/licenses/by/3.0/.
 */


! function($) {
    'use strict';

    $(function() {

        // Scrollspy
        var $window = $(window)
        var $body = $(document.body)

        $body.scrollspy({
            target: '.bs-docs-sidebar'
        })
        $window.on('load', function() {
            $body.scrollspy('refresh')
        })

        // Kill links
        $('.bs-docs-container [href=#]').click(function(e) {
            e.preventDefault()
        })

        // Sidenav affixing
        setTimeout(function() {
            var $sideBar = $('.bs-docs-sidebar')

            $sideBar.affix({
                offset: {
                    top: function() {
                        var offsetTop = $sideBar.offset().top
                        var sideBarMargin = parseInt($sideBar.children(0).css('margin-top'), 10)
                        var navOuterHeight = $('.bs-docs-nav').height()

                        return (this.top = offsetTop - navOuterHeight - sideBarMargin)
                    },
                    bottom: function() {
                        return (this.bottom = $('.bs-docs-footer').outerHeight(true))
                    }
                }
            })
        }, 100)

        setTimeout(function() {
            $('.bs-top').affix()
        }, 100)

        // theme toggler
        ;
        (function() {
            var stylesheetLink = $('#bs-theme-stylesheet')
            var themeBtn = $('.bs-docs-theme-toggle')

            var activateTheme = function() {
                stylesheetLink.attr('href', stylesheetLink.attr('data-href'))
                themeBtn.text('Disable theme preview')
                localStorage.setItem('previewTheme', true)
            }

            if (localStorage.getItem('previewTheme')) {
                activateTheme()
            }

            themeBtn.click(function() {
                var href = stylesheetLink.attr('href')
                if (!href || href.indexOf('data') === 0) {
                    activateTheme()
                } else {
                    stylesheetLink.attr('href', '')
                    themeBtn.text('Preview theme')
                    localStorage.removeItem('previewTheme')
                }
            })
        })();

        // Tooltip and popover demos
        $('.tooltip-demo').tooltip({
            selector: '[data-toggle="tooltip"]',
            container: 'body'
        })
        $('.popover-demo').popover({
            selector: '[data-toggle="popover"]',
            container: 'body'
        })

        // Demos within modals
        $('.tooltip-test').tooltip()
        $('.popover-test').popover()

        // Default & dismissible popover demos
        $('.bs-docs-popover').popover()
        $('.bs-docs-popover-dismiss').popover({
            trigger: 'focus'
        })

        // Button state demo
        $('#loading-example-btn').click(function() {
            var btn = $(this)
            btn.button('loading')
            setTimeout(function() {
                btn.button('reset')
            }, 3000)
        })

    })

}(jQuery)
