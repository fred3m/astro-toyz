// Wrapper for Toyz SExtractor Graphical User Interface
// Copyright 2015 by Fred Moolekamp
// License: LGPLv3

// Define namespace to avoid collisions
Toyz.namespace('Toyz.Astro.Sex');

// Check to see if all of the API's dependencies have loaded
// If not, return false
Toyz.Astro.Sex.dependencies_loaded = function(){
    if(Toyz.Gui===undefined){
        return false
    };
    return true;
};
// Load any dependencies of the tile
Toyz.Astro.Sex.load_dependencies = function(callback){
    // Check to see if ace loaded from the server
    if(!Toyz.Astro.Sex.dependencies_loaded()){
        console.log('Loading Astro-Toyz SExtractor dependencies');
        Toyz.Core.load_dependencies(
            {
                core: true,
                //css: ["/toyz/static/astrotoyz/sextractor.css"]
            },
            function(){
                console.log('Astro-Toyz SExtractor dependencies loaded');
                callback();
            }
        );
    }else{
        callback();
    };
};

Toyz.Astro.Sex.get_config = function(options, interface){
    config = $.extend(true,{
        type: 'div',
        params: {
            image: {
                type: 'div',
                legend: 'Image',
                params: {
                    filename: {
                        lbl: 'Filename',
                        file_dialog: true
                    },
                },
                optional: {
                    frames: {
                        lbl: 'Frame(s)',
                        prop: {
                            value: 1
                        }
                    },
                    config_file: {
                        lbl: 'Config filename',
                        file_dialog: true
                    }
                }
            },
            catalog: {
                type: 'div',
                legend: 'Catalog',
                params: {
                    CATALOG_NAME: {
                        lbl: 'Name of the output catalog',
                        file_dialog: true
                    },
                    CATALOG_TYPE: {
                        type: 'select',
                        lbl: 'Output catalog type',
                        options: ['NONE', 'ASCII', 'ASCII_HEAD', 'ASCII_SKYCAT', 'ASCII_VOTABLE', 
                            'FITS_1.0', 'FITS_LDAC'],
                        default_val: 'ASCII_HEAD'
                    },
                    params_div: {
                        type: 'conditional',
                        selector: {
                            param_file_type: {
                                lbl: 'Output parameters from ',
                                type: 'select',
                                options: {
                                    toyz: 'Toyz',
                                    file: 'File'
                                }
                            }
                        },
                        param_sets: {
                            file: {
                                type: 'div',
                                params: {
                                    PARAMETERS_NAME: {
                                        lbl: 'Name of parameters file',
                                        prop: {
                                            value: 'default.param'
                                        },
                                        file_dialog: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            extraction: {
                type: 'div',
                legend: 'Extraction',
                params:{},
                optional: {
                    DETECT_TYPE: {
                        type: 'select',
                        lbl: 'Detector type',
                        options: ['CCD', 'PHOTO'],
                    },
                    DETECT_MINAREA: {
                        lbl: 'minimum number of pixels above threshold',
                        prop: {
                            value: '5'
                        }
                    },
                    THRESH_TYPE: {
                        type: 'select',
                        lbl: 'Threshold type',
                        options: ['RELATIVE', 'ABSOLUTE']
                    },
                    DETECT_THRESH: {
                        lbl: 'Detection threshold',
                        prop: {
                            value: '1.5'
                        }
                    },
                    ANALYSIS_THRESH: {
                        lbl: 'Analysis Threshold',
                        prop: {
                            value: '1.5'
                        }
                    },
                    FILTER: {
                        lbl: 'Apply filter for detection',
                        prop: {
                            type: 'checkbox',
                            checked: true
                        }
                    },
                    FILTER_NAME: {
                        lbl: 'Filter name',
                        prop: {
                            value: 'default.conv'
                        },
                        file_dialog: true
                    },
                    FILTER_THRESH: {'lbl': 'Threshold for retina filtering'},
                    DEBLEND_NTHRESH: {
                        lbl: 'Number of deblending sub-thresholds',
                        prop: {
                            value: '32'
                        }
                    },
                    DEBLEND_MINCONT: {
                        lbl: 'Minimum contrast parameter for deblending',
                        prop: {
                            value: '0.005'
                        }
                    },
                    CLEAN: {
                        lbl: 'Clean spurious detections',
                        prop: {
                            type: 'checkbox',
                            checked: true
                        }
                    },
                    CLEAN_PARAM: {
                        lbl: 'Cleaning efficiency',
                        prop: {
                            value: '1.0'
                        }
                    },
                    MASK_TYPE: {
                        lbl: 'Type of detection MASKing',
                        type: 'select',
                        options: ['NONE', 'BLANK', "CORRECT"],
                        default_val: 'CORRECT'
                    },
                }
            },
            weighting: {
                type: 'div',
                legend: 'WEIGHTing',
                params: {
                    weight_div: {
                        type: 'conditional',
                        selector: {
                            use_weights: {
                                lbl: 'Use weight file',
                                prop: {
                                    type: 'checkbox',
                                    checked: false
                                }
                            }
                        },
                        param_sets: {
                            true: {
                                type: 'div',
                                params: {
                                    WEIGHT_TYPE: {
                                        lbl: 'type of WEIGHTing',
                                        type: 'select',
                                        options: ['NONE', 'BACKGROUND', 'MAP_RMS', 'MAP_VAR', 
                                            'MAP_WEIGHT']
                                    },
                                    WEIGHT_IMAGE: {
                                        lbl: 'Weight image name',
                                        file_dialog: true
                                    },
                                    WEIGHT_GAIN: {
                                        lbl: 'modulate gain (E/ADU) with weights',
                                        prop: {
                                            'type': 'checkbox',
                                            'checked': true
                                        }
                                    },
                                    WEIGHT_THRESH: {'lbl': 'weight threshold[s] for bad pixels'}
                                }
                            }
                        }
                    }
                }
            },
            flagging: {
                type: 'conditional',
                legend: 'FLAGging',
                selector: {
                    use_flagging: {
                        lbl: 'Use flagging file',
                        prop: {
                            type: 'checkbox',
                            checked: false
                        }
                    }
                },
                param_sets: {
                    true: {
                        type: 'div',
                        params: {
                            FLAG_IMAGE: {
                                lbl: 'Filename for an input FLAG-image',
                                file_dialog: true
                            },
                            FLAG_TYPE: {
                                lbl: 'flag pixel combination',
                                type: 'select',
                                options: ['OR', 'AND', 'MIN', 'MAX']
                            },
                        }
                    }
                }
            },
            photometry: {
                type: 'div',
                legend: 'Photometry',
                params:{},
                optional: {
                    PHOT_APERTURES: {
                        lbl: 'MAG_APER aperture diameter(s) in pixels',
                        prop: {
                            'value': 5
                        }
                    },
                    PHOT_AUTOPARAMS: {
                        lbl: 'MAG_AUTO parameters: [Kron_fact],[min_radius]',
                        prop: {
                            value: '2.5, 3.5'
                        }
                    },
                    PHOT_PETROPARAMS: {
                        lbl: 'MAG_PETRO parameters: [Petrosian_fact],[min_radius]',
                        prop: {
                            value: '2.0, 3.5'
                        }
                    },
                    PHOT_AUTOAPERS: {
                        lbl: '[estimation],[measurement] minimum apertures '+
                                'for MAG_AUTO and MAG_PETRO',
                        prop: {
                            value: '0.0, 0.0'
                        }
                    },
                    PHOT_FLUXFRAC: {
                        lbl: 'flux fraction[s] used for FLUX_RADIUS',
                        prop: {
                            value: '0.5'
                        }
                    },
                    saturate_div: {
                        type: 'conditional',
                        selector: {
                            saturate_type: {
                                lbl: 'saturation type',
                                type: 'select',
                                options: ['keyword', 'value']
                            }
                        },
                        param_sets: {
                            keyword: {
                                type: 'div',
                                params: {
                                    SATUR_KEY: {
                                        lbl: 'keyword for saturation level (in ADUs)',
                                        prop: {
                                            'value': 'SATURATE'
                                        }
                                    },
                                }
                            },
                            value: {
                                type: 'div',
                                params: {
                                    SATUR_LEVEL: {
                                        lbl: 'level (in ADUs) at which arises saturation',
                                        prop: {
                                            value: '50000.0'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    MAG_ZEROPOINT: {
                        lbl: 'Magnitude zeropoint',
                        prop: {
                            value: '0.0'
                        }
                    },
                    MAG_GAMMA: {
                        lbl: 'gamma of emulsion (for photographic scans)',
                        prop: {
                            value: '4.0'
                        }
                    },
                    gain_div: {
                        type: 'conditional',
                        selector: {
                            gain_type: {
                                lbl: 'gain type',
                                type: 'select',
                                options: ['keyword', 'value']
                            }
                        },
                        param_sets: {
                            keyword: {
                                type: 'div',
                                params: {
                                    GAIN_KEY: {
                                        lbl: 'keyword for detector gain in e-/ADU',
                                        prop: {
                                            'value': 'GAIN'
                                        }
                                    }
                                }
                            },
                            value: {
                                type: 'div',
                                params: {
                                    GAIN: {
                                        lbl: 'detector gain in e-/ADU',
                                        prop: {
                                            value: '0.0'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    PIXEL_SCALE: {
                        lbl: 'size of pixel in arcsec (0=use FITS WCS info)',
                        prop: {
                            value: '1.0'
                        }
                    }
                }
            },
            src_sep: {
                type: 'div',
                legend: 'Star/Galaxy separation',
                params: {},
                optional: {
                    SEEING_FWHM: {
                        lbl: 'stellar FWHM in arcsec',
                        prop: {
                            value: '1.2'
                        }
                    },
                    STARNNW_NAME: {
                        lbl: 'Neural-Network_Weight table filename',
                        prop: {
                            value: 'default.nnw'
                        },
                        file_dialog: true
                    }
                }
            },
            background: {
                type: 'div',
                legend: 'Background',
                params: {},
                optional: {
                    BACK_TYPE: {
                        lbl: 'Background type',
                        type: 'select',
                        options: ['AUTO','MANUAL']
                    },
                    BACK_VALUE: {
                        lbl: 'Default background value in MANUAL mode',
                        prop: {
                            value: '0.0'
                        }
                    },
                    BACK_SIZE: {
                        lbl: 'Background mesh: [size] or [width],[height]',
                        prop: {
                            value: '64'
                        }
                    },
                    BACK_FILTERSIZE: {
                        lbl: 'Background filter: [size] or [width],[height]',
                        prop: {
                            value: '3'
                        }
                    },
                    BACKPHOTO_TYPE: {
                        lbl: 'Background type',
                        type: 'select',
                        options: ['GLOBAL', 'LOCAL']
                    },
                    BACKPHOTO_THICK: {
                        lbl: 'Thickness of the background LOCAL annulus',
                        prop: {
                            value: '24'
                        }
                    },
                    BACK_FILTTHRESH: {
                        lbl: 'Threshold above which the background-map filter operates',
                        prop: {
                            value: '0.0'
                        }
                    }
                }
            },
            check_img: {
                type: 'div',
                legend: 'Check Image',
                params: {
                    check_div: {
                        type: 'conditional',
                        selector: {
                            check_img: {
                                lbl: 'use check image',
                                prop: {
                                    type: 'checkbox',
                                    checked: false
                                }
                            }
                        },
                        param_sets: {
                            true: {
                                type: 'div',
                                params: {
                                    CHECKIMAGE_TYPE: {
                                        type: 'select',
                                        options: ['NONE', 'BACKGROUND', 'BACKGROUND_RMS',
                                            'MINIBACKGROUND', 'MINIBACK_RMS', '-BACKGROUND',
                                            'FILTERED', 'OBJECTS', '-OBJECTS', 'SEGMENTATION',
                                            'APERTURES']
                                    },
                                    CHECKIMAGE_NAME: {
                                        lbl: 'Filename for the check-image',
                                        file_dialog: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            memory: {
                type: 'div',
                legend: 'Memory (change with caution!)',
                params: {
                    use_memory: {
                        type: 'conditional',
                        selector: {
                            use_memory: {
                                lbl: 'set memory options',
                                prop: {
                                    type: 'checkbox',
                                    checked: false
                                }
                            }
                        },
                        param_sets: {
                            true: {
                                type: 'div',
                                params: {
                                    MEMORY_OBJSTACK: {
                                        lbl: 'number of objects in stack',
                                        prop: {
                                            value: 3000
                                        }
                                    },
                                    MEMORY_PIXSTACK: {
                                        lbl: 'number of pixels in stack',
                                        prop: {
                                            value: '300000'
                                        }
                                    },
                                    MEMORY_BUFSIZE: {
                                        lbl: 'number of lines in buffer',
                                        prop: {
                                            value: '1024'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            association: {
                type: 'div',
                legend: 'ASSOCiation',
                params: {
                    assoc_div: {
                        type: 'conditional',
                        selector: {
                            use_assoc: {
                                lbl: 'Use ASSOCiation file',
                                prop: {
                                    type: 'checkbox',
                                    checked: false
                                }
                            }
                        },
                        param_sets: {
                            true: {
                                type: 'div',
                                params: {
                                    ASSOC_NAME: {
                                        lbl: 'ASCII file to ASSOCiate',
                                        file_dialog: true
                                    },
                                    ASSOC_DATA: {
                                        lbl: 'columns of the data to replicate (0=all)',
                                        prop: {
                                            value: '2,3,4'
                                        }
                                    },
                                    ASSOC_PARAMS: {
                                        lbl: 'columns of xpos,ypos[,mag]',
                                        prop: {
                                            value: '2,3,4'
                                        }
                                    },
                                    ASSOC_RADIUS: {
                                        lbl: 'cross-matching radius (pixels)',
                                        prop: {
                                            value: '2.0'
                                        }
                                    },
                                    ASSOC_TYPE: {
                                        lbl: 'ASSOCiation method',
                                        type: 'select',
                                        options: ['FIRST', 'NEAREST', 'MEAN',
                                            'MAG_MEAN', 'SUM', 'MAG_SUM', 'MIN', 'MAX'],
                                        default_val: 'NEAREST'
                                    },
                                    ASSOCSELEC_TYPE: {
                                        lbl: 'ASSOC selection type',
                                        type: 'select',
                                        options: ['ALL', 'MATCHED', '-MATCHED']
                                    }
                                }
                            }
                        }
                    }
                }
            },
            misc: {
                type: 'div',
                legend: 'Miscellaneous',
                params: {},
                optional: {
                    VERBOSE_TYPE: {
                        lbl: 'Verbose type',
                        type: 'select',
                        options: ['QUIET', 'NORMAL', 'FULL'],
                        default_val: 'NORMAL'
                    },
                    WRITE_XML : {
                        lbl: 'Write XML file',
                        prop: {
                            type: 'checkbox',
                            checked: false
                        }
                    },
                    XML_NAME: {
                        lbl: 'Filename for XML output',
                        file_dialog: true
                    },
                    XSL_URL: {
                        lbl: 'Filename for XSL style-sheet',
                        prop: {
                            value: 'file:///usr/local/share/sextractor/sextractor.xsl'
                        }
                    },
                    NTHREADS: {
                        lbl: 'Number of simultaneous threads (0 = automatic)',
                        prop: {
                            value: '0'
                        }
                    },
                    FITS_UNSIGNED: {
                        lbl: 'Treat FITS integer values as unsigned',
                        prop: {
                            type: 'checkbox',
                            checked: false
                        }
                    },
                    INTERP_MAXXLAG: {
                        lbl: 'Max. lag along X for 0-weight interpolation',
                        prop: {
                            value: '16'
                        }
                    },
                    INTERP_MAXYLAG: {
                        lbl: 'Max. lag along Y for 0-weight interpolation',
                        prop: {
                            value: '16'
                        }
                    },
                    INTERP_TYPE: {
                        lbl: 'Interpolation type',
                        type: 'select',
                        options: ['NONE', 'VAR_ONLY', 'ALL'],
                        default_val: 'ALL'
                    }
                }
            },
            experimental: {
                type:'div',
                legend: 'Experimental Stuff',
                params: {
                    psf_div: {
                        type: 'conditional',
                        selector: {
                            use_psf: {
                                lbl: 'Use PSF',
                                prop: {
                                    type: 'checkbox',
                                    checked: false
                                }
                            },
                        },
                        param_sets: {
                            true: {
                                type: 'div',
                                params: {
                                    PSF_NAME: {
                                        'lbl': 'File containing the PSF model',
                                        'file_dialog': true
                                    },
                                    PSF_NMAX: {
                                        lbl: 'Max.number of PSFs fitted simultaneously',
                                        prop: {
                                            value: '9'
                                        }
                                    },
                                    PSFDISPLAY_TYPE: {
                                        lbl: 'Catalog type for PSF-fitting',
                                        type: 'select',
                                        options: ['SPLIT', 'VECTOR']
                                    }
                                }
                            }
                        }
                    }
                },
                optional: {
                    PATTERN_TYPE: {
                        lbl: 'Pattern type',
                        type: 'select',
                        options: ['RINGS-QUADPOLE', 'RINGS-OCTOPOLE', 'RINGS-HARMONICS', 
                            'GAUSS-LAGUERRE'],
                        default_val: 'RINGS-HARMONICS'
                    },
                    SOM_NAME: {
                        lbl: 'File containing Self-Organizing Map weights',
                        file_dialog: true
                    }
                }
            }
        }
    },options);
    
    return config;
};

Toyz.Astro.Sex.Interface = function(){
    websocket.send_task({
        task: {
            module: 'astrotoyz.tasks',
            task: 'load_sextractor',
            parameters: {}
        },
        callback: function(result){
            console.log('load sextractor result', result);
            var param_gui = {
                type: 'div',
                params: {}
            };
            // Put the parameters in the correct order
            for(var i=0; i<result.param_order.length; i++){
                var p = result.param_order[i];
                param_gui.params[p] = result.params.params[p];
            };
            console.log('param_gui', param_gui);
            this.params = new Toyz.Gui.Dialog(param_gui, {
                title: 'SExtractor Output Fields',
                buttons: {
                    Set: function(){
                        this.set_params();
                        this.params.$div.dialog('close');
                    }.bind(this)
                }
            });
            // Initially set the params to the default
            this.set_params();
            this.config = new Toyz.Gui.Dialog(Toyz.Astro.Sex.get_config(), {
                title: 'SExtractor Config',
                buttons: {
                    'Set Params': function(){
                        this.params.$div.dialog('open');
                    }.bind(this),
                    Run: function(){
                        var config = this.config.gui.get();
                        var out_params = [];
                        for(var p in this.out_params){
                            if(this.out_params[p]){
                                out_params.push(p)
                            }
                        };
                        if(out_params.length==0 && !config.hasOwnProperty('PARAMETERS_NAME')){
                            throw Error(
                                "You forgot to enter output parameters. Either choose a "+
                                "filename or click 'Set Params' to choose a set of "+
                                "output parameters"
                            );
                        }else{
                            delete config.conditions;
                            var params = {
                                config: config,
                                params: out_params,
                                filename: config.filename
                            };
                            delete config.filename;
                            if(config.hasOwnProperty('frames')){
                                params.frames = config.frames;
                                delete config.frames;
                            };
                            if(config.hasOwnProperty('config_file')){
                                params.config_file = config.config_file;
                                delete config.config_file;
                            };
                            console.log('parameters', params);
                            websocket.send_task({
                                task: {
                                    module: 'astrotoyz.tasks',
                                    task: 'run_sextractor',
                                    parameters: params
                                },
                                callback: function(result){
                                    console.log('run_sextractor result', result);
                                }.bind(this)
                            })
                        };
                    }.bind(this)
                }
            });
            console.log('config', this.config);
        }.bind(this)
    })
};
Toyz.Astro.Sex.Interface.prototype.set_params = function(){
    this.out_params = this.params.gui.get();
    delete this.out_params.conditions;
};