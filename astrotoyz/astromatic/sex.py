"""
Yet another Sextractor wrapper for python, this one compatible with Toyz
"""
from __future__ import print_function, division
from toyz.utils.errors import ToyzError
import subprocess
import os

class AstroSexError(ToyzError):
    pass

def get_version():
    """
    Parse output for Sextractor version and date
    """
    try:
        p = subprocess.Popen('sex', shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    except:
        raise AstroSexError("Unable to run sextractor. "
            "Please check that it is installed correctly")
    for line in p.stdout.readlines():
        line_split = line.split()
        if 'version' in line_split:
            version_idx = line_split.index('version')
            version = line_split[version_idx+1]
            date = line_split[version_idx+2]
            break
    return version, date

def get_params(param_file=None, remove_comments=True):
    """
    Get parameters from default file or user specified file.
    """
    if param_file is None:
        try:
            p = subprocess.Popen('sex -dp', shell=True, stdout=subprocess.PIPE, 
                stderr=subprocess.STDOUT)
        except:
            raise AstroSexError("Unable to run sextractor. "
                "Please check that it is installed correctly")
        all_params = p.stdout.readlines()
    else:
        f = open(param_file, 'r')
        all_params = f.readlines()
    params = {}
    param_order = []
    for line in all_params:
        line_split = line.split()
        if not remove_comments or line[0]!='#':
            param = line_split[0].lstrip('#')
            lbl = ' '.join(line_split[1:-1])
            units = line_split[-1]
            # For a parameter without units, add the last word to the label
            if units[0]!='[' or units[-1]!=']':
                lbl += ' '+units
                units = ''
            else:
                units = units[1:-1]
            params[param] = {
                'lbl': lbl,
                'units': units
            }
            param_order.append(param)
    return params, param_order

def get_config(return_all=False, config_file=None, extended=True):
    """
    Get configuration parameters from the default or a user specified config file.
    If the user specified ``return_all=True`` the function will return a dictionary
    with the sections, parameters in each section , default values, and descriptions
    for all of the paremters.
    
    Otherwise the function will just return a dict of key:value pairs that give default
    values for each parameter
    """
    if config_file is None:
        config_cmd = 'sex -d'
        if extended:
            config_cmd += 'd'
        try:
            p = subprocess.Popen(config_cmd, shell=True, stdout=subprocess.PIPE, 
                stderr=subprocess.STDOUT)
        except:
            raise AstroSexError("Unable to run sextractor. "
                "Please check that it is installed correctly")
        config = p.stdout.readlines()
    else:
        f = open(config_file, 'r')
        config = f.readlines()
    params = {}
    sections = []
    current_section = ''
    values = {}
    for line in config:
        if line.startswith('#-'):
            line_split = line.split()
            current_section = ' '.join(line_split[1:-1])
            sections.append(current_section)
            params[current_section] = []
        elif len(line.split('#'))>1 and not line.startswith('#'):
            if line.startswith(' '):
                params[current_section][-1]['lbl']+=' '+line.strip().split('#')[1].strip()
            else:
                param = line[:17].strip()
                default = line[17:32].strip()
                params[current_section].append({
                    'param': param,
                    'default': default,
                    'lbl': line[32:].strip('#').strip()
                })
                values[param] = default
    if return_all:
        return params, sections
    else:
        return values

def build_param_gui():
    """
    Build a gui for a SExtractor parameters file.
    """
    params, param_order = get_params(remove_comments=False)
    gui = {
        'type': 'div',
        'params': {
            p: {
                'lbl': p,
                'prop': {
                    'title': params[p]['lbl']+'('+params[p]['units']+')',
                    'type': 'checkbox',
                    'checked': False
                }
            }
            for p in params
        }
    }
    return gui, param_order

def extract_tbl(filename, n):
    from astropy.table import Table
    tbl = Table.read(filename, hdu=n*2)
    if 'EXT_NUMBER' not in tbl.colnames:
        tbl['EXT_NUMBER'] = n
    return tbl

def get_ldac_catalog(filename, frame=None):
    """
    Load a SExtractor FITS_LDAC catalog and its configuration parameters. If the user specifies
    a frame, only return the catalog for that frame
    """
    from astropy.table import vstack
    import astropy.io.fits as pyfits
    import numpy as np
    from collections import OrderedDict
    
    cat = pyfits.open(filename)
    hdu_count = (len(cat)-1)/2
    if int(hdu_count)!=hdu_count:
        raise AstroSexError("Unexpected number of columns in catalog file")
    hdu_count = int(hdu_count)
    
    # Extract the SExtractor info from the catalog
    info = cat[1].data[0][0]
    info = info[np.core.defchararray.startswith(info, 'SEX')]
    meta = OrderedDict()
    for i in info:
        k, v  = i.split('=')
        val_split = v.split('/')
        val = val_split[0].strip()
        desc = ' '.join(val_split[1:]).strip()
        meta[k.strip()] = {
            'value': val,
            'description': desc
        }
    
    if frame is None:
        data = extract_tbl(filename, 1)
        # Extract Table info from the catalog
        for n in range(1,hdu_count+1):
            new_data = extract_tbl(filename, n)
            data = vstack([data, new_data])
    else:
        data = extract_tbl(filename, frame)
    
    return meta, data
    
def run_sextractor(filename, temp_path, config, params=None, frames=None, config_file=None,
        store_output=True, sex_cmd='sex'):
    """
    Run SExtractor given a set of parameters and config options
    """
    import toyz.utils.core
    import os.path
    # If the user did not specify a params file, create one in the temp directory and 
    # update the config parameters
    if 'PARAMETERS_NAME' not in config:
        param_name = os.path.join(temp_path, 'sex.param')
        f = open(param_name, 'w')
        for p in params:
            f.write(p+'\n')
        f.close()
        config['PARAMETERS_NAME'] = param_name
    # Check that the user chose a valid filename
    if not os.path.isfile(filename):
        raise AstroSexError("Image file not found")
    if frames is not None:
        filenames = []
        for f in frames.split(','):
            filenames.append(filename+'['+str(int(f)-1)+']')
    else:
        filenames = [filename]
    # If the user specified a config file, use it
    if config_file is not None:
        sex_cmd += ' -c '+config_file
    # Add on any user specified parameters
    for param in config:
        if isinstance(config[param], bool):
            if config[param]:
                val='Y'
            else:
                val='N'
        else:
            val = config[param]
        sex_cmd += ' -'+param+' '+val
    
    # Run SExtractor
    for f in filenames:
        this_cmd = sex_cmd+' '+f
        print(this_cmd, '\n')
        if store_output:
            p = subprocess.Popen(this_cmd, shell=True, stdout=subprocess.PIPE, 
                stderr=subprocess.STDOUT)
        else:
            subprocess.call(this_cmd, shell=True)
    
    status =  'success'
    
    if store_output:
        output = p.stdout.readlines()
        for line in output:
            if 'error' in line.lower():
                status = line
                break
    
    return status