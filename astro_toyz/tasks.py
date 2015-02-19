"""
Tasks that can be run from a Toyz web application
"""
from __future__ import division,print_function

from toyz.utils import core
from toyz.utils.errors import ToyzJobError

def sample_function(toyz_settings, tid, params):
    """
    Sample function that can be run by a Toyz web application. All task function must have the
    following parameters (and only the following parameters) and a response
    
    Parameters
        - toyz_settings ( :py:class:`toyz.utils.core.ToyzSettings`): Settings for the toyz 
          application
        - tid (*string* ): Task ID of the client user running the task
        - params (*dict* ): Any parameters sent by the client (see *params* below)
    
    Response
        - id: 'sample_function'
        - Additional keys can also be listed in the response for information passed to the client
    """
    # Check to make sure that the user has specified all mandatory parameters
    core.check4keys(params, ['x', 'y', 'z'])
    x = params['x']
    y = params['y']
    z = params['z']
    response = {
        'id': 'sample_function',
        'sum': x+y+z,
        'product': x*y*z,
        'mean': (x+y+z)/3
    }
    
    return response