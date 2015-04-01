"""
Tasks that can be run from a Toyz web application
"""
# Copyright 2015 by Fred Moolekamp
# License: LGPLv3
from __future__ import division,print_function
import os

from toyz.utils import core
from toyz.utils.errors import ToyzJobError
import astrotoyz as astro
from toyz.web import session_vars

def get_img_info(toyz_settings, tid, params):
    """
    Get image info specific to astronomy FITS images (like physical coords, wcs, etc.)
    """
    core.check4keys(params, ['file_info', 'img_info'])
    response = {
        'id': 'get_img_info',
        'img_info': astro.viewer.get_img_info(**params)
    }
    return response

def get_img_data(toyz_settings, tid, params):
    """
    Get data from an image or FITS file
    """
    core.check4keys(params, ['data_type', 'file_info', 'img_info'])
    response = astro.viewer.get_img_data(**params)
    return response

def get_2d_fit(toyz_settings, tid, params):
    """
    Get desired fit for 2d data array
    """
    import numpy as np
    core.check4keys(params, ['file_info', 'fit_type', 'x', 'y', 'width', 'height'])
    response = astro.viewer.get_2d_fit(**params)
    return response

def create_catalog(toyz_settings, tid, params):
    """
    Save a catalog
    """
    core.check4keys(params, ['settings', 'cid'])
    catalog = astro.catalog.get_catalog(create='yes', **params)
    # Store the catalog in the session for future use
    session_vars.catalogs[catalog.cid] = catalog
    # Translate the dataframe to a format that can be JSON encoded
    # (this includes translating NaN values to strings that will be
    # translated back to NaN in the client)
    index = list(catalog.index.names)
    dataframe = {
        'columns': index+catalog.columns.values.tolist(),
        'index': index,
        'data': catalog.astype(object).fillna('NaN').values.tolist()
    }
    cat_info = {
        'cid': catalog.cid,
        'name': catalog.name,
        'settings': catalog.settings,
        'dataframe': dataframe
    }
    response = {
        'id': 'create_catalog',
        'cat_info': cat_info
    }
    return response

def save_catalog(toyz_settings, tid, params):
    """
    Save a catalog
    """
    core.check4keys(params, ['cid'])
    catalog = astro.catalog.get_catalog(params['cid'], create='fail')
    if 'filepath' in params:
        catalog.save(params['filepath'])
    else:
        catalog.save()
    response = {
        'id': 'save_catalog',
        'status': 'success'
    }
    return response

def select_src(toyz_settings, tid, params):
    """
    Get the nearest source to a given point
    """
    core.check4keys(params, ['cid'])
    catalog = astro.catalog.get_catalog(params['cid'], create='fail')
    src = catalog.select_src(**params)
    if len(src)>0:
        status = 'success'
    else:
        status = 'failed: no source found'
    response = {
        'id': 'select_src',
        'status': status,
        'src': src
    }
    return response

def add_src(toyz_settings, tid, params):
    """
    Add a source to the catalog
    """
    core.check4keys(params, ['cid', 'file_info', 'src_info'])
    catalog = astro.catalog.get_catalog(params['cid'], create='fail')
    del params['cid']
    src = catalog.add_src(**params)
    response = {
        'id': 'add_src',
        'src': src
    }
    if len(src)>0:
        response['status'] = 'success'
    else:
        response['status'] = 'failed: source already exists'
    #print('catalog after added source')
    #print(catalog)
    return response

def delete_src(toyz_settings, tid, params):
    """
    Delete a source from the catalog
    """
    core.check4keys(params, ['cid', 'src_info'])
    catalog = astro.catalog.get_catalog(params['cid'], create='fail')
    status = catalog.delete_src(params['src_info'])
    response = {'id': 'delete_src'}
    if status is True:
        response['status'] = 'success'
    else:
        response['status'] = 'failed'
    return response

def detect_sources(toyz_settings, tid, params):
    """
    Detect sources and create an object catalog in the current session
    """
    core.check4keys(params,['file_info', 'cid', 'settings'])
    catalog = astro.catalog.detect_sources(**params)
    #print('catalog', catalog)
    #print('catlog shape', catalog.shape)
    print('generating response')
    response = {
        'id': 'detect_sources',
        'sources': catalog.get_markers(),
        'settings': catalog.settings
    }
    print('response', response)
    return response

def wcs2px(toyz_Settings, tid, params):
    """
    Align all images in the viewer with the world coordinates of the current image
    """
    import toyz.web
    from astrotoyz.viewer import get_wcs
    import numpy as np
    print('filepath:', params['file_info']['filepath'],'\n\n')
    core.check4keys(params, ['file_info', 'img_info', 'ra', 'dec'])
    hdulist = toyz.web.viewer.get_file(params['file_info'])
    wcs = get_wcs(params['file_info'], hdulist)
    if wcs is None:
        raise astrotoyz.core.AstroToyzError('Unable to load WCS for the current image')
    data = hdulist[int(params['file_info']['frame'])].data
    ra = params['ra']
    dec = params['dec']
    wcs_array = wcs.wcs_world2pix(np.array([[ra, dec]]), 1)
    response = {
        'id': 'wcs2px',
        'x': int(round(wcs_array[0][0])),
        'y': int(round(wcs_array[0][1])),
        # next two lines for testing
        'ra': ra,
        'dec': dec
    }
    print('px coords response', response)
    return response

def load_sextractor(toyz_settings, tid, params):
    """
    Load sextractor configuration and parameters
    """
    import astrotoyz.sex as sex
    params, param_order = sex.build_param_gui()
    response = {
        'id': 'load_sextractor',
        'params': params,
        'param_order': param_order
    }
    return response

def run_sextractor(toyz_settings, tid, params):
    """
    Run sextractor using parameters defined in the client
    """
    import astrotoyz.sex
    import toyz.utils.db
    import shutil
    
    core.check4keys(params, ['config', 'params', 'filename'])
    shortcuts = toyz.utils.db.get_param(toyz_settings.db, 'shortcuts', user_id=tid['user_id'])
    # Just in case the user did something dumb, like remove his/her temp path
    if 'temp' not in shortcuts:
        raise ToyJobError("You removed your 'temp' shortcut, DON'T DO THAT!" +
            "Refresh your browser and it will be restored")
    # Create a path for temporary files that will be erased once this has been completed
    temp_path = os.path.join(shortcuts['temp'], tid['session_id'], str(tid['request_id']))
    core.create_paths(temp_path)
    # Run SExtractor
    params['temp_path'] = temp_path
    result = astrotoyz.sex.run_sextractor(**params)
    # Remove the temporary path form the server
    #shutil.rmtree(temp_path)
    
    if result!='success':
        response = {
            'id': 'ERROR',
            'error': result
        }
    else:
        response = {
            'id': 'run_sextractor',
            'result': result
        }
    return response