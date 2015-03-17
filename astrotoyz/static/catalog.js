// Classes and functions for point source catalogs
// Copyright 2015 by Fred Moolekamp
// License: LGPLv3

// Define namespace to avoid collisions
Toyz.namespace('Toyz.Astro.Catalog');

// Default parameters for catalog colorpicker
Toyz.Astro.Catalog.colorpicker_defaults = function(options){
    options = $.extend(true,{
        color: "#FFF",
        showInput: true,
        className: "full-spectrum",
        showInitial: true,
        showPalette: true,
        showSelectionPalette: true,
        maxPaletteSize: 10,
        preferredFormat: "hex",
        localStorageKey: "spectrum.demo",
        move: function (color) {},
        show: function () {},
        beforeShow: function () {},
        hide: function () {},
        change: function() {},
        palette: [
            ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)",
            "rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
            ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", 
            "rgb(0, 255, 0)","rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", 
            "rgb(153, 0, 255)", "rgb(255, 0, 255)"], 
            ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", 
            "rgb(255, 242, 204)", "rgb(217, 234, 211)", "rgb(208, 224, 227)", 
            "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", 
            "rgb(234, 209, 220)", "rgb(221, 126, 107)", "rgb(234, 153, 153)", 
            "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)", 
            "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", 
            "rgb(180, 167, 214)", "rgb(213, 166, 189)", "rgb(204, 65, 37)", "rgb(224, 102, 102)", 
            "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)", 
            "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", 
            "rgb(142, 124, 195)", "rgb(194, 123, 160)", "rgb(166, 28, 0)", "rgb(204, 0, 0)", 
            "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)", "rgb(69, 129, 142)", 
            "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
            "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", 
            "rgb(39, 78, 19)", "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", 
            "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
        ]
    }, options);
    return options;
};

Toyz.Astro.Catalog.Catalog = function(options){
    if(!options.hasOwnProperty('cid')){
        throw Error("A catalog must be initialized with a 'cid' field");
    };
    options = $.extend(true, {
        settings: {
            web: {
                visible: true,
                marker: {
                    shape: 'circle',
                    color: '#0000FF',
                    line_width: 2,
                    radius: 10
                }
            },
            file_info: {
                filepath:'',
                file_type:'',
                file_settings:{}
            }
        },
        changes: [],
        selected: undefined,
        selected_marker: undefined
    }, options);
    this.sources = [];
    this.markers = [];
    this.update(options);
    console.log('new catalog', this);
};
Toyz.Astro.Catalog.Catalog.prototype.update = function(update){
    console.log('update', update);
    var redraw_catalog = false;
    if(update.hasOwnProperty('settings')){
        this.settings = $.extend(true, this.settings, update.settings);
        if(update.settings.hasOwnProperty('web') && 
            update.settings.web.hasOwnProperty('marker')
        ){
            redraw_catalog = true;
        };
        delete update.settings;
    };
    if(update.hasOwnProperty('viewer')){
        this.$viewer = $('<div/>').css({
            position: 'absolute',
            top: '0px',
            left: '0px'
        })
        update.viewer.$tile_div.append(this.$viewer);
        this.file_info = update.viewer.frames[update.viewer.viewer_frame].file_info;
        this.img_info = this.file_info.images[this.file_info.frame];
    };
    for(var u in update){
        this[u] = update[u];
    };
    if(update.hasOwnProperty('sources')){
        for(var i=0; i<this.markers.length; i++){
            this.markers[i] = this.mark_src({
                id: update.sources[i][0],
                x: update.sources[i][1],
                y: update.sources[i][2]
            });
        };
    };
    console.log('catalog', this);
    // If the catalog data or marker properties have been changed, redraw the catalog
    if(redraw_catalog==true){
        if(this.hasOwnProperty('$viewer') && this.$viewer!==undefined){
            this.redraw();
        };
    };
    console.log('catalog after update', this);
    console.log('changes:', this.changes);
};
Toyz.Astro.Catalog.Catalog.prototype.select_src = function(src){
    if(this.selected!==undefined && this.selected.id==src.src_info.id){
        this.selected_marker.$circle.remove();
        this.selected = undefined;
        return;
    }else if(this.selected!==undefined){
        this.selected_marker.$circle.remove();
    };
    this.selected = src;
    this.selected_marker = this.mark_src(src.src_info, {
        line_width: 2*this.settings.web.marker.line_width
    });
};
Toyz.Astro.Catalog.Catalog.prototype.add_src = function(src_info){
    // get rid of any fields not in the catalogs columns
    this.changes.push({
        action: 'add_src',
        info: src_info
    });
    var marker = this.mark_src(src_info);
    this.markers.push(marker);
    //console.log('catalog after add', this);
    //console.log('changes:', this.changes);
};
Toyz.Astro.Catalog.Catalog.prototype.delete_src = function(selected){
    this.changes.push({
        action: 'delete_src',
        info: selected.src_info
    });
    selected.$circle.remove();
    this.selected_marker.$circle.remove();
    this.selected = undefined;
};
Toyz.Astro.Catalog.Catalog.prototype.mark_src = function(src_info, marker){
    var marker = $.extend(true, {}, this.settings.web.marker, marker);
    var file_info = this.viewer.frames[this.viewer.viewer_frame].file_info;
    var img_info = file_info.images[file_info.frame];
    var xy = this.viewer.get_viewer_coords(src_info.x, src_info.y, img_info);
    var radius = marker.radius;
    var width = marker.line_width
    if(img_info.scale>1){
        xy[0] = xy[0]-marker.radius*img_info.scale;
        xy[1] = xy[1]-marker.radius*img_info.scale;
        radius = radius * img_info.scale;
        width = width * img_info.scale;
    }else{
        xy[0] = xy[0]-marker.radius;
        xy[1] = xy[1]-marker.radius;
    };
    var $circle = Toyz.Viewer.DrawingTools.draw_circle(
        this.$viewer,
        xy[0]-width,
        xy[1]-width,
        radius,
        {
            css: {
                border: width.toString()+'px solid'+marker.color,
            },
            classes: [this.cid]
        }
    );
    var src_marker = {
        $circle: $circle,
        src_info: src_info
    };
    $circle.click(function(src){
        if(this.viewer.tools.active_tool=='select_star'){
            this.select_src(src);
        };
    }.bind(this, src_marker));
    return src_marker;
};
Toyz.Astro.Catalog.Catalog.prototype.refresh = function(){
    this.viewer.$tile_div.append(this.$viewer);
};
Toyz.Astro.Catalog.Catalog.prototype.redraw = function(){
    this.$viewer.empty()
    this.viewer.$tile_div.append(this.$viewer);
    for(var i=0; i<this.markers.length; i++){
        this.markers[i] = this.mark_src(this.markers[i].src_info);
        /*this.markers[i] = this.mark_src({
            id: this.markers[i][0],
            x: this.markers[i][1],
            y: this.markers[i][2]
        });*/
    };
};

