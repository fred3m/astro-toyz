"""
Tools for Astro-Toyz Viewer
"""
# Copyright 2015 by Fred Moolekamp
# License: LGPLv3
from __future__ import print_function, division

import toyz.web.viewer
from toyz.web import session_vars
import astropy.wcs as pywcs
import astropy.io.fits as pyfits
import numpy as np
import astrotoyz as astro
import astrotoyz.core

def get_wcs(file_info, hdulist):
    """
    Load world coordinates for the current FITS image
    """
    set_wcs_info = False
    if not hasattr(session_vars, 'wcs_info'):
        session_vars.wcs_info = {}
        set_wcs_info = True
    elif (file_info['filepath'] != session_vars.wcs_info['filepath'] or
            int(file_info['frame']) != session_vars.wcs_info['frame']):
        set_wcs_info = True
    if set_wcs_info==True:
        frame = int(file_info['frame'])
        session_vars.wcs_info['filepath'] = file_info['filepath']
        session_vars.wcs_info['frame'] = frame
        session_vars.wcs_info['wcs'] = pywcs.WCS(hdulist[frame].header)
    return session_vars.wcs_info['wcs']

def get_img_data(data_type, file_info, img_info, **kwargs):
    """
    Get data from an image or FITS file
    """
    # First try to fit the data, since the get_2d_fit will center the image at 
    # mean position of the fit
    response = {}
    if 'fit_type' in kwargs:
        fit_response = get_2d_fit(
            file_info, kwargs['fit_type'], kwargs['x'], kwargs['y'], 
            kwargs['width'], kwargs['height'])
        if fit_response['status']=='success':
            kwargs['x'] = int(round(fit_response['fit']['x']))
            kwargs['y'] = int(round(fit_response['fit']['y']))
    # Call regular toyz viewer function to get default information
    response = toyz.web.viewer.get_img_data(data_type, file_info, img_info, **kwargs)
    if 'fit_type' in kwargs and fit_response['status']=='success':
        response.update(fit_response['fit'])
    
    # Now add WCS info
    if file_info['ext']=='fits':
        hdulist = toyz.web.viewer.get_file(file_info)
        data = hdulist[int(img_info['frame'])].data
        wcs = get_wcs(file_info, hdulist)
        if data_type == 'datapoint':
            if (kwargs['x']<data.shape[1] and kwargs['y']<data.shape[0] and
                    kwargs['x']>=0 and kwargs['y']>=0):
                if wcs!=None:
                    wcs_array = wcs.all_pix2world(np.array([[kwargs['x'],kwargs['y']]]),1)
                    response['ra'] = wcs_array[0][0]
                    response['dec'] = wcs_array[0][1]
    return response

def get_img_info(file_info, img_info, **kwargs):
    if file_info['ext']=='fits':
        hdulist = toyz.web.viewer.get_file(file_info)
        hdu = hdulist[int(file_info['frame'])]
        try:
            coord_ranges=[map(int,coord_range.split(':')) for 
                coord_range in hdu.header['DETSEC'][1:-1].split(',')]
        except KeyError:
            coord_ranges=[[1,hdu.data.shape[1]],[1,hdu.data.shape[0]]]
        img_info['coord_range'] = {
            'x': coord_ranges[0],
            'y': coord_ranges[1]
        }
    return img_info

def get_2d_fit(file_info, fit_type, x, y, width, height, **kwargs):
    hdulist = toyz.web.viewer.get_file(file_info)
    wcs = get_wcs(file_info, hdulist)
    hdu = hdulist[int(file_info['frame'])]
    
    # Load user specified tile
    dx = width>>1
    dy = height>>1
    xmin = max(0, x-dx)
    ymin = max(0, y-dy)
    xmax = min(hdu.data.shape[1], x+dx)
    ymax = min(hdu.data.shape[0], y+dy)
    init_data = hdu.data[ymin:ymax,xmin:xmax]
    # Center the tile on the pixel with the highest value
    y_center,x_center = np.unravel_index(init_data.argmax(),init_data.shape)
    xmin = max(0, xmin+x_center-dx)
    ymin = max(0, ymin+y_center-dy)
    xmax = min(hdu.data.shape[1], xmin+width+1)
    ymax = min(hdu.data.shape[0], ymin+height+1)
    data = hdu.data[ymin:ymax,xmin:xmax]
    
    fit, pcov = astro.detect_sources.fit_types[fit_type](data)
    param_map = astro.detect_sources.fit_dtypes[fit_type]
    
    if len(param_map)!=len(fit):
        raise astrotoyz.core.AstroToyzError("Fit parameters did not match parameter map")
    if len(fit)>0:
        params = {value[0]:fit[n] for n, value in enumerate(param_map)}
        params['x'] = xmin+params['x']
        params['y'] = ymin+params['y']
        params['coords'] = str(params['x'])+', '+str(params['y'])
        if wcs!=None:
            wcs_array = wcs.all_pix2world(np.array([[params['x'], params['y']]]),1)
            params['ra'] = wcs_array[0][0]
            params['dec'] = wcs_array[0][1]
        response = {
            'id': 'get_2d_fit',
            'status': 'success',
            'fit': params
        }
    else:
        response = {
            'id': 'get_2d_fit',
            'status': 'fit failed',
            'fit': {}
        }
    return response