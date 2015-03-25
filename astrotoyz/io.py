"""
IO tools for Astro-Toyz. This is basically a wrapper for astropy's io module to read
and write tables
"""
# Copyright 2015 by Fred Moolekamp
# License: LGPLv3

from toyz.utils.core import merge_dict

# TODO: Complete io_module for all possible astropy file io types
io_modules = {
    'astropy': {
        'ascii': {
            'load': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                    'format': {
                        'lbl': 'format',
                        'type': 'select',
                        'options': [
                            'aastex',
                            'ascii',
                            'ascii.aastex',
                            'ascii.basic',
                            'ascii.cds',
                            'ascii.commented_header',
                            'ascii.daophot',
                            'ascii.ecsv',
                            'ascii.fixed_width',
                            'ascii.fixed_width_no_header',
                            'ascii.fixed_width_two_line',
                            'ascii.html',
                            'ascii.ipac',
                            'ascii.latex',
                            'ascii.no_header',
                            'ascii.rdb',
                            'ascii.sextractor',
                            'ascii.tab',
                            'ascii.csv',
                        ]
                    }
                },
                'optional': {
                    'delimiter': {'lbl': 'delimiter'}
                    # TODO Complete optional parameters for ascii type
                }
            },
            'save': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                    'format': {
                        'lbl': 'format',
                        'type': 'select',
                        'options': [
                            'aastex',
                            'ascii',
                            'ascii.aastex',
                            'ascii.basic',
                            'ascii.cds',
                            'ascii.commented_header',
                            'ascii.daophot',
                            'ascii.ecsv',
                            'ascii.fixed_width',
                            'ascii.fixed_width_no_header',
                            'ascii.fixed_width_two_line',
                            'ascii.html',
                            'ascii.ipac',
                            'ascii.latex',
                            'ascii.no_header',
                            'ascii.rdb',
                            'ascii.sextractor',
                            'ascii.tab',
                            'ascii.csv',
                        ]
                    }
                }
            },
            'load2save': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'save2load': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'load_fn': 'astropy_read',
            'save_fn': 'astropy_write'
        },
        'cds': {
            'load': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'save': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'load2save': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'save2load': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'load_fn': 'astropy_read',
            'save_fn': 'astropy_write'
        },
        'daophot': {
            'load': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'save': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'load2save': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'save2load': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'load_fn': 'astropy_read',
            'save_fn': 'astropy_write'
        },
        'fits': {
            'load': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'save': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'load2save': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'save2load': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'load_fn': 'astropy_read',
            'save_fn': 'astropy_write'
        },
        'hdf5': {
            'load': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                    'path': {'lbl': 'path'}
                }
            },
            'save': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                    'path': {'lbl': 'path'},
                    'append': {
                        'lbl': 'append',
                        'prop': {
                            'type': 'checkbox',
                            'checked': False
                        }
                    },
                    'overwrite': {
                        'lbl': 'append',
                        'prop': {
                            'type': 'checkbox',
                            'checked': False
                        }
                    }
                }
            },
            'load2save': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'save2load': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'load_fn': 'astropy_read',
            'save_fn': 'astropy_write'
        },
        'html': {
            'load': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'save': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'load2save': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'save2load': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'load_fn': 'astropy_read',
            'save_fn': 'astropy_write'
        },
        'ipac': {
            'load': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'save': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'load2save': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'save2load': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'load_fn': 'astropy_read',
            'save_fn': 'astropy_write'
        },
        'latex': {
            'load': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'save': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'load2save': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'save2load': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'load_fn': 'astropy_read',
            'save_fn': 'astropy_write'
        },
        'rdb': {
            'load': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'save': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'load2save': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'save2load': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'load_fn': 'astropy_read',
            'save_fn': 'astropy_write'
        },
        'votable': {
            'load': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'save': {
                'type': 'div',
                'params': {
                    'filename': {
                        'lbl': 'filename',
                        'file_dialog': True
                    },
                }
            },
            'load2save': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'save2load': {
                'remove': [],
                'warn': {},
                'convert': {}
            },
            'load_fn': 'astropy_read',
            'save_fn': 'astropy_write'
        }
    }
}

def astropy_read(file_type, **file_options):
    """
    Read into an astropy table
    """
    from astropy.table import Table
    filename = file_options['filename']
    options = merge_dict({}, file_options)
    del options['filename']
    # Make sure to use the proper format
    if file_type!='ascii':
        options['format'] = file_type
    data = Table.read(filename, **options)
    return data

def astropy_write(data, file_type, **file_options):
    """
    Write an astropy table to a file
    """
    from astropy.table import Table
    filename = file_options['filename']
    options = merge_dict({}, file_options)
    del options['filename']
    # Make sure to use the proper format
    if file_type!='ascii':
        options['format'] = file_type
    data.write(filename, **options)