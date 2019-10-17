/**
 * @overview <ccm-panels> css grid based implementation of module-tabbed pattern
 * @author Michael Nutzenberger <michael.nutzenberger@smail.inf.h-brs.de> 2019
 * @license The MIT License (MIT)
 * @version latest (0.0.1)
 */
( function () {
    const component = {

        name: 'panels',

        ccm: 'https://ccmjs.github.io/ccm/ccm.min.js',

        config: {

            /*
            panels: [
                { name: 'ELK-Monitoring-Functional-1', inner: [ 'ccm.component', '../ccm-dashboard/ccm.dashboard.js' ] },
                { name: 'ELK-Monitoring-Functional-2', inner: [ 'ccm.component', '../ccm-dashboard/ccm.dashboard.js' ] }
            ],
            */

            /* list of components to register
            components: [
                [ 'ccm.component', '../ccm-dashboard/ccm.dashboard.js' ]
            ],
            */
            css: [ 'ccm.load', './resources/default.css' ]

        },

        Instance: function () {

            const self = this,
                NAVIGATION = new Navigation(),
                CONTENT = new Content(),
                UTILS = new Utils();
            let $, MAIN, NAV;

            this.init = async () => {
                // set shortcut to help functions
                $ = self.ccm.helper;

                // support declarative way for defining widgets within grid -> higher priority than in config defined panels
                evaluateLightDOM();

                /** finds Custom Component Elements for generating widgets */
                function evaluateLightDOM() {
                    // no Light DOM? => skip
                    if ( !self.inner ) return;

                    const panels = [];

                    // iterate over all children of Light DOM to search for panel tags
                    [ ...self.inner.children ].forEach( _element => {

                        let _name = _element.getAttribute('name') || 'panel-' + panels.length;

                        panels.push({
                            name: _name,
                            inner: _element
                        });

                    });

                    // has founded item data sets? => use them for grid (with higher priority)
                    // @debug start @TODO later, remove following debug section
                    if ( panels.length > 0 && Array.isArray( self.panels ) )
                        self.panels = self.panels.concat(panels);
                    else if ( panels.length > 0 ) self.panels = panels;
                    // @debug end

                    // @TODO uncomment this, cause standard behavior: declarative embedding components should have higher priority than functional
                    // if ( panels.length > 0 ) self.panels = panels;
                }

            };

            this.start = async () => {

                let utils = new Utils();

                // remove dashboard instance loading icon
                utils.removeLoading();

                await self.render();

                // add styles
                utils.addStyles();

            };

            /**
             * @info this will render first tab/content
             */
            this.render = async () => {
                let html = [
                    {
                        tag: 'nav',
                        inner: {
                            tag: 'ul'
                        }
                    },
                    {
                        tag: 'main'
                    }
                ];
                $.setContent( self.element, $.html( html ) );

                // render navigation tabs
                NAVIGATION.render( self.element.querySelector( 'nav ul' ) );

                // render content
                await CONTENT.render( self.element.querySelector( 'main' ) );
            };

            function Navigation () {
                let __root;

                this.render = node => {
                    if ( node )
                        __root = node;

                    if ( !__root )
                        console.error( 'no navigation node given!' );

                    let _list = [];

                    if ( !self.panels )
                        return _list;

                    [ ...self.panels ].forEach( (panel, i) => {
                        _list.push({
                            'tag': 'li',
                            'class': i === 0 ? 'active' : 'switch',
                            'inner': {
                                'tag': 'a',
                                'href': '#',
                                'inner': panel.name + ' &times;',
                            },
                            'onclick': async function (ev) { /* switch panel click */
                                await CONTENT.render(null, panel, this);
                            }

                        });
                    });

                    $.setContent( __root, $.html( _list ) );
                };

                this.switch = tab => {
                    if ( !tab )
                        tab = __root.querySelector( 'li.active' );
                    __root.querySelector( 'li.active' ).classList.remove( 'active' );
                    tab.classList.remove('switch');
                    tab.classList.add('active');
                };
            }

            function Content() {
                let __root;

                /**
                 * @param node
                 * @param content
                 * @param tab
                 * @returns {Promise<void>}
                 */
                this.render = async ( node, content, tab ) => {
                    if ( node )
                        __root = node;

                    if ( !__root )
                        console.error( 'no main/content node given!' );

                    if ( !content ) {
                        console.log( 'content not given - choose first tab!' );
                        if ( !Array.isArray(self.panels) || self.panels.length < 1) {
                            console.error( 'there are no panels-list / panels-list is empty' );
                            return;
                        }
                        content = self.panels[0];
                    }

                    if ( $.isComponent( content.inner ) ) { // functional embedding of an registered component
                        console.info( 'isComponent!!' );
                        let instance = await content.inner.instance();
                        $.setContent( __root, instance.root );
                        await instance.start();
                    }
                    else if ( $.isInstance( content.inner ) ) {  // functional embedding of an instanced component
                        console.info( 'isInstance!!' );
                        $.setContent( __root, content.inner.root );
                        await content.inner.start();
                    }
                    else { // declarative embedding -> elements were interpreted at initialising ccm.panels by evaluateLightDOM()
                        console.info( 'declarative embedding!!' );
                        $.setContent( __root, $.html( content.inner ) );
                    }
                    NAVIGATION.switch( tab );
                };
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
                    // style.id = 'ccm-panels'; // add if you want to remove it at runtime
                    style.setAttribute('type','text/css');
                    style.appendChild( document.createTextNode('') );
                    self.element.parentNode.insertBefore(style, self.element) ;

                    style.sheet.insertRule(
                        'div#element { ' +
                        'display: grid!important;' +
                        'grid-template-rows: 35px 1fr;' +
                        'grid-template-areas: \'nav\' \'main\'!important;' +
                        'height: 98vh;' +
                        'grid-gap: 0!important; ' +
                        'font-family: Helvetica, Arial, Geneva, sans-serif;' +
                        'color: red;' +
                        '}'
                    );
                    style.sheet.insertRule(
                        'main { ' +
                        '  height: ' + self.element.querySelector( 'main' ).getBoundingClientRect().height + 'px;' +
                        '}'
                    );
                };
            }

        }

    };

    let b='ccm.'+component.name+(component.version?'-'+component.version.join('.'):'')+'.js';if(window.ccm&&null===window.ccm.files[b])return window.ccm.files[b]=component;(b=window.ccm&&window.ccm.components[component.name])&&b.ccm&&(component.ccm=b.ccm);'string'===typeof component.ccm&&(component.ccm={url:component.ccm});let c=(component.ccm.url.match(/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/)||['latest'])[0];if(window.ccm&&window.ccm[c])window.ccm[c].component(component);else{var a=document.createElement('script');document.head.appendChild(a);component.ccm.integrity&&a.setAttribute('integrity',component.ccm.integrity);component.ccm.crossorigin&&a.setAttribute('crossorigin',component.ccm.crossorigin);a.onload=function(){window.ccm[c].component(component);document.head.removeChild(a)};a.src=component.ccm.url}
} )();