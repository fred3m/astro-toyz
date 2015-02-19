// Copyright 2015 by Fred Moolekamp
// License: MIT

// Define namespace to avoid collisions
Toyz.namespace('Toyz.Template');

// Check to see if all of the API's dependencies have loaded
// If not, return false
Toyz.Template.dependencies_loaded = function(){
    return false;
};
// Load any dependencies of the tile
Toyz.Template.load_dependencies = function(callback){
    // Check to see if ace loaded from the server
    if(!Toyz.Template.dependencies_loaded()){
        console.log('Loading Template dependencies');
        Toyz.Core.load_dependencies(
            {
                //js:["js dependencies here"],
                css: [
                    "/toyz/static/toyz_template/template.css"
                ]
            },
            function(){
                console.log('Template dependencies loaded');
                callback();
            }
        );
    };
};

// It is often useful (but not required) to create interactive controls and displays
// on the tile. This is an example of a set of controls
Toyz.Template.Gui = function(params){
    this.$div = $('<div/>');
    this.$parent = params.$parent;
    this.$parent.append(this.$div);
    this.workspace = params.workspace;
    this.tile_contents = params.tile_contents;
    
    var gui = {
        type: 'div',
        params: {
            x: {
                lbl: 'x',
                prop: {
                    type: 'Number',
                    value: 2
                }
            },
            y: {
                lbl: 'y',
                prop: {
                    type: 'Number',
                    value: 4
                }
            },
            z: {
                lbl: 'z',
                prop: {
                    type: 'Number',
                    value: 6
                }
            },
            submit: {
                type: 'button',
                prop: {
                    innerHTML: 'Submit'
                },
                func: {
                    click: function(){
                        var params = this.gui.get();
                        console.log('params:', params);
                        this.workspace.websocket.send_task({
                            task: {
                                module: 'toyz_template.tasks',
                                task: 'sample_function',
                                parameters: params
                            },
                            callback: function(result){
                                alert(
                                    'sum:'+result.sum+
                                    '\nproduct:'+result.product+
                                    '\nmean:'+result.mean
                                );
                            }
                        });
                    }.bind(this)
                }
            }
        }
    };
    
    this.gui = new Toyz.Gui.Gui({
        params: gui,
        $parent: this.$div
    });
};

// This is the main object contained in the tile
Toyz.Template.Contents = function(params){
    this.type = 'template';
    this.tile = params.tile;
    this.$tile_div = params.$tile_div;
    this.$tile_div
        .removeClass('context-menu-tile')
        .addClass('context-menu-template');
    this.workspace = params.workspace;
    this.settings = {};
    
    //create tile context menu
    $.contextMenu({
        selector: '#'+this.$tile_div.prop('id'),
        callback: function(workspace, key, options){
            workspace[key](options);
        }.bind(null, workspace),
        items: this.contextMenu_items()
    });
    
    
    // Example of things to add to the tile div
    this.$div = $('<div/>').addClass('template-tile');
    this.$tile_div.append(this.$div);
    this.gui_div = new Toyz.Template.Gui({
        $parent: this.$div,
        workspace: workspace,
        tile_contents: this
    });
    
    console.log('Template contents created');
};
// Required function to allow for updates to the tile values
// (but may be modified)
Toyz.Template.Contents.prototype.update = function(params, param_val){
    // Allow user to either pass param_name, param_val to function or
    // dictionary with multiple parameters
    if(!(param_val===undefined)){
        params = {params:param_val};
    };
    for(var param in params){
        this[param] = params[param];
    }
};
// This required function is called when a workspace tile is loaded
Toyz.Template.Contents.prototype.set_tile = function(settings){
    console.log('settings', settings);
    // Add some initialization function here based on the settings
};
// This required function is called when a data source is updated
Toyz.Template.Contents.prototype.rx_info = function(options){
    // If this tile uses a common workspace data source perform some actions here
};
// This function is called when a workspace is saved and is used to save the 
// current tiles settings
Toyz.Template.Contents.prototype.save = function(options){
    console.log('saving tile', this.tile.id, this.type);
    // functions here to save the tile
};
// Often it is common to have additional options added to the context (right-click) menu for
// a tile, but still keep the default options of a general tile as well
Toyz.Template.Contents.prototype.contextMenu_items = function(){
    var items = $.extend(true,{
        option1: {
            name: "First Option", 
            callback: function(key, options){
                console.log('key', key);
                console.log('options', options);
                alert('You chose '+key)
            }.bind(this)
        },
        option2: {
            name: "Second Option", 
            callback: function(key, options){
                console.log('key', key);
                console.log('options', options);
                alert('You chose '+key);
            }.bind(this)
        },
        template_sep1: "--------------",
    }, Toyz.Workspace.tile_contextMenu_items(this.workspace));
    return items;
};


// I like to log a message when the script is loaded to help track bugs
console.log('Toyz Template loaded');