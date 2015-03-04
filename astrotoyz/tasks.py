"""
Tasks that can be run from a Toyz web application
"""
# Copyright 2015 by Fred Moolekamp
# License: LGPLv3
from __future__ import division,print_function

from toyz.utils import core
from toyz.utils.errors import ToyzJobError
import astrotoyz as astro
from toyz.web import session_vars

def get_img_info(toyz_settings, pipe, tid, params):
    """
    Get image info specific to astronomy FITS images (like physical coords, wcs, etc.)
    """
    core.check4keys(params, ['file_info', 'img_info'])
    response = {
        'id': 'get_img_info',
        'img_info': astro.viewer.get_img_info(**params)
    }
    return response

def get_img_data(toyz_settings, pipe, tid, params):
    """
    Get data from an image or FITS file
    """
    core.check4keys(params, ['data_type', 'file_info', 'img_info'])
    response = astro.viewer.get_img_data(**params)
    return response

def get_2d_fit(toyz_settings, pipe, tid, params):
    """
    Get desired fit for 2d data array
    """
    import numpy as np
    core.check4keys(params, ['file_info', 'fit_type', 'x', 'y', 'width', 'height'])
    response = astro.viewer.get_2d_fit(**params)
    return response

def create_catalog(toyz_settings, pipe, tid, params):
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

def save_catalog(toyz_settings, pipe, tid, params):
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

def select_src(toyz_settings, pipe, tid, params):
    """
    Get the nearest source to a given point
    """
    core.check4keys(params, ['cid'])
    catalog = astro.catalog.get_catalog(params['cid'], create='fail')
    src = catalog.select_src(params['src_info'])
    response = {
        'id': 'select_src',
        'src': src
    }
    return response

def add_src(toyz_settings, pipe, tid, params):
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
    print('catalog after added source')
    print(catalog)
    return response

def delete_src(toyz_settings, pipe, tid, params):
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