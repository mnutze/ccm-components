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

            };

            this.ready = async () => { console.log( 'dashboard: READY' ) };

            this.start = async () => {

                console.info('start', self.element);

                // remove ccm loading icon
                utils.removeLoading();

                // add styles
                utils.addStyles();

                // add dashboard resize listener
                utils.addElementResizeListener();

                new Dashboard();
            };

            function Dashboard() {

                let cellSize = 10; // a square cell. in px

                if (self['cell-size'])
                    cellSize = self['cell-size'];
                else if (self.grid && self.grid.cell && self.grid.cell.size)
                    cellSize = self.grid.cell.size;

                let gridWidth = self.element.getBoundingClientRect().width;
                let gridHeight = self.element.getBoundingClientRect().height;

                console.log(gridHeight, gridWidth, cellSize)

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
                    style.sheet.insertRule(
                        'div#element { ' +
                        '   position: relative;' +
                        '}'
                    );
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

    //
    let b = 'ccm.' + component.name + (component.version ? '-' + component.version.join('.') : '') + '.js';
    if (window.ccm && null === window.ccm.files[b])
        return window.ccm.files[b] = component;
    (b = window.ccm && window.ccm.components[component.name]) && b.ccm && (component.ccm = b.ccm);
    'string' === typeof component.ccm && (component.ccm = {
        url: component.ccm
    });
    let c = (component.ccm.url.match(/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/) || ['latest'])[0];
    if (window.ccm && window.ccm[c])
        window.ccm[c].component(component);
    else {
        var a = document.createElement('script');
        document.head.appendChild(a);
        component.ccm.integrity && a.setAttribute('integrity', component.ccm.integrity);
        component.ccm.crossorigin && a.setAttribute('crossorigin', component.ccm.crossorigin);
        a.onload = function() {
            window.ccm[c].component(component);
            document.head.removeChild(a)
        };
        a.src = component.ccm.url
    }

} )();