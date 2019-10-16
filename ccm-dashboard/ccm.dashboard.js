/**
 * @overview <ccm-dashboard> custom layout of items
 * @author Michael Nutzenberger <michael.nutzenberger@smail.inf.h-brs.de> 2019
 * @license The MIT License (MIT)
 * @version latest (0.0.1)
 */
( function () {
    const component = {

        name: 'dashboard',

        ccm: 'https://ccmjs.github.io/ccm/ccm.min.js',

        config: {

            css: [ 'ccm.load', '../ccm-dashboard/resources/default.css' ],

            /*
            grid: {
                cell: { // a square cell. size in px
                    size: 10
                }
            },
            */
            'grid.cell.size': 10

        },

        Instance: function () {

            const self = this,
                utils = new Utils();
            let $;

            this.init = async () => {
                // set shortcut to help functions
                $ = self.ccm.helper;

                // support declarative embedding dashboard items
                evaluateLightDOM();

                // finds Custom Component Elements for generating widgets
                function evaluateLightDOM () {
                    // no Light DOM? => skip
                    if ( !self.inner ) return;

                    const items = [];

                    // iterate over all children of Light DOM
                    [ ...self.inner.children ].forEach( _element => {

                        let _title = _element.getAttribute('title') || 'item-' + items.length;

                        items.push( new Item( _title, _element ) );

                    });

                    // standard behavior: declarative embedding items should have higher priority than functional
                    if ( items.length > 0 ) self.items = items;
                }

            };

            this.ready = async () => { console.log( 'dashboard: READY' ) };

            this.start = async () => {

                console.info('dashboard: START' );

                // remove ccm loading icon
                utils.removeLoading();

                // add dashboard resize listener
                utils.addElementResizeListener();

                new Dashboard( self.element, utils.addStyles() );
            };

            function Dashboard(node, _style) {
                let __root, __style = _style, cols, rows;

                if ( node )
                    __root = node;

                if ( !__root )
                    console.error( 'no dashboard node given!' );

                if ( !__style )
                    __style = utils.addStyles();


                let cell = {
                    size: 10, // a square cell. in px
                    width: null, // effective cells width will be approximately by cell.size
                    height: null // effective cells height will be approximately by cell.size
                };

                if (self['cell-size'])
                    cell.size = self['cell-size'];
                else if (self.grid && self.grid.cell && self.grid.cell.size)
                    cell.size = self.grid.cell.size;

                let gridWidth = __root.getBoundingClientRect().width;
                let gridHeight = __root.getBoundingClientRect().height;

                cell.width = gridWidth / Math.floor(gridWidth / cell.size);
                cols = ( gridWidth / cell.width ) - 1;

                cell.height = gridHeight / Math.floor(gridHeight / cell.size);
                rows = ( gridHeight / cell.height ) - 1;

                self.dashboard = {
                    cell: {}
                };

                Object.defineProperties(self.dashboard, {
                    rows: { get: () => rows },
                    cols: { get: () => cols },
                });
                Object.defineProperties(self.dashboard.cell, {
                    height: { get: () => cell.height },
                    width: { get: () => cell.width }
                });

                render();

                this.render = render;

                function render() {
                    // there are no items defined
                    if ( !Array.isArray( self.items ) ) return;

                    // iterate over items
                    [ ...self.items ].forEach( _item => {
                        __root.appendChild( _item.render(__style) )
                    } );

                }

            }

            function Item ( title, content) {
                let itemSelf = this;
                /**
                 *  width can be
                 *   a) string -> interpreted as (decimal) fraction. e.g. "0.8" or "4/5". fraction must be 0 < width < 1
                 *   b) number -> absolute column count. if count bigger than Dashboard.cols -> width will be set to Dashboard.cols
                 */
                let width = "1/2";
                /**
                 *  height can be
                 *   a) string -> interpreted as (decimal) fraction. e.g. "0.8" or "4/5". fraction must be 0 < height < 1
                 *   b) number -> absolute column count. if count bigger than Dashboard.rows -> height will be set to Dashboard.rows
                 */
                let height = "1/3";
                // starting row index
                let row = 0;
                // starting column index
                let col = 0;

                let _move = { x: null, y: null };
                // style class identifier
                let _id = 'item-' + Math.random().toString().substr( 2 );

                let _selected = false;

                /**
                 *
                 * @param _style
                 * @returns {*}
                 */
                this.render = (_style) => {
                    function _handleMove(e) {

                        function initPosition() {
                            positionLeft = col * self.dashboard.cell.width;
                            positionTop = row * self.dashboard.cell.height;
                            positionNewLeft = positionLeft - (_move.x - e.x);
                            positionNewTop = positionTop - (_move.y - e.y);
                            cols = +itemSelf.width;
                            rows = +itemSelf.height;
                        }

                        let positionLeft, positionTop, positionNewLeft, positionNewTop, cols, rows;

                        let state = e.type;

                        if ( state === 'dragstart' ) {
                            _move.x = e.x;
                            _move.y = e.y;
                        }

                        if ( state === 'drag' && ( e.x !== 0 && e.y !== 0 ) ) {
                            initPosition();
                            let position = getClosestPosition(positionNewLeft, positionNewTop, rows, cols);

                            // Check for overlaps if enabled.
                            if (!_isOverlapping(position.col, position.row, cols, rows)) {
                                [ ..._style.sheet.cssRules ].forEach((cssRule, i) => {
                                    if (cssRule.selectorText === '#' + _id)
                                        _style.sheet.deleteRule(i);
                                });

                                _style.sheet.insertRule('#' + _id + ' {' +
                                    'width: ' + ( itemSelf.width * self.dashboard.cell.width ) + 'px;' +
                                    'height: ' + ( itemSelf.height * self.dashboard.cell.height ) + 'px;' +
                                    'left: ' + ( position.col * self.dashboard.cell.width )  + 'px;' +
                                    'top: ' + ( position.row * self.dashboard.cell.height ) + 'px;' +
                                    '}');

                                this.parentNode.setAttribute('row', position.row);
                                this.parentNode.setAttribute('col', position.col);
                            }
                        }

                        if ( state === 'dragend' ) {
                            initPosition();
                            let position = getClosestPosition(positionNewLeft, positionNewTop, rows, cols);

                            col = position.col;
                            row = position.row;

                            // Check for overlaps if enabled.
                            if (!_isOverlapping(position.col, position.row, cols, rows)) {
                                [ ..._style.sheet.cssRules ].forEach((cssRule, i) => {
                                    if (cssRule.selectorText === '#' + _id)
                                        _style.sheet.deleteRule(i);
                                });
                                _style.sheet.insertRule('#' + _id + ' {' +
                                    'width: ' + ( itemSelf.width * self.dashboard.cell.width ) + 'px;' +
                                    'height: ' + ( itemSelf.height * self.dashboard.cell.height ) + 'px;' +
                                    'left: ' + ( col * self.dashboard.cell.width )  + 'px;' +
                                    'top: ' + ( row * self.dashboard.cell.height ) + 'px;' +
                                    '}');
                                this.parentNode.setAttribute('row', position.row);
                                this.parentNode.setAttribute('col', position.col);
                            }
                        }

                    }

                    /**
                     * Find the closest player position (column and row as indexes) for the given X and Y.
                     * @param {number} x position in pixels on X screen axis.
                     * @param {number} y position in pixels on Y screen axis.
                     * @param {number} [rows=1] indicates the height in grid units of the player being positioned. This ensure the returned position take into account the size of the player.
                     * @param {number} [cols=1] indicates the width in grid units of the player being positioned. This ensure the returned position take into account the size of the player.
                     * @param {boolean} [floorHalf=false] Tells whether we need to floor or ceil when the value is half (e.g. 1.5, 3.5, 12.5, ...).
                     * @returns {{col: number, row: number}} The closest position as an object with a `row` and `col` properties.
                     */
                    function getClosestPosition(x, y, rows = 1, cols = 1, floorHalf = false) {
                        let position;
                        let colRatio = x / self.dashboard.cell.width;
                        let rowRatio = y / self.dashboard.cell.height;

                        if (floorHalf) {
                            position = {
                                // Depending on which resize gripper (direction = top or left, or both) is used,
                                // we wants to floor the half distance in the proper direction, to finally fall in the desired cell.
                                col : colRatio % 0.5 === 0 ? Math.floor(colRatio) : Math.round(colRatio),
                                row : rowRatio % 0.5 === 0 ? Math.floor(rowRatio) : Math.round(rowRatio)
                            };
                        } else {
                            position = {
                                col : Math.round(colRatio),
                                row : Math.round(rowRatio)
                            };
                        }

                        // Ensure we are falling into the grid.
                        // Min = 0.
                        // Max = grid size - player size.
                        return {
                            col: Math.max(Math.min(position.col, self.dashboard.cols - cols), 0),
                            row: Math.max(Math.min(position.row, self.dashboard.rows - rows), 0)
                        }

                    }

                    /**
                     * Extract the position attributes (`row`, `col`) and size attributes (`width`, `height`) of the given tile element.
                     * @param {HTMLElement} item Item to read attributes from.
                     * @returns {{col: number, row: number, width: number, height: number}} The position and size of the given tile as raw object.
                     */
                    function getCoordinates(item) {
                        return {
                            row:    +item.getAttribute('row'),
                            col:    +item.getAttribute('col'),
                            width:  +item.getAttribute('width'),
                            height: +item.getAttribute('height')
                        }
                    }

                    /**
                     * Checks for overlaps with other tiles.
                     * @param {Number} col
                     * @param {Number} row
                     * @param {Number} width
                     * @param {Number} height
                     * @return {Boolean|Element} Returns either `false` if no overlap is found or the overlapping element itself.
                     * @private
                     */
                    function _isOverlapping(col, row, width, height) {
                        let overlap = false;
                        [ ...self.element.children ].forEach((child, i) => {
                            if (child.id === _id || child.classList.contains('placeholder'))
                                return;
                            else {
                                let childCoords = getCoordinates(child);

                                if(
                                    col <= (childCoords.col + childCoords.width) &&
                                    row <= (childCoords.row + childCoords.height) &&
                                    (col + width) >= childCoords.col &&
                                    (row + height) >= childCoords.row
                                ) {
                                    overlap = child;
                                    return;
                                }
                            }
                        });

                        return overlap;
                    }


                    _style.sheet.insertRule(
                        '#' + _id + ' {' +
                        '   width: ' + (itemSelf.width * self.dashboard.cell.width) + 'px;' +
                        '   height: ' + (itemSelf.height * self.dashboard.cell.height) + 'px;' +
                        '   left: ' + (col * self.dashboard.cell.width)  + 'px;' +
                        '   top: ' + (row * self.dashboard.cell.height)  + 'px;' +
                        '}'
                    );

                    return $.html( {
                        id: _id,
                        inner: [
                            {
                                tag: 'header',
                                draggable: true,
                                inner: [
                                    title,
                                    {
                                        tag: 'span',
                                        class: 'item-control',
                                        inner: '<span>&ctdot;</span><span>&times;</span>'
                                    }
                                ],
                                ondragstart: _handleMove,
                                ondrag: _handleMove,
                                ondragend: _handleMove
                            },
                            {
                                tag: 'section',
                                inner: content // @TODO logic for ccm-app embedding, functional, so on
                            },
                            {
                                class: 'handles',
                                inner: [
                                    {
                                        tag: 'span'
                                    },
                                    {
                                        tag: 'span'
                                    },
                                    {
                                        tag: 'span'
                                    },
                                    {
                                        tag: 'span'
                                    },
                                    {
                                        tag: 'span'
                                    },
                                    {
                                        tag: 'span'
                                    },
                                    {
                                        tag: 'span'
                                    },
                                    {
                                        tag: 'span'
                                    }
                                ]
                            }
                        ]
                    } );
                };

                Object.defineProperties(this, {
                    width: {
                        get: () => {
                            if ( typeof width === 'string' ) {
                                if ( width.indexOf( '/' ) !== -1 ) {
                                    if ( width.indexOf( '/' ) === 0)
                                        return self.dashboard.cols / Number.parseInt( width.substr( width.indexOf( '/' ) + 1 ) );
                                    else
                                        return self.dashboard.cols
                                            * Number.parseInt( width.substr( 0, width.indexOf( '/' ) ) )
                                            / Number.parseInt( width.substr( width.indexOf( '/' ) + 1 ) );
                                }
                                else if ( Number.parseFloat(width) != NaN )
                                    return Number.parseFloat(width) * self.dashboard.cols;
                                else
                                    return self.dashboard.cols;
                            }
                            else if ( Number.isInteger( width ) )
                                return width < self.dashboard.cols ? width : self.dashboard.cols;
                        },
                        set: value => width = value
                    },
                    height: {
                        get: () => {
                            if ( typeof height === 'string' ) {
                                if ( height.indexOf( '/' ) !== -1 ) {
                                    if ( height.indexOf( '/' ) === 0)
                                        return self.dashboard.rows / Number.parseInt( height.substr( height.indexOf( '/' ) + 1 ) );
                                    else
                                        return self.dashboard.rows
                                            * Number.parseInt( height.substr( 0, height.indexOf( '/' ) ) )
                                            / Number.parseInt( height.substr( height.indexOf( '/' ) + 1 ) );
                                }
                                else if ( Number.parseFloat(height) != NaN )
                                    return Number.parseFloat(height) * self.dashboard.rows;
                                else
                                    return self.dashboard.rows;
                            }
                            else if ( Number.isInteger( height ) )
                                return height < self.dashboard.rows ? height : self.dashboard.rows;
                        },
                        set: value => height = value },
                    col: { get: () => col, set: value => col = value },
                    row: { get: () => row, set: value => row = value },
                    name: { get: () => title },
                    id: { get: () => _id },
                    move: { get: () => _move, set: value => _move = value },
                    selected: { get: () => _selected, set: value => _selected = value }
                });
            }
            
            function Utils() {
                // removes ccm loading icon
                this.removeLoading = () => {
                    if (self.element.querySelector('.ccm_loading'))
                        self.element.removeChild(self.element.querySelector('.ccm_loading'));

                    if (self.element.parentNode.querySelector('#ccm_keyframe'))
                        self.element.parentNode.removeChild(self.element.parentNode.querySelector('#ccm_keyframe'));
                };

                // add styles
                this.addStyles = () => {
                    const style = document.createElement( 'style' );
                    style.setAttribute('type','text/css');
                    self.element.parentNode.insertBefore(style, self.element) ;

                    // allow relative positioning in component wrapper (div#element)
                    style.sheet.insertRule(
                        'div#element { ' +
                        '   position: relative;' +
                        '}'
                    );

                    // define item header style
                    style.sheet.insertRule(
                        'header {' +
                        '    font-family: Helvetica, Arial, Geneva, sans-serif;' +
                        '    margin: 3px;' +
                        '    padding: 3px;' +
                        '    border-bottom: 1px solid rgb(95, 87, 90);' +
                        '    cursor: grab;' +
                        '}'
                    );

                    // define item header control style
                    style.sheet.insertRule(
                        'span.item-control {' +
                        '    margin-left: 7px;' +
                        '    float: right;' +
                        '    font-weight: bold;' +
                        '}'
                    );

                    // define item section/content style
                    style.sheet.insertRule(
                        'section {' +
                        '    margin: 3px;' +
                        '    padding: 3px;' +
                        '}'
                    );

                    // define item style
                    style.sheet.insertRule(
                        'div[id^="item-"] {' +
                        '    position: absolute !important;' +
                        '    border: 1px solid rgb(225, 217, 220);' +
                        '    box-shadow: 1px 4px 6px rgba(0,0,0,.2);' +
                        '    background-color: white;' +
                        '    margin: 3px;' +
                        '    color: rgb(95, 87, 90)' +
                        '}'
                    );


                    return style;
                };

                // resize observer
                this.addElementResizeListener = () => {
                    if (ResizeObserver) { // not available on Safari, FF(Android), IE or EDGE
                        let rs = new ResizeObserver(en => {
                            console.log(en)
                        });

                        // rs.observe(self.element)
                    }
                }

            }

        }

    };

    let b='ccm.'+component.name+(component.version?'-'+component.version.join('.'):'')+'.js';if(window.ccm&&null===window.ccm.files[b])return window.ccm.files[b]=component;(b=window.ccm&&window.ccm.components[component.name])&&b.ccm&&(component.ccm=b.ccm);'string'===typeof component.ccm&&(component.ccm={url:component.ccm});let c=(component.ccm.url.match(/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/)||['latest'])[0];if(window.ccm&&window.ccm[c])window.ccm[c].component(component);else{var a=document.createElement('script');document.head.appendChild(a);component.ccm.integrity&&a.setAttribute('integrity',component.ccm.integrity);component.ccm.crossorigin&&a.setAttribute('crossorigin',component.ccm.crossorigin);a.onload=function(){window.ccm[c].component(component);document.head.removeChild(a)};a.src=component.ccm.url}

} )();