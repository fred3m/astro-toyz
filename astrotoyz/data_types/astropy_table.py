"""
Data Types for astrotoyz
"""
from __future__ import division,print_function
from toyz.utils.sources import DataSource
from toyz.utils.errors import ToyzError

class AstroDataError(ToyzError):
    pass

class AstropyTable(DataSource):
    def __init__(self, *args, **kwargs):
        DataSource.__init__(self, *args, **kwargs)
    def name_columns(self, columns=None):
        print('entered name columns!!!!!!!!!!!!!!!!!!!!!!')
        if columns is not None:
            table_cols = self.data.colnames
            if len(columns) != len(table_cols):
                raise AstroDataError("Number of new columns does not match number of table columns")
            for n,col in enumerate(columns):
                self.data.rename_column(table_cols[n], col)
            self.columns = columns
        else:
            self.columns = self.data.colnames
        return self.data.colnames
    #def rename_column(self, old_column, new_column):
    #    if old_column not in self.data.col_names:
    #        raise AstroDataError("Column name not found in data")
    #    self.data.rename_column(old_column, new_column)
    def check_instance(self, data, data_kwargs={}):
        from astropy.table import Table
        if isinstance(data, Table):
            self.data = Table(data, **data_kwargs)
            self.data_type = 'astropy.table.table.Table'
            return True
        return False
    #def set_data(self, data, data_type, data_kwargs={}):
    #    from astropy.table import Table
    #    self.data = Table(data, **data_kwargs)
    #    self.data_type = 'astropy.table.table.Table'
    def to_dict(self, columns=None):
        import numpy as np
        def isnan(x):
            if np.isnan(x):
                return 'NaN'
            else:
                return x
        if columns is None:
            columns = self.columns
        data_dict = {col: map(isnan, np.array(self.data[col]).tolist()) for col in columns}
        return data_dict
    def remove_rows(self, points):
        self.data.remove_rows(points)