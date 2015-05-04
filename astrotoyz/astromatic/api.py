"""
API for E. Bertin's Astromatic software suite
"""
from __future__ import print_function, division
from toyz.utils.errors import ToyzError
import subprocess
import os

codes = {
    'Eye': 'eye', 
    'MissFITS': 'missfits', 
    'PSFEx': 'psfex', 
    'SCAMP': 'scamp', 
    'SExtractor': 'sex', 
    #'SkyMaker': '', 
    'STIFF': 'stiff',
    #'Stuff': '',
    'SWarp': 'swarp',
    'WeightWatcher': 'ww'
}

class AstromaticError(ToyzError):
    pass

class Astromatic:
    """
    Class to hold config options for an Astrometric code. 
    """
    def __init__(self, code, temp_path=None, config={}, config_file=None, store_output=False, 
            **kwargs):
        self.code = code
        if code not in codes:
            print("Warning: '{0} not in Astromatic codes, you will need to specify " +
                "a 'cmd' to run".format(code))
        self.temp_path = temp_path
        self.config = config
        self.config_file = config_file
        self.store_output = store_output
        for k, v in kwargs.items():
            setattr(self, k, v)
    
    def build_cmd(self, filenames, **kwargs):
        """
        Build a command to run an astromatic code.
        """
        # If a single catalog is passed, convert to an array
        if not isinstance(filenames, list):
            filenames = [filenames]
        # Update kwargs with any missing variables
        for attr, attr_val in vars(self).items():
            if attr not in kwargs:
                kwargs[attr] = attr_val
        # If the user did not specify a params file, create one in the temp directory and 
        # update the config parameters
        if kwargs['code']=='SExtractor':
            if 'PARAMETERS_NAME' not in kwargs['config']:
                if 'temp_path' not in kwargs:
                    raise AstromaticError(
                        "You must either supply a 'PARAMETERS_NAME' in 'config' or "+
                        "a 'temp_path' to store the temporary parameters file")
                param_name = os.path.join(kwargs['temp_path'], 'sex.param')
                f = open(param_name, 'w')
                if 'params' not in kwargs:
                    raise AstromaticError(
                        "To run SExtractor yo must either supply a 'params' list of parameters "+
                        "or a config keyword 'PARAMETERS_NAME' that points to a parameters file")
                for p in kwargs['params']:
                    f.write(p+'\n')
                f.close()
                kwargs['config']['PARAMETERS_NAME'] = param_name
        # Get the correct command for the given code (if one is not specified)
        if 'cmd' not in kwargs:
            if kwargs['code'] not in codes:
                raise AstromaticError(
                    "You must either supply a valid astromatic 'code' name or "+
                    "a 'cmd' to run")
            cmd = codes[kwargs['code']]
        else:
            cmd = kwargs['cmd']
        if cmd[-1]!=' ':
            cmd += ' '
        # Append the filename(s) that are run by the code
        cmd += ' '.join(filenames)
        # If the user specified a config file, use it
        if kwargs['config_file'] is not None:
            cmd += ' -c '+kwargs['config_file']
        # Add on any user specified parameters
        for param in kwargs['config']:
            if isinstance(kwargs['config'][param], bool):
                if kwargs['config'][param]:
                    val='Y'
                else:
                    val='N'
            else:
                val = kwargs['config'][param]
            cmd += ' -'+param+' '+val
        return (cmd, kwargs)
    
    def run(self, filenames, **kwargs):
        """
        Run the given Astromatic code
        """
        this_cmd, kwargs = self.build_cmd(filenames, **kwargs)
        # Run code
        print(this_cmd, '\n')
        if kwargs['store_output']:
            p = subprocess.Popen(this_cmd, shell=True, stdout=subprocess.PIPE, 
                stderr=subprocess.STDOUT)
        else:
            subprocess.call(this_cmd, shell=True)
        
        status =  'success'
        # Check for errors
        if kwargs['store_output']:
            output = p.stdout.readlines()
            for line in output:
                if 'error' in line.lower():
                    status = line
                    break
            return output
        return status
    
    def run_sex_frames(self, filenames, frames='1', show_all_cmds=False, **kwargs):
        """
        Run sextractor on individual frames
        """
        this_cmd, kwargs = self.build_cmd(filenames, **kwargs)
        if not show_all_cmds:
            print('base command:\n', this_cmd)
        if 'FLAG_IMAGE' in kwargs['config']:
            flag_img = kwargs['config']['FLAG_IMAGE']
        else:
            flag_img = None
        if 'WEIGHT_IMAGE' in kwargs['config']:
            weight_img = kwargs['config']['WEIGHT_IMAGE']
        else:
            weight_img = None
        for frame in frames.split(','):
            new_cmd = this_cmd
            frame_str = '['+frame+']'
            # Convert all multi-extension files to filenames with the same frame specified
            if not isinstance(filenames, list):
                filenames = [filenames]
            for filename in filenames:
                new_cmd = new_cmd.replace(filename, filename+frame_str)
            if flag_img is not None:
                new_cmd = new_cmd.replace(flag_img, flag_img+frame_str)
            if weight_img is not None:
                new_cmd = new_cmd.replace(weight_img, weight_img+frame_str)
            if show_all_cmds:
                print(new_cmd, '\n')
            # Run code
            if kwargs['store_output']:
                p = subprocess.Popen(new_cmd, shell=True, stdout=subprocess.PIPE, 
                    stderr=subprocess.STDOUT)
            else:
                subprocess.call(new_cmd, shell=True)
    
        status =  'success'
        # Check for errors
        if kwargs['store_output']:
            output = p.stdout.readlines()
            for line in output:
                if 'error' in line.lower():
                    status = line
                    break
        return status
    def get_version(self, cmd=None):
        # Get the correct command for the given code (if one is not specified)
        if cmd is None:
            if self.code not in codes:
                raise AstromaticError(
                    "You must either supply a valid astromatic 'code' name or a 'cmd'")
            cmd = codes[self.code]
        if cmd[-1]!=' ':
            cmd += ' '
        cmd += '-v'
        try:
            p = subprocess.Popen('sex', shell=True, stdout=subprocess.PIPE, 
                stderr=subprocess.STDOUT)
        except:
            raise AstroSexError("Unable to run '{0}'. "
                "Please check that it is installed correctly".format(cmd))
        for line in p.stdout.readlines():
            line_split = line.split()
            line_split = map(lambda x: x.lower(), line_split)
            if 'version' in line_split:
                version_idx = line_split.index('version')
                version = line_split[version_idx+1]
                date = line_split[version_idx+2]
                date = date.lstrip('(').rstrip(')')
                break
        return version, date