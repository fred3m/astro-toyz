"""
Data Types for astrotoyz
"""
from __future__ import division,print_function
from toyz.utils.errors import ToyzError

class AstroDataError(ToyzError):
    pass

def name_columns(src, columns=None):
    if columns is not None:
        table_cols = src.data.col_names
        if len(columns) != len(table_cols):
            raise AstroDataError("Number of new columns does not match number of table columns")
        for n,col in enumerate(columns):
            src.data.rename_column(table_cols[n], col)
        src.columns = columns
    else:
        src.columns = src.data.col_names
    return src.data.col_names

def rename_column(src, old_column, new_column):
    if old_column not in src.data.col_names:
        raise AstroDataError("Column name not found in data")
    src.data.rename_column(old_column, new_column)

def check_instance(src, data):
    from astropy.table import Table
    return isinstance(data, Table)

def set_data(src, data, data_type, data_kwargs={}):
    from astropy.table import Table
    src.data = Table(data, **data_kwargs)
    src.data_type = 'astropy.table.table.Table'

def to_dict(data, columns):
    def isnan(x):
        if np.isnan(x):
            return 'NaN'
        else:
            return x
    import numpy as np
    data_dict = {col: map(isnan, np.array(data[col]).tolist()) for col in columns}
    return data_dict

def remove_rows(data, points):
    data.remove_rows(points)