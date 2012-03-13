$.define("scrollpanel","uibase,event,attr,fx",function(Widget){
    function JScrollPane(elem, s)
    {
        var settings, jsp = this, pane, paneWidth, paneHeight, container, contentWidth, contentHeight,
        percentInViewH, percentInViewV, isScrollableV, isScrollableH, verticalDrag, dragMaxY,
        verticalDragPosition, horizontalDrag, dragMaxX, horizontalDragPosition,
        verticalBar, verticalTrack, scrollbarWidth, verticalTrackHeight, verticalDragHeight, arrowUp, arrowDown,
        horizontalBar, horizontalTrack, horizontalTrackWidth, horizontalDragWidth, arrowLeft, arrowRight,
        reinitialiseInterval, originalPadding, originalPaddingTotalWidth, previousContentWidth,
        wasAtTop = true, wasAtLeft = true, wasAtBottom = false, wasAtRight = false,
        originalElement = elem.clone(false, false).empty(),
        mwEvent = $.fn.mwheelIntent ? 'mwheelIntent.jsp' : 'mousewheel.jsp';

        originalPadding = elem.css('paddingTop') + ' ' +
            elem.css('paddingRight') + ' ' +
            elem.css('paddingBottom') + ' ' +
            elem.css('paddingLeft');
        originalPaddingTotalWidth = (parseInt(elem.css('paddingLeft'), 10) || 0) +
            (parseInt(elem.css('paddingRight'), 10) || 0);

        function initialise(s)
        {

            var /*firstChild, lastChild, */isMaintainingPositon, lastContentX, lastContentY,
            hasContainingSpaceChanged, originalScrollTop, originalScrollLeft,
            maintainAtBottom = false, maintainAtRight = false;

            settings = s;

            if (pane === undefined) {
                originalScrollTop = elem.scrollTop();
                originalScrollLeft = elem.scrollLeft();

                elem.css(
                {
                    overflow: 'hidden',
                    padding: 0
                }
            );
                // TODO: Deal with where width/ height is 0 as it probably means the element is hidden and we should
                // come back to it later and check once it is unhidden...
                paneWidth = elem.innerWidth() + originalPaddingTotalWidth;
                paneHeight = elem.innerHeight();

                elem.width(paneWidth);

                pane = $('<div class="jspPane" />').css('padding', originalPadding).append(elem.children());
                container = $('<div class="jspContainer" />')
                .css({
                    'width': paneWidth + 'px',
                    'height': paneHeight + 'px'
                }
            ).append(pane).appendTo(elem);

                /*
// Move any margins from the first and last children up to the container so they can still
// collapse with neighbouring elements as they would before jScrollPane
firstChild = pane.find(':first-child');
lastChild = pane.find(':last-child');
elem.css(
{
'margin-top': firstChild.css('margin-top'),
'margin-bottom': lastChild.css('margin-bottom')
}
);
firstChild.css('margin-top', 0);
lastChild.css('margin-bottom', 0);
                 */
            } else {
                elem.css('width', '');

                maintainAtBottom = settings.stickToBottom && isCloseToBottom();
                maintainAtRight = settings.stickToRight && isCloseToRight();

                hasContainingSpaceChanged = elem.innerWidth() + originalPaddingTotalWidth != paneWidth || elem.outerHeight() != paneHeight;

                if (hasContainingSpaceChanged) {
                    paneWidth = elem.innerWidth() + originalPaddingTotalWidth;
                    paneHeight = elem.innerHeight();
                    container.css({
                        width: paneWidth + 'px',
                        height: paneHeight + 'px'
                    });
                }

                // If nothing changed since last check...
                if (!hasContainingSpaceChanged && previousContentWidth == contentWidth && pane.outerHeight() == contentHeight) {
                    elem.width(paneWidth);
                    return;
                }
                previousContentWidth = contentWidth;

                pane.css('width', '');
                elem.width(paneWidth);

                container.find('>.jspVerticalBar,>.jspHorizontalBar').remove().end();
            }

            pane.css('overflow', 'auto');
            if (s.contentWidth) {
                contentWidth = s.contentWidth;
            } else {
                contentWidth = pane[0].scrollWidth;
            }
            contentHeight = pane[0].scrollHeight;
            pane.css('overflow', '');

            percentInViewH = contentWidth / paneWidth;
            percentInViewV = contentHeight / paneHeight;
            isScrollableV = percentInViewV > 1;

            isScrollableH = percentInViewH > 1;

            //console.log(paneWidth, paneHeight, contentWidth, contentHeight, percentInViewH, percentInViewV, isScrollableH, isScrollableV);

            if (!(isScrollableH || isScrollableV)) {
                elem.removeClass('jspScrollable');
                pane.css({
                    top: 0,
                    width: container.width() - originalPaddingTotalWidth
                });
                removeMousewheel();
                removeFocusHandler();
                removeKeyboardNav();
                removeClickOnTrack();
                unhijackInternalLinks();
            } else {
                elem.addClass('jspScrollable');

                isMaintainingPositon = settings.maintainPosition && (verticalDragPosition || horizontalDragPosition);
                if (isMaintainingPositon) {
                    lastContentX = contentPositionX();
                    lastContentY = contentPositionY();
                }

                initialiseVerticalScroll();
                initialiseHorizontalScroll();
                resizeScrollbars();

                if (isMaintainingPositon) {
                    scrollToX(maintainAtRight ? (contentWidth - paneWidth ) : lastContentX, false);
                    scrollToY(maintainAtBottom ? (contentHeight - paneHeight) : lastContentY, false);
                }

                initFocusHandler();
                initMousewheel();
                initTouch();

                if (settings.enableKeyboardNavigation) {
                    initKeyboardNav();
                }
                if (settings.clickOnTrack) {
                    initClickOnTrack();
                }

                observeHash();
                if (settings.hijackInternalLinks) {
                    hijackInternalLinks();
                }
            }

            if (settings.autoReinitialise && !reinitialiseInterval) {
                reinitialiseInterval = setInterval(
                function()
                {
                    initialise(settings);
                },
                settings.autoReinitialiseDelay
            );
            } else if (!settings.autoReinitialise && reinitialiseInterval) {
                clearInterval(reinitialiseInterval);
            }

            originalScrollTop && elem.scrollTop(0) && scrollToY(originalScrollTop, false);
            originalScrollLeft && elem.scrollLeft(0) && scrollToX(originalScrollLeft, false);

            elem.trigger('jsp-initialised', [isScrollableH || isScrollableV]);
        }
        var defaults = {
            showArrows					: false,
            maintainPosition			: true,
            stickToBottom				: false,
            stickToRight				: false,
            clickOnTrack				: true,
            autoReinitialise			: false,
            autoReinitialiseDelay		: 500,
            verticalDragMinHeight		: 0,
            verticalDragMaxHeight		: 99999,
            horizontalDragMinWidth		: 0,
            horizontalDragMaxWidth		: 99999,
            contentWidth				: undefined,
            animateScroll				: false,
            animateDuration				: 300,
            animateEase					: 'linear',
            hijackInternalLinks			: false,
            verticalGutter				: 4,
            horizontalGutter			: 4,
            mouseWheelSpeed				: 0,
            arrowButtonSpeed			: 0,
            arrowRepeatFreq				: 50,
            arrowScrollOnHover			: false,
            trackClickSpeed				: 0,
            trackClickRepeatFreq		: 70,
            verticalArrowPositions		: 'split',
            horizontalArrowPositions	: 'split',
            enableKeyboardNavigation	: true,
            hideFocus					: false,
            keyboardSpeed				: 0,
            initialDelay                : 300,        // Delay before starting repeating
            speed		            : 30,		// Default speed when others falsey
            scrollPagePercent			: .8		// Percent of visible area scrolled when pageUp/Down or track area pressed
        }

    
        $.fn.switchable = Widget.create("scrollpanel", ScrollPanel, init )
    })