Toyz.Astro.Catalog.Dialog = function(options){
    options = $.extend(true, {
        dialog: {},
        controls: {}
    }, options);
    this.$div = $('<div/>');
    this.cat_idx = 0;
    this.catalogs = {};
    this.workspace = options.workspace;
    this.viewer = options.viewer;
    var controls = $.extend(true, {
        type: 'div',
        params: {
            cat_div: {
                type: 'div',
                legend: 'Catalogs',
                params: {
                    catalogs: {
                        type: 'list',
                        format: 'list',
                        new_item: {
                            type: 'div',
                            params: {
                                visible: {
                                    input_class: 'astro-viewer-ctrl-visibility '+
                                        'astro-viewer-ctrl-visible',
                                    div_class: 'astro-viewer-catalog-ctrl',
                                    prop: {
                                        type: 'image',
                                        title: 'show/hide catalog in viewer',
                                        value: ''
                                    },
                                    func: {
                                        click: function(event){
                                            var $target = $(event.currentTarget);
                                            if($target.hasClass('astro-viewer-ctrl-visible')){
                                                $target.removeClass('astro-viewer-ctrl-visible');
                                                $target.addClass('astro-viewer-ctrl-invisible');
                                                this.get_current_catalog().update({
                                                    visible: false
                                                });
                                            }else{
                                                $target.removeClass('astro-viewer-ctrl-invisible');
                                                $target.addClass('astro-viewer-ctrl-visible');
                                                this.get_current_catalog().update({
                                                    visible: true
                                                });
                                            };
                                        }.bind(this)
                                    }
                                },
                                cat_name: {
                                    div_class: 'astro-viewer-catalog-ctrl',
                                    func: {
                                        change: function(event){
                                            this.get_current_catalog().update({
                                                name: event.currentTarget.value
                                            });
                                        }.bind(this)
                                    }
                                },
                                colorpicker: {
                                    type: 'custom',
                                    div_class: 'astro-viewer-catalog-ctrl'
                                }
                            },
                            init: function(new_item){
                                var cat_name = 'cat-'+this.cat_idx++;
                                // Create new Catalog
                                var catalog = new Toyz.Astro.Catalog.Catalog({
                                    name: cat_name,
                                    cid: cat_name,
                                    viewer: this.viewer
                                });
                                this.catalogs[cat_name] = catalog;
                                new_item.cid = cat_name;
                                // Update dialog parameters
                                new_item.params.cat_name.$input.val(cat_name);
                                new_item.params.colorpicker.$input = $('<input/>')
                                    .prop('type','text')
                                    .val(catalog.settings.web.marker.color);
                                new_item.$div.append(new_item.params.colorpicker.$input);
                                var defaults = Toyz.Astro.Catalog.colorpicker_defaults({
                                    change: function(color){
                                        this.get_current_catalog().update({
                                            color: color.toHex()
                                        })
                                    }.bind(this)
                                });
                                new_item.params.colorpicker.$input.spectrum(defaults);
                                // Add the catalog to the server (necessary to select sources,
                                // add/delete sources, and save the catalog)
                                console.log('catalog', catalog);
                                var file_info = $.extend(true,{},
                                    this.viewer.frames[this.viewer.viewer_frame].file_info);
                                file_info = {
                                    filepath: file_info.filepath,
                                    frame: file_info.frame
                                };
                                websocket.send_task({
                                    task: {
                                        module: 'astrotoyz.tasks',
                                        task: 'create_catalog',
                                        parameters: {
                                            settings: catalog.settings,
                                            cid: catalog.cid,
                                            name: catalog.name,
                                            file_info: file_info
                                        }
                                    },
                                    callback: function(catalog, result){
                                        console.log('result', result)
                                        catalog.update(result.cat_info)
                                    }.bind(this, catalog)
                                });
                            }.bind(this)
                        }
                    },
                }
            },
            marker: {
                type: 'conditional',
                legend: 'Marker',
                selector: {
                    marker_type: {
                        type: 'select',
                        options: ['circle', 'square']
                    }
                },
                param_sets: {
                    circle: {
                        type: 'div',
                        params: {
                            radius:{
                                lbl: 'radius',
                                prop: {
                                    type: 'Number',
                                    value: 10,
                                }
                            },
                            thickness: {
                                lbl: 'thickness',
                                prop: {
                                    type: 'Number',
                                    value: 2,
                                }
                            }
                        }
                    },
                    square: {
                        type: 'div',
                        params: {
                            width:{
                                lbl: 'width',
                                prop: {
                                    type: 'Number',
                                    value: 20,
                                }
                            },
                            thickness: {
                                lbl: 'thickness',
                                prop: {
                                    type: 'Number',
                                    value: 1,
                                }
                            }
                        }
                    }
                }
            },
            change_div: {
                type: 'div',
                legend: 'Changes',
                params: {
                    changes: {
                        type: 'list',
                        format: 'list',
                        new_item: {
                            entry: {
                                type: 'lbl'
                            }   
                        },
                        buttons: {}
                    }
                }
            }
        }
    }, options.controls);
    this.gui = new Toyz.Gui.Gui({
        params: controls,
        $parent: this.$div
    });
    this.$div.dialog($.extend(true, {
        resizable: true,
        draggable: true,
        autoOpen: false,
        modal: false,
        width: '300px',
        title: 'Catalogs',
        maxHeight: $(window).height(),
        position: {
            my: "left top",
            at: "left top",
            of: $(window)
        },
        buttons: {
            Save: function(){
                this.$div.dialog('close');
            }.bind(this),
            'Save as': function(){
                this.$div.dialog('close');
            }
        }
    },options.dialog)).css("font-size", "12px");
};
Toyz.Astro.Catalog.Dialog.prototype.update = function(update){
    for(var u in update){
        this[u] = update[u];
    };
};
Toyz.Astro.Catalog.Dialog.prototype.get_current_catalog = function(){
    var param = this.gui.params.catalogs.get_selected_param();
    return this.catalogs[param.cid];
    //console.log('selected param', param);
    /*for(var i=0; i<this.catalogs.length; i++){
        if(this.catalogs[i].cid==param.cid){
            return this.catalogs[i];
        }
    };
    return undefined;*/
};