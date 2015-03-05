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
        dataframe:{
            index: ['id']
        },
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
                filepath: '',
                file_type: '',
                file_settings: {}
            },
            data: {
                ra_name: 'ra',
                dec_name: 'dec',
                id_name: 'id',
                min_sep: {
                    wcs: [1,'arcsec'],
                    px: 5
                }
            }
        },
        changes: [],
        selected: undefined,
        selected_marker: undefined
    }, options);
    
    this.update(options);
    this.markers = [];
};
Toyz.Astro.Catalog.Catalog.prototype.update = function(update){
    var redraw_catalog = false;
    if(update.hasOwnProperty('dataframe')){
        // Create the dataframe if it doesn't exist yet
        if(!this.hasOwnProperty('dataframe')){
            if(!update.dataframe.hasOwnProperty('index')){
                if(update.hasOwnProperty('ra_colname')){
                    this.ra_colname = update.ra_colname;
                };
                if(update.hasOwnProperty('dec_colname')){
                    this.dec_colname = update.dec_colname;
                };
                update.index = [this.ra_colname, this.dec_colname];
            };
            this.dataframe = new Toyz.Core.Dataframe(update.dataframe);
        }else{
            this.dataframe.update(update.dataframe);
        };
        redraw_catalog = true;
        delete update.dataframe;
    };
    if(update.hasOwnProperty('settings')){
        this.settings = $.extend(true, this.settings, update.settings);
        if(update.settings.hasOwnProperty('marker')){
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
        //this.$viewer = update.viewer.frames[update.viewer.viewer_frame].$viewer;
        update.viewer.$tile_div.append(this.$viewer);
        this.file_info = update.viewer.frames[update.viewer.viewer_frame].file_info;
        this.img_info = this.file_info.images[this.file_info.frame];
        console.log('viewer dims',this.$viewer.width(), this.$viewer.height());
    };
    for(var u in update){
        this[u] = update[u];
    };
    // If the catalog data or marker properties have been changed, redraw the catalog
    if(redraw_catalog==true){
        if(this.hasOwnProperty('$viewer') && this.$viewer!==undefined){
            this.redraw();
        };
    };
    console.log('catalog after update', this);
};
Toyz.Astro.Catalog.Catalog.prototype.add_src = function(src_info){
    // get rid of any fields not in the catalogs columns
    for(var prop in src_info){
        if(this.dataframe.columns.indexOf(prop)<0){
            delete src_info[prop];
        };
    };
    this.changes.push({
        action: 'add_src',
        info: src_info
    });
    this.dataframe.add_row(src_info);
    this.mark_src(src_info);
    console.log('catalog after add', this);
    console.log('changes:', this.changes);
};
Toyz.Astro.Catalog.Catalog.prototype.delete_src = function(row_ids){
    this.changes.push({
        action: 'delete_src',
        info: row_ids
    });
    this.dataframe.delete_row(row_ids);
    console.log('catalog after delete', this);
    console.log('changes:', this.changes);
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
    console.log('img_info', img_info);
    console.log('src_info', src_info);
    console.log('xy', xy);
    console.log('width', width);
    console.log('radius', radius);
    var $circle = Toyz.Viewer.DrawingTools.draw_circle(
        this.$viewer,
        xy[0]-width, // the extra 10 is for the padding from the tile border
        xy[1]-width, // the extra 10 is for the padding from the tile border
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
    this.markers.push(src_marker);
    $circle.click(function(src){
        if(this.viewer.tools.active_tool=='select_star'){
            this.select_src(src);
        };
    }.bind(this, src_marker));
    return $circle;
};
Toyz.Astro.Catalog.Catalog.prototype.refresh = function(){
    this.viewer.$tile_div.append(this.$viewer);
};
Toyz.Astro.Catalog.Catalog.prototype.redraw = function(){
    this.$viewer.empty()
    this.viewer.$tile_div.append(this.$viewer);
    for(var i=0; i<this.dataframe.data.length; i++){
        row = this.dataframe.get_row(i);
        this.mark_src(row);
    };
};
Toyz.Astro.Catalog.Catalog.prototype.select_src = function(src){
    if(this.selected!==undefined && this.selected.id==src.src_info.id){
        console.log('selected', this.selected.id);
        console.log('src', src.src_info.id);
        console.log('matched');
        this.$selected_marker.remove();
        this.selected = undefined;
        return;
    }else if(this.selected!==undefined){
        console.log('selected', this.selected.id);
        console.log('src', src.src_info.id);
        this.$selected_marker.remove();
    };
    this.selected = src;
    this.$selected_marker = this.mark_src(src.src_info, {
        line_width: 2*this.settings.web.marker.line_width
    });
};
Toyz.Astro.Catalog.Catalog.prototype.delete_src = function(selected){
    this.changes.push({
        action: 'delete_src',
        info: selected.src_info
    });
    //this.dataframe.delete_row(selected.src_info.id);
    selected.$circle.remove();
    this.$selected_marker.remove();
    this.selected = undefined;
};

Toyz.Astro.Catalog.Dialog = function(options){
    options = $.extend(true, {
        dialog: {},
        controls: {}
    }, options);
    this.$div = $('<div/>');
    this.cat_index = 0;
    this.catalogs = [];
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
                                var cat_name = 'cat-'+this.catalogs.length;
                                // Create new Catalog
                                var catalog = new Toyz.Astro.Catalog.Catalog({
                                    name: cat_name,
                                    cid: cat_name,
                                    dataframe: {
                                        columns: ['id','ra','dec','x','y'],
                                        index: ['id'],
                                        data: []
                                    },
                                    viewer: this.viewer
                                });
                                this.catalogs.push(catalog);
                                new_item.cid = cat_name;
                                this.cat_index = this.catalogs.length-1;
                                // Update dialog parameters
                                new_item.params.cat_name.$input.val(cat_name);
                                new_item.params.colorpicker.$input = $('<input/>')
                                    .prop('type','text');
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
                                this.workspace.websocket.send_task({
                                    task: {
                                        module: 'astrotoyz.tasks',
                                        task: 'create_catalog',
                                        parameters: {
                                            settings: catalog.settings,
                                            cid: catalog.cid,
                                            dataframe: catalog.dataframe,
                                            name: catalog.name
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
    //console.log('selected param', param);
    for(var i=0; i<this.catalogs.length; i++){
        if(this.catalogs[i].cid==param.cid){
            return this.catalogs[i];
        }
    };
    return undefined;
};