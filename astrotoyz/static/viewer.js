// Wrapper for Toyz viewer to enable astronomy tools
// Copyright 2015 by Fred Moolekamp
// License: LGPLv3

// Define namespace to avoid collisions
Toyz.namespace('Toyz.Astro.Viewer');

// Check to see if all of the API's dependencies have loaded
// If not, return false
Toyz.Astro.Viewer.dependencies_loaded = function(){
    return false;
};
// Load any dependencies of the tile
Toyz.Astro.Viewer.load_dependencies = function(callback){
    // Check to see if ace loaded from the server
    if(!Toyz.Astro.Viewer.dependencies_loaded()){
        console.log('Loading Template dependencies');
        Toyz.Core.load_dependencies(
            {
                js:[
                    "/toyz/static/astrotoyz/astro.js",
                    "/toyz/static/astrotoyz/catalog.js",
                    "/toyz/static/astrotoyz/spectrum.js", // 3rd party color picker
                ],
                css: [
                    "/toyz/static/astrotoyz/astro.css",
                    "/toyz/static/astrotoyz/spectrum.css"
                ]
            },
            function(){
                console.log('Astro-Toyz Viewer dependencies loaded');
                callback();
            }
        );
    };
};

Toyz.Astro.Viewer.Controls = function(options){
    this.physical_coords = {
        type: 'lbl',
        lbl: 'Physical Coords: ',
        input_class: 'viewer-ctrl-info-btn viewer-ctrl-info-coord-div',
        events: {
            mousemove: function(event){
                var ctrls = this.ctrl_panel.gui.params;
                var $input = ctrls.physical_coords.$input;
                var file_info = this.frames[this.viewer_frame].file_info;
                if(file_info!==undefined && file_info.hasOwnProperty('frame') &&
                    file_info.images[file_info.frame].hasOwnProperty('height')
                ){
                    var img_info = file_info.images[file_info.frame];
                    var xy = this.extract_coords(event, img_info);
                    var x = xy[0]/img_info.scale;
                    var y = xy[1]/img_info.scale;
                    if(img_info.hasOwnProperty('coord_range')){
                        x = x + img_info.coord_range.x[0];
                        y = y + img_info.coord_range.y[0];
                    };
                    var coords = 
                        (Math.round(x*10)/10).toString()+','
                        +(Math.round(y*10)/10).toString();
                    $input.text(coords);
                };
            }.bind(options.parent)
        }
    };
    this.ra = {
        type: 'lbl',
        lbl: 'RA: ',
        input_class: 'viewer-ctrl-info-btn viewer-ctrl-info-coord-div',
        events: {
            rx_datapoint: function(event){
                var ra;
                if(!isNaN(event.ra) && !isNaN(event.dec)){
                    var wcs = new Toyz.Astro.Utils.World(event.ra, event.dec);
                    ra = wcs.get_ra();
                }else{
                    ra = '';
                };
                this.ctrl_panel.gui.params.ra.$input.text(ra);
            }.bind(options.parent)
        }
    };
    this.dec = {
        type: 'lbl',
        lbl: 'DEC: ',
        input_class: 'viewer-ctrl-info-btn viewer-ctrl-info-coord-div',
        events: {
            rx_datapoint: function(event){
                var dec;
                if(!isNaN(event.ra) && !isNaN(event.dec)){
                    var wcs = new Toyz.Astro.Utils.World(event.ra, event.dec);
                    dec = wcs.get_dec();
                }else{
                    dec = '';
                };
                this.ctrl_panel.gui.params.dec.$input.text(dec);
            }.bind(options.parent)
        }
    };
    this.wcs_align = {
        input_class: 'viewer-ctrl-button viewer-ctrl-viewer-btn astro-viewer-ctrl-align',
        func: {
            click: function(){
                var viewer_frame = this.viewer_frame;
                var file_info = $.extend(true, {}, this.frames[viewer_frame].file_info);
                var img_info = $.extend(true, {}, file_info.images[file_info.frame]);
                delete file_info.images;
                delete img_info.tiles;
                console.log('viewer_frame,x,y', 
                    viewer_frame,img_info.viewer.x_center,img_info.viewer.y_center);
                    console.log('viewer filepath', file_info.filepath);
                this.workspace.websocket.send_task({
                    task: {
                        module: 'astrotoyz.tasks',
                        task: 'get_img_data',
                        parameters: {
                            file_info: file_info,
                            img_info: img_info,
                            x: img_info.viewer.x_center,
                            y: img_info.viewer.y_center,
                            data_type: 'datapoint'
                        }
                    },
                    callback: function(viewer_frame, scale, result){
                        console.log('img_data result:', result);
                        for(var i=0; i< this.frames.length; i++){
                            if(i!=viewer_frame){
                                console.log('i', i);
                                console.log('viewer frame', viewer_frame);
                                var file_info = $.extend(true, {}, 
                                    this.frames[i].file_info);
                                var img_info = $.extend(true, {}, 
                                    file_info.images[file_info.frame]);
                                    console.log('frame filepath', file_info.filepath);
                                if(img_info.scale!=scale){
                                    this.set_scale(i, scale);
                                };
                                this.workspace.websocket.send_task({
                                    task:{
                                        module: 'astrotoyz.tasks',
                                        task: 'wcs2px',
                                        parameters: {
                                            file_info: file_info,
                                            img_info: img_info,
                                            ra: result.ra,
                                            dec: result.dec
                                        },
                                    },
                                    callback: function(viewer_frame, result){
                                        console.log('i viewerframe', viewer_frame);
                                        console.log('wcs2px result', result);
                                        var file_info = this.frames[viewer_frame].file_info;
                                        var img_info = file_info.images[file_info.frame];
                                        var left = result.x-Math.round(img_info.viewer.width/2);
                                        var top = result.y-Math.round(img_info.viewer.height/2);
                                        console.log('left', left, 'top', top);
                                        this.set_window(viewer_frame, left, top);
                                        console.log('new center', 
                                            img_info.viewer.x_center, img_info.viewer.y_center);
                                    }.bind(this, i)
                                });
                                console.log('sent');
                            };
                        };
                    }.bind(this, viewer_frame, img_info.scale)
                })
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'align images based on wcs',
            value: ''
        },
    };
    this.hist = {
        input_class: 'viewer-ctrl-button viewer-ctrl-tools-btn viewer-ctrl-tools-hist',
        func: {
            click: function(event){
                this.change_active_tool('hist', event.currentTarget);
                Toyz.Workspace.load_api_dependencies(
                    'highcharts',
                    'Toyz.API.Highcharts',
                    '/static/web/static/api/highcharts.js',
                    function(){
                        if(!this.hasOwnProperty('hist_dialog')){
                            var file_info = this.frames[this.viewer_frame].file_info;
                            var img_info = file_info.images[file_info.frame];
                            this.hist_dialog = new Toyz.Astro.Viewer.HistogramDialog({
                                parent: this,
                                cursor: {
                                    x: img_info.x_center,
                                    y: img_info.y_center
                                }
                            })
                        };
                    }.bind(this)
                )
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'get histogram',
            value: ''
        },
        events: {
            mousedown: function(event){
                if(this.tools.active_tool=='hist'){
                    var file_info = this.frames[this.viewer_frame].file_info;
                    var img_info = file_info.images[file_info.frame];
                    var x = event.target.offsetLeft+event.offsetX;
                    var y = event.target.offsetTop+event.offsetY;
                    var xy = this.extract_coords(event, img_info);
                    var x = xy[0];
                    var y = xy[1];
                    this.hist_dialog.update({
                        cursor: {
                            x: x,
                            y: y
                        }
                    });
                };
            }.bind(options.parent)
        }
    };
    this.surface = {
        input_class: 'viewer-ctrl-button viewer-ctrl-tools-btn viewer-ctrl-tools-surface',
        func: {
            click: function(event){
                this.change_active_tool('surface', event.currentTarget);
                Toyz.Core.load_dependencies(
                    {
                        js: [
                            "http://www.google.com/jsapi",
                            "/third_party/graph_3d/graph3d.js"
                        ]
                    },
                    function(){
                        console.log('loaded');
                        google.load('visualization', '1.0', {
                            callback: function() {
                                console.log('all loaded');
                                if(!this.hasOwnProperty('surface_dialog')){
                                    var file_info = this.frames[this.viewer_frame].file_info;
                                    var img_info = file_info.images[file_info.frame];
                                    this.surface_dialog = new Toyz.Astro.Viewer.SurfaceDialog({
                                        parent: this,
                                        cursor: {
                                            x: img_info.x_center,
                                            y: img_info.y_center
                                        }
                                    })
                                };
                            }.bind(this)
                        });
                    }.bind(this)
                );
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'get surface plot',
            value: ''
        },
        events: {
            mousedown: function(event){
                if(this.tools.active_tool=='surface'){
                    var file_info = this.frames[this.viewer_frame].file_info;
                    var img_info = file_info.images[file_info.frame];
                    var x = event.target.offsetLeft+event.offsetX;
                    var y = event.target.offsetTop+event.offsetY;
                    var xy = this.extract_coords(event, img_info);
                    var x = xy[0];
                    var y = xy[1];
                    this.surface_dialog.update({
                        cursor: {
                            x: x,
                            y: y
                        }
                    });
                };
            }.bind(options.parent)
        }
    };
    this.select_star = {
        input_class: 'viewer-ctrl-button astro-viewer-ctrl-astro-btn ' +
                    'astro-viewer-ctrl-selectstar',
        func: {
            click: function(event){
                this.change_active_tool('select_star', event.currentTarget);
            }.bind(options.parent)
        },
        prop: {
            type: 'image',
            title: 'select catalog source',
            value: ''
        }
    },
    this.add_star = {
        input_class: 'viewer-ctrl-button astro-viewer-ctrl-astro-btn astro-viewer-ctrl-addstar',
        prop: {
            type: 'image',
            title: 'add point source to catalog',
            value: ''
        },
        func: {
            click: function(event){
                this.change_active_tool('add_star', event.currentTarget);
            }.bind(options.parent)
        },
        events: {
            mousedown: function(event){
                if(this.tools.active_tool=='add_star'){
                    var catalog = this.catalog_dialog.get_current_catalog();
                    if(catalog!==undefined){
                        var file_info = this.frames[this.viewer_frame].file_info;
                        var img_info = file_info.images[file_info.frame];
                        var x = event.target.offsetLeft+event.offsetX;
                        var y = event.target.offsetTop+event.offsetY;
                        var xy = this.extract_coords(event, img_info);
                        var x = xy[0]/img_info.scale;
                        var y = xy[1]/img_info.scale;
                        console.log('x',x,'y',y);
                        this.workspace.websocket.send_task({
                            task: {
                                module: 'astrotoyz.tasks',
                                task: 'add_src',
                                parameters: {
                                    file_info: file_info,
                                    src_info: {
                                        x: x,
                                        y: y,
                                    },
                                    fit_type: 'elliptical_moffat',
                                    cid: catalog.cid
                                }
                            },
                            callback: function(catalog, result){
                                if(result.status=='success'){
                                    // If the source has an ra amd dec then convert those 
                                    // into strings
                                    if(result.src.hasOwnProperty('ra') && 
                                        result.src.hasOwnProperty('dec')
                                    ){
                                        var wcs = new 
                                            Toyz.Astro.Utils.World(result.src.ra, result.src.dec);
                                        result.src.ra = wcs.get_ra();
                                        result.src.dec = wcs.get_dec();
                                    };
                                    console.log('catalog before update', catalog);
                                    catalog.add_src(result.src);
                                }else{
                                    alert(result.status)
                                };
                            }.bind(this, catalog)
                        })
                    };
                };
            }.bind(options.parent)
        }
    };
    this.delete_star = {
        input_class: 'viewer-ctrl-button astro-viewer-ctrl-astro-btn '+
                    'astro-viewer-ctrl-deletestar',
        prop: {
            type: 'image',
            title: 'delete point source from catalog',
            value: ''
        },
        func: {
            click: function(event){
                var catalog = this.catalog_dialog.get_current_catalog();
                if(catalog.selected!==undefined){
                    this.workspace.websocket.send_task({
                        task: {
                            module: 'astrotoyz.tasks',
                            task: 'delete_src',
                            parameters: {
                                cid: catalog.cid,
                                src_info: catalog.selected.src_info
                            }
                        },
                        callback: function(selected, result){
                            if(result.status=='success'){
                                this.catalog_dialog.get_current_catalog().delete_src(selected);
                            }else{
                                alert(result.status);
                            };
                        }.bind(this, catalog.selected)
                    })
                };
            }.bind(options.parent)
        }
    };
    this.catalog = {
        input_class: 'viewer-ctrl-button astro-viewer-ctrl-astro-btn astro-viewer-ctrl-catalog',
        prop: {
            type: 'image',
            title: 'Open catalog dialog',
            value: ''
        },
        func: {
            click: function(){
                this.catalog_dialog.$div.dialog('open');
            }.bind(options.parent)
        } 
    };
    this.detect_stars = {
        input_class: 'viewer-ctrl-button astro-viewer-ctrl-astro-btn astro-viewer-ctrl-detect',
        prop: {
            type: 'image',
            title: 'detect point sources',
            value: ''
        },
        func: {
            click: function(){
                //this.detect_dialog.$div.dialog('open');
                var file_info = $.extend(true,{},this.frames[this.viewer_frame].file_info);
                var img_info = file_info.images[file_info.frame];
                file_info = {
                    filepath: file_info.filepath,
                    frame: file_info.frame
                };
                // Make room for the new catalog
                //var cid = 'cat-'+this.catalog_dialog.cat_idx;
                //this.catalog_dialog.catalog_idx++;
                this.catalog_dialog.gui.params.catalogs.buttons.add.$input.click();
                
                //return
                var catalog = this.catalog_dialog.get_current_catalog();
                var cid = catalog.cid;
                // Detect sources and create a catalog
                console.log('cid', cid);
                this.workspace.websocket.send_task({
                    task: {
                        module: 'astrotoyz.tasks',
                        task: 'detect_sources',
                        parameters: {
                            file_info: file_info,
                            cid: cid,
                            settings: {
                                aperture_type: 'radius',
                                maxima_size: 5,
                                maxima_sigma: 2,
                                aperture_radii: [5],
                                threshold: 19,
                                saturate: 40000,
                                fit_method: 'elliptical_moffat'
                            }
                        }
                    },
                    callback: function(cid, result){
                        console.log('detect result', result);
                        var catalog = new Toyz.Astro.Catalog.Catalog({
                            cid: cid,
                            settings: result.settings,
                            sources: result.sources.data,
                            viewer: this
                        });
                        this.catalog_dialog.catalogs[cid] = catalog;
                    }.bind(this, cid)
                })
            }.bind(options.parent)
        }
    };
    this.refresh = {
        input_class: 'viewer-ctrl-button astro-viewer-ctrl-astro-btn astro-viewer-ctrl-refresh',
        prop: {
            type: 'image',
            title: 'refresh the src catalog',
            value: ''
        },
        func: {
            click: function(){
                this.catalog_dialog.get_current_catalog().refresh();
            }.bind(options.parent)
        }
    };
    this.redraw = {
        input_class: 'viewer-ctrl-button astro-viewer-ctrl-astro-btn astro-viewer-ctrl-refresh',
        prop: {
            type: 'image',
            title: 'refresh the src catalog',
            value: ''
        },
        func: {
            click: function(){
                this.catalog_dialog.get_current_catalog().redraw();
            }.bind(options.parent)
        }
    };
}

Toyz.Astro.Viewer.contextMenu_items = function(workspace, tile_contents, options){
    var items = $.extend(true,{
        controls: {
            name: 'Control Panel',
            callback: function(){
                this.ctrl_panel.$div.dialog('open');
            }.bind(tile_contents)
        },
        img_sep: "--------------"
    },options, Toyz.Workspace.tile_contextMenu_items(workspace));
    return items;
};

Toyz.Astro.Viewer.Contents = function(params){
    if(!params.hasOwnProperty('groups')){
        params.groups = {
            Image: ['load_img', 'first_frame', 'previous_frame', 
                'input_frame', 'next_frame', 'last_frame'],
            Viewer: ['add_viewer_frame', 'remove_viewer_frame', 'first_viewer_frame',
                'previous_viewer_frame', 'input_viewer_frame', 'next_viewer_frame',
                'last_viewer_frame', 'wcs_align'],
            Zoom: ['zoom_out', 'zoom_in', 'zoom_bestfit', 'zoom_fullsize', 'zoom_input'],
            Tools: ['rect', 'center', 'hist', 'surface', 'colormap'],
            'Catalog Tools': [
                'catalog', 'detect_stars', 'select_star', 'add_star', 'delete_star', 
                'refresh', 'redraw' // TODO: Fix updating images events to eliminate these btns
            ],
            'Image Info': ['img_coords', 'physical_coords', 'ra', 'dec', 'pixel_val']
        }
    };
    if(!params.hasOwnProperty('controls')){
        params.controls = new Toyz.Astro.Viewer.Controls({
            parent: this
        });
    };
    Toyz.Viewer.Contents.call(this, params);
    this.type = 'astro_viewer';
    this.dialog_options = $.extend(true, {
        workspace: this.workspace,
        viewer: this
    }, this.dialog_options);
    this.catalog_dialog = new Toyz.Astro.Catalog.Dialog(this.dialog_options);
};
Toyz.Astro.Viewer.Contents.prototype = new Toyz.Viewer.Contents();
Toyz.Astro.Viewer.Contents.prototype.onmousemove = function(){
    // Update the pixel value every 200ms
    var ctrl = this.ctrl_panel.gui.params;
    clearTimeout(this.mousemove_timeout);
    this.mousemove_timeout = setTimeout(function(event){
        this.mousemove_timeout = undefined;
        var file_info = this.frames[this.viewer_frame].file_info;
        if(file_info!==undefined && file_info.file_type=='img_array'){
            var img_info = file_info.images[file_info.frame];
            var xy = this.extract_coords(event, img_info);
            var x = Math.round(xy[0]/img_info.scale);
            var y = Math.round(xy[1]/img_info.scale);
            this.workspace.websocket.send_task({
                task: {
                    module: 'astrotoyz.tasks',
                    task: 'get_img_data',
                    parameters: {
                        data_type: 'datapoint',
                        file_info: file_info,
                        img_info: img_info,
                        x: x,
                        y: y
                    }
                },
                callback: function(result){
                    this.rx_datapoint(result);
                }.bind(this)
            });
        };
    }.bind(this, event), 100);
};
Toyz.Astro.Viewer.Contents.prototype.get_img_tiles = function(viewer_frame, file_frame, tiles){
    var file_info = $.extend(true, {}, this.frames[viewer_frame].file_info);
    var img_info = file_info.images[file_frame];
    // If this is the first time accessing the image data load Astro-Toyz specific
    // image information
    if(!img_info.hasOwnProperty('coord_range')){
        this.workspace.websocket.send_task({
            task: {
                module: 'astrotoyz.tasks',
                task: 'get_img_info',
                parameters: {
                    file_info: file_info,
                    img_info: img_info
                }
            },
            callback: function(viewer_frame, file_frame, tiles, result){
                var file_info = this.frames[viewer_frame].file_info;
                file_info.images[file_frame] = result.img_info;
                var temp = new Toyz.Viewer.Contents();
                temp.get_img_tiles.call(this, viewer_frame, file_frame, tiles);
            }.bind(this, viewer_frame, file_frame, tiles)
        })
    }else{
        var temp = new Toyz.Viewer.Contents();
        temp.get_img_tiles.call(this, viewer_frame, file_frame, tiles);
    };
};

Toyz.Astro.Viewer.Histogram = function(options){
    if(!options.hasOwnProperty('settings')){
        options = {settings: options};
    };
    options = $.extend(true,{
        settings: {
            chart: {
                type: 'column',
                width: 400,
                height: 300
            },
            title: {
                text: 'Pixel values'
            },
            xAxis: {
                text: 'Pixel value',
                labels: {
                    rotation: -45
                }
            },
            yAxis: {
                text: 'Number of Points'
            },
            series: [{}]
        },
        bin_type: 'columns',
        columns: 20,
    }, options);
    this.$div = $('<div/>').addClass('viewer-hist-div');
    for(var opt in options){
        this[opt] = options[opt];
    };
    this.$div.highcharts(this.settings);
};
Toyz.Astro.Viewer.Histogram.prototype.update = function(update){
    for(var u in update){
        this[u] = update[u];
    };
    this.build_histogram();
    this.$div.highcharts(this.settings);
};
Toyz.Astro.Viewer.Histogram.prototype.build_histogram = function(){
    var bins = [];
    if(this.bin_type == 'columns'){
        var range = this.dataset.max-this.dataset.min;
        bins = new Array(this.columns);
        this.settings.xAxis.categories = new Array(this.columns);
        for(var i=0; i<bins.length; i++){
            bins[i]=0;
        };
        for(var i=0; i<this.dataset.data.length; i++){
            for(var j=0; j<this.dataset.data[i].length; j++){
                var bin = Math.round(this.columns*(this.dataset.data[i][j]-this.dataset.min)/range);
                if(bin<0){
                    bin = 0;
                }else if(bin>bins.length-1){
                    bin = bins.length-1;
                };
                bins[bin]+=1;
            }
        };
        this.settings.series[0].data = [];
        for(var i=0; i<bins.length; i++){
            var bin_value = Math.round(i*range/this.columns+this.dataset.min);
            this.settings.series[0].data.push([bin_value, bins[i]]);
        };
    }else{
        throw Error("Bin type is not supported yet");
    };
    return bins;
};

Toyz.Astro.Viewer.HistogramDialog = function(options){
    if(!options.hasOwnProperty('parent')){
        throw Error("HistogramDialog must be initialized with a parent viewer");
    };
    this.parent = options.parent;
    options = $.extend(true, {
        min: 1,
        max: 100,
        step: 1,
        value: 10,
        chart: {
            settings:{},
            bin_type: 'columns',
            columns: 20,
            width: 400,
            height: 300
        },
        cursor: {
            x: 0,
            y: 0
        }
    }, options);
    this.cursor = options.cursor;
    
    this.$div = $('<div/>');
    
    var elements = {
        type: 'div',
        params: {
            hist: new Toyz.Astro.Viewer.Histogram(options.chart),
            width: {
                lbl: 'area width',
                prop: {
                    value: options.value,
                    type: 'Number'
                },
                func: {
                    change: function(event){
                        this.update({
                            width: Number(event.currentTarget.value)
                        })
                    }.bind(this)
                }
            },
            bins: {
                lbl: 'number of bins',
                prop: {
                    type: 'Number',
                    value: options.chart.columns
                },
                func: {
                    change: function(event){
                        this.update({
                            hist: {
                                columns: Number(event.currentTarget.value)
                            }
                        })
                    }.bind(this)
                }
            },
            stats: {
                type: 'div',
                legend: 'Stats',
                params: {
                    mean: {
                        lbl: 'mean',
                        type: 'lbl'
                    },
                    std_dev: {
                        lbl: '\u03C3',
                        type: 'lbl'
                    },
                    median: {
                        lbl: 'median',
                        type: 'lbl'
                    },
                    min: {
                        lbl: 'min',
                        type: 'lbl'
                    },
                    max: {
                        lbl: 'max',
                        type: 'lbl'
                    }
                }
            }
        }
    };
    
    this.gui = new Toyz.Gui.Gui({
        params: elements,
        $parent: this.$div
    });
    
    this.$div.dialog($.extend(true, {
        resizable: true,
        draggable: true,
        autoOpen: false,
        modal: false,
        width: 'auto',//options.chart.width+20,
        title: 'Pixel Values',
        maxHeight: $(window).height(),
        position: {
            my: "left top",
            at: "left top",
            of: $(window)
        },
        buttons: {}
    },options.dialog)).css("font-size", "12px");
};
Toyz.Astro.Viewer.HistogramDialog.prototype.update = function(update){
    var update_hist = false;
    var update_data = false;
    if(update.hasOwnProperty('width') || update.hasOwnProperty('data')){
        update_data = true;
    };
    if(update.hasOwnProperty('hist')){
        this.gui.params.hist.update(update.hist)
    }else if(update_hist){
        this.gui.params.hist.update({});
    };
    if(update.hasOwnProperty('cursor')){
        this.cursor = update.cursor;
        this.$div.dialog('open');
        update_data = true;
    };
    if(update_data===true){
        var file_info = $.extend(true, {},this.parent.frames[this.parent.viewer_frame].file_info);
        var img_info = $.extend(true, {}, file_info.images[file_info.frame]);
        delete file_info.images;
        delete img_info.tiles;
        var width = this.gui.get().width;
        this.parent.workspace.websocket.send_task({
            task: {
                module: 'toyz.web.tasks',
                task: 'get_img_data',
                parameters: {
                    file_info: file_info,
                    img_info: img_info,
                    data_type: 'data',
                    x: this.cursor.x/img_info.viewer.scale,
                    y: this.cursor.y/img_info.viewer.scale,
                    width: width,
                    height: width
                }
            },
            callback: function(result){
                console.log('result', result);
                this.gui.params.hist.update({
                    dataset: $.extend(true,{}, result)
                });
                delete result.data
                delete result.id
                // Update the statistics
                this.gui.set_params({
                    change: false,
                    values: result
                });
            }.bind(this)
        })
    };
};

// Initialize an interactive surface plot and functions to modify and update it
// Note: for now this requires the use of Google Visualization API but in the future
// this will be switched to d3.js
Toyz.Astro.Viewer.SurfacePlot = function(options){
    options = $.extend(true,{
        settings: {
            width: '300px',
            height: '300px',
            style: "surface",
            showPerspective: true,
            showGrid: true,
            showShadow: false,
            keepAspectRatio: true,
            verticalRatio: 1
        }
    }, options);
    
    this.data = undefined;
    this.$div = $('<div/>');
    this.plot = new links.Graph3d(this.$div[0]);
    for(var opt in options){
        this[opt] = options[opt]
    };
};
Toyz.Astro.Viewer.SurfacePlot.prototype.update = function(update){
    if(update.hasOwnProperty('data')){
        // We must convert the data into a form that Google visualization wants
        this.data = new google.visualization.DataTable();
        this.data.addColumn('number', 'x');
        this.data.addColumn('number', 'y');
        this.data.addColumn('number', 'value');
        for(var i=0; i<update.data.length; i++){
            for(var j=0; j<update.data[i].length; j++){
                this.data.addRow([j,i,update.data[i][j]]);
            }
        };
    };
    if(update.hasOwnProperty('settings')){
        this.settings = $.extend(true, this.settings, update.settings);
    };
    if(this.data!==undefined){
        this.draw();
    };
};
Toyz.Astro.Viewer.SurfacePlot.prototype.draw = function(){
    console.log('data', this.data);
    console.log('settings', this.settings);
    this.plot.draw(this.data, this.settings);
};

Toyz.Astro.Viewer.SurfaceDialog = function(options){
    if(!options.hasOwnProperty('parent')){
        throw Error("HistogramDialog must be initialized with a parent viewer");
    };
    this.parent = options.parent;
    options = $.extend(true, {
        plot: {},
        cursor: {
            x: 0,
            y: 0
        },
        plot_width: 10,
        fit_type: 'circular_gaussian'
    }, options);
    this.cursor = options.cursor;
    this.plot_width = options.plot_width
    
    this.$div = $('<div/>').css({
        height: '400px',
        width: '400px',
        'min-height': '400px',
    });
    this.plot = new Toyz.Astro.Viewer.SurfacePlot(options.plot);
    this.$div.append(this.plot.$div);
    this.$div[0].width = 400;
    this.$div[0].height = 1000;
    var elements = {
        type: 'div',
        params: {
            plot_width: {
                lbl: 'plot area width',
                prop: {
                    type: 'Number',
                    value: options.plot_width
                },
                func: {
                    change: function(event){
                        this.update({
                            plot_width: Number(event.currentTarget.value)
                        })
                    }.bind(this)
                }
            },
            fit_type: {
                type: 'conditional',
                selector:{
                    fit_type: {
                        type: 'select',
                        options: {
                            circular_gaussian: 'circular gaussian',
                            elliptical_gaussian: 'elliptical gaussian',
                            circular_moffat: 'circular moffat',
                            elliptical_moffat: 'elliptical moffat'
                        },
                        default_val: options.fit_type,
                        func: {
                            change: function(event){
                                this.update({
                                    fit_type: event.currentTarget.value
                                });
                            }.bind(this)
                        }
                    }
                },
                param_sets: {
                    circular_gaussian: {
                        type: 'div',
                        legend: 'Circular gaussian fit',
                        params: {
                            coords: {
                                type: 'lbl',
                                lbl: 'coords'
                            },
                            ra: {
                                type: 'lbl',
                                lbl: 'RA'
                            },
                            dec: {
                                type: 'lbl',
                                lbl: 'DEC'
                            },
                            std_dev: {
                                type: 'lbl',
                                lbl: '\u03C3'
                            },
                            amplitude: {
                                type: 'lbl',
                                lbl: 'amplitude'
                            },
                            floor: {
                                type: 'lbl',
                                lbl: 'floor'
                            }
                        }
                    },
                    elliptical_gaussian: {
                        type: 'div',
                        legend: 'Elliptical gaussian fit',
                        params: {
                            coords: {
                                type: 'lbl',
                                lbl: 'coords'
                            },
                            ra: {
                                type: 'lbl',
                                lbl: 'RA'
                            },
                            dec: {
                                type: 'lbl',
                                lbl: 'DEC'
                            },
                            std_x: {
                                type: 'lbl',
                                lbl: '\u03C3_x'
                            },
                            std_y: {
                                type: 'lbl',
                                lbl: '\u03C3_y'
                            },
                            angle: {
                                type: 'lbl',
                                lbl: '\u03B8'
                            },
                            amplitude: {
                                type: 'lbl',
                                lbl: 'amplitude'
                            },
                            floor: {
                                type: 'lbl',
                                lbl: 'floor'
                            }
                        }
                    },
                    circular_moffat: {
                        type: 'div',
                        legend: 'Circular moffat fit',
                        params: {
                            coords: {
                                type: 'lbl',
                                lbl: 'coords'
                            },
                            ra: {
                                type: 'lbl',
                                lbl: 'RA'
                            },
                            dec: {
                                type: 'lbl',
                                lbl: 'DEC'
                            },
                            fwhm: {
                                type: 'lbl',
                                lbl: 'fwhm1'
                            },
                            beta: {
                                type: 'lbl',
                                lbl: '\u03B2'
                            },
                            amplitude: {
                                type: 'lbl',
                                lbl: 'amplitude'
                            },
                            floor: {
                                type: 'lbl',
                                lbl: 'floor'
                            }
                        }
                    },
                    elliptical_moffat: {
                        type: 'div',
                        legend: 'Elliptical moffat fit',
                        params: {
                            coords: {
                                type: 'lbl',
                                lbl: 'coords'
                            },
                            ra: {
                                type: 'lbl',
                                lbl: 'RA'
                            },
                            dec: {
                                type: 'lbl',
                                lbl: 'DEC'
                            },
                            fwhm1: {
                                type: 'lbl',
                                lbl: 'fwhm1'
                            },
                            fwhm2: {
                                type: 'lbl',
                                lbl: 'fwhm2'
                            },
                            beta: {
                                type: 'lbl',
                                lbl: '\u03B2'
                            },
                            angle: {
                                type: 'lbl',
                                lbl: '\u03B8'
                            },
                            amplitude: {
                                type: 'lbl',
                                lbl: 'amplitude'
                            },
                            floor: {
                                type: 'lbl',
                                lbl: 'floor'
                            }
                        }
                    }
                }
            }
        }
    };
    
    this.gui = new Toyz.Gui.Gui({
        params: elements,
        $parent: this.$div
    });
    
    this.$div.dialog($.extend(true, {
        resizable: true,
        draggable: true,
        autoOpen: false,
        modal: false,
        width: 'auto',
        title: 'Surface Plot',
        maxHeight: $(window).height(),
        position: {
            my: "left top",
            at: "left top",
            of: $(window)
        },
        buttons: {}
    },options.dialog)).css("font-size", "12px");
};
Toyz.Astro.Viewer.SurfaceDialog.prototype.update = function(update){
    var update_plot = false;
    var update_data = false;
    if(update.hasOwnProperty('plot_width') || update.hasOwnProperty('data') ||
        update.hasOwnProperty('fit_type')
    ){
        update_data = true;
    };
    for(var u in update){
        this[u] = update[u]
    };
    if(update.hasOwnProperty('plot')){
        this.gui.params.plot.update(update.plot);
    };
    if(update.hasOwnProperty('cursor')){
        this.cursor = update.cursor;
        this.$div.dialog('open');
        update_data = true;
    };
    if(update_data===true){
        var file_info = $.extend(true, {},this.parent.frames[this.parent.viewer_frame].file_info);
        var img_info = $.extend(true, {}, file_info.images[file_info.frame]);
        delete file_info.images;
        delete img_info.tiles;
        var params = this.gui.get();
        var width = this.plot_width;
        this.parent.workspace.websocket.send_task({
            task: {
                module: 'astrotoyz.tasks',
                task: 'get_img_data',
                parameters: {
                    file_info: file_info,
                    img_info: img_info,
                    data_type: 'data',
                    fit_type: params.conditions.fit_type,
                    x: this.cursor.x/img_info.viewer.scale,
                    y: this.cursor.y/img_info.viewer.scale,
                    width: width,
                    height: width
                }
            },
            callback: function(result){
                console.log('surface result', result);
                this.plot.update({
                    data: result.data
                });
                delete result.data
                delete result.id
                // Update the statistics
                if(result.hasOwnProperty('ra') && result.hasOwnProperty('dec')){
                    var wcs = new Toyz.Astro.Utils.World(result.ra, result.dec);
                    result.ra = wcs.get_ra();
                    result.dec = wcs.get_dec();
                };
                this.gui.set_params({
                    change: false,
                    values: result
                });
            }.bind(this)
        })
    };
}

console.log('Astro Toyz Viewer loaded');