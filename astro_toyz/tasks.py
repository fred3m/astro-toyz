"""
Tasks that can be run from a Toyz web application
"""
# Copyright 2015 by Fred Moolekamp
# License: LGPLv3
from __future__ import division,print_function

from toyz.utils import core
from toyz.utils.errors import ToyzJobError
import astro_toyz as astro

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
    