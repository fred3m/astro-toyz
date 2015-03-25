"""
Configuration file required for all new Toyz
"""
from __future__ import division,print_function
import os


import astrotoyz.io

##################
# Custom Methods #
##################

# Root directory of the config.py file
root = os.path.abspath(os.path.join(os.path.dirname(__file__)))

####################
# Required methods #
####################

# List of static and template paths
static_paths = [os.path.join(root, 'static')]
template_paths = [os.path.join(root, 'templates')]

# Tiles added by your toy
workspace_tiles = {
    'astro_viewer': {
        'name': 'Astro Viewer', # Name of the tile to show up in the workspace tiles list
        'namespace': 'Toyz.Astro.Viewer', # Namespace of the template (to check for dependencies)
        'url': '/toyz/static/astrotoyz/viewer.js' # Javascript file to load
    }
}

# Urls to add to the 'Toyz' tab on the home page. The keys are the text that will appear and the
# values are the urls
toyz_urls = {
}

# If any tornado.RequestHandler templates have parameters, special functions to render
# the page must be defined here
render_functions = {
}

# Custom IO modules
io_modules = astrotoyz.io.io_modules
load_functions = {
    'astropy_read': astrotoyz.io.astropy_read
}
save_functions = {
    'astropy_write': astrotoyz.io.astropy_write
}

# Data Types
data_types = {
    'astropy.table.table.Table': astrotoyz.data_types.astropy_table
}

# Source Types
src_types = {
    'Catalog': astrotoyz.catalog.Catalog
}