"""
Catalog Tools for Astro-Toyz.
For now, all catalogs are stored in a sqlite database in the web app's db directory.
In the future a more robust I/O module will be implemented to allow users
more flexibility in reading and saving their object catalogs
"""
# Copyright 2015 by Fred Moolekamp
# License: LGPLv3
from __future__ import print_function, division
import os
import pandas
import numpy as np
import json
from datetime import datetime

from toyz.web import session_vars
import toyz.utils.core
import astrotoyz.core

# TODO: Remove this part of the code when a more robust API is created
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, backref
Base = declarative_base()
from sqlalchemy.orm import sessionmaker

def get_catalog(cid, create='yes', **kwargs):
    """
    Get a catalog loaded into session_vars or try to load a saved catalog.
    
    Parameters
        settings (*dict* ):
            - Dictionary of settings for the catalog
        create (*bool* ):
            - Describes action if the catalog does not exist.
            - If ``create='yes'`` an empty catalog is created using ``settings``
            - If ``create='no'`` a None object is returned
            - If ``create='fail'`` an AstroJobError is raised
    """
    if hasattr(session_vars, 'catalogs'):
        if cid in session_vars.catalogs:
            return session_vars.catalogs[cid]
    else:
        session_vars.catalogs = {}
    # Check the catalogs database for a catalog
    # TODO: change the following lines to:
    # if os.path.exists(os.path.join(settings['file_info']['filepath'])):
    try:
        settings = kwargs['settings']
        filepath = settings['file_info']['filepath']
    except KeyError:
        raise astrotoyz.core.AstroToyzError(
            "You must supply a dict of catalog settings with a filepath to "+
            "load or create a catalog")
    catalog = None
    if filepath!='':
        engine = create_engine(filepath) # connects to the db
        Base.metadata.bind = engine # binds the metadata to the engine
        if cid in Base.metadata.tables.keys():
            catalog = load_catalog(settings['file_info'])
    # If the catalog couldn't be loaded, use 'create' to determine what to do
    if catalog is None:
        if create=='yes':
            #init_catalog_db(settings['file_info']['filepath'])
            catalog = Catalog(cid=cid, **kwargs)
        elif create=='no':
            catalog = None
        elif create=='fail':
            raise astrotoyz.core.AstroToyzError("Catalog could not be loaded")
        else:
            raise astrotoyz.core.AstroToyzError("Unrecognized 'create' value '{0}'".format(create))
    return catalog    

def update_catalog(cid, settings, changes):
    """
    If a catalog is saved in session_vars, update it with any changes from the client.
    If the catalog has not been saved in session_vars, the catalog is saved there
    """
    catalog = get_catalog(cid, settings, 'yes')
    if len(changes)>0:
        for change in changes:
            if change['action'] == 'add_src':
                catalog.add_src(change['info'])
            elif change['action'] == 'delete_src':
                catalog.delete_src(change['info'])
            else:
                ToyzJobError("Change action '{0}' is not supported".format(change['action']))
    print('catalog after updates:', catalog)

def build_src_info(catalog, src_info, file_info):
    """
    Default function to build a catalog id by combining the ``ra`` and ``dec`` fields
    (if available) or ``x`` and ``y`` fields into a coordinate pair
    """
    cid_name = catalog.settings['data']['cid_name']
    ra_name = catalog.settings['data']['ra_name']
    dec_name = catalog.settings['data']['dec_name']
    if ra_name!='ra' and 'ra' in src_info:
        src_info[ra_name] = src_info['ra']
        del src_info['ra']
    if dec_name!='dec' and 'dec' in src_info:
        src_info[dec_name] = src_info['dec']
        del src_info['dec']
    if ra_name in src_info and dec_name in src_info:
        from astropy.coordinates import SkyCoord
        hdulist = toyz.web.viewer.get_file(file_info)
        hdu = hdulist[int(file_info['frame'])]
        coords = SkyCoord(src_info[ra_name], src_info['dec'], unit='deg')
        src_info[cid_name] = coords.to_string('hmsdms')
    else:
        src_info[cid_name] = "{0:.6f},{0:.6f}".format(src_info['x'], src_info['y'])
    return src_info

class CatalogMeta(Base):
    """
    Table containing meta data for all catalog tables in the database
    """
    __tablename__ = 'catalog_meta'
    id = Column(Integer, primary_key=True)
    cid = Column(String, index=True, unique=True)
    name = Column(String)
    settings = Column(String)

class CatalogLog(Base):
    """
    Table containing logs for each catalog in the database
    """
    __tablename__ = 'catalog_logs'
    id = Column(Integer, primary_key=True)
    action = Column(String)
    log = Column(String)
    cid = Column(Integer, ForeignKey('catalog_meta.cid'), index=True)
    catalog_meta = relationship(CatalogMeta, backref=backref('log', uselist=True))

def init_catalog_db(connect_str):
    """
    Use sqlalchemy to connect to the DB specified by ``connect_str``. 
    """
    engine = create_engine(connect_str) # connects to the db
    Base.metadata.bind = engine # binds the metadata to the engine
    Base.metadata.create_all(engine)

def load_catalog(file_info, load_log=False):
    """
    Load a catalog file. For now this exclusively uses an alchemy connection
    to a DB but in the future this will have methods for various file types,
    or at the very least an export function.
    
    The biggest complication is that in addition to the table information there
    is also metadata (which pandas currently does not support) and a log of
    changes to a catalog.
    """
    cid = file_info['file_settings']['table']
    connect_str = file_info['filepath']
    engine = create_engine(connect_str) # connects to the db
    Base.metadata.bind = engine # binds the metadata to the engine
    if cid not in Base.metadata.tables.keys():
        raise astrotoyz.core.AstroToyzError("Catalog not found in database")
    dataframe = pandas.read_sql_table(cid, engine)
    DBSession = sessionmaker(bind=engine)
    session = DBSession()
    meta = session.query(CatalogMeta).filter(CatalogMeta.cid==cid).first()
    if meta is None:
        raise astrotoyz.core.AstroToyzError("Could not find catalog meta data")
    settings = json.loads(meta.settings)
    if load_log:
        log = pandas.read_sql_query(
            "SELECT * FROM log WHERE cid='{0}'".format(cid),
            engine)
    else:
        log = None
    catalog = Catalog(settings, cid, meta.name, log, dataframe)
    return catalog

class Catalog(pandas.DataFrame):
    """
    Pandas Dataframe with additional methods to store metadata, log information, and
    functions relating to adding/removing point sources
    """
    def __init__(self, settings, cid=None, name=None, log=None, dataframe=None, **kwargs):
        index = None
        if not isinstance(dataframe, pandas.DataFrame):
            df = {}
            if dataframe is not None:
                if 'data' in dataframe:
                    if len(dataframe['data'])>0:
                        df['data'] = np.array(dataframe['data'])
                if 'columns' in dataframe:
                    df['columns'] = dataframe['columns']
                if 'index' in dataframe:
                    index = dataframe['index']
            dataframe = pandas.DataFrame(**df)
        
        pandas.DataFrame.__init__(self, dataframe)
        if index is not None:
            print('index:', index)
            self.set_index(index, inplace=True)
        # Set any additional variables
        for arg in kwargs:
            setattr(self, arg, kwargs[arg])
        # Update Catalog specific attributes
        if cid is not None:
            self.cid = cid
        else:
            if 'cid' in settings:
                self.cid = settings['cid']
                del settings['cid']
            else:
                raise astrotoyz.core.AstroToyzError("You must supply a catalog cid")
        if name is not None:
            self.name = name
        else:
            if 'name' in settings:
                self.name = settings['name']
                del settings['name']
            else:
                self.name = self.cid
        # Store settings
        default_settings = {
            'creation': {
                'creation_time': str(datetime.now()),
                'software_version': {
                    'toyz': 'alpha', # TODO: make toyz.version.version work properly
                    'astrotoyz': 'alpha' # TODO: make astrotoyz.version.version work properly
                }
            },
            'file_info': {
                'filepath': '',
                'file_type': '',
                'file_settings': {}
            },
            'data': {
                'ra_name': 'ra',
                'dec_name': 'dec',
                'cid_name': 'id',
                'min_sep': {
                    'wcs': [1,'arcsec'],
                    'px': 5
                },
                'build_src_info': {
                    'module': 'astrotoyz.catalog',
                    'func': 'build_src_info'
                }
            }
        }
        self.settings = toyz.utils.core.merge_dict(default_settings, settings, True)
        if log is not None:
            self.log = log
        else:
            log = pandas.DataFrame(columns=['cid', 'action', 'entry'])
        self.new_log = pandas.DataFrame(columns=['cid', 'action', 'entry'])
    
    def save(self, filepath=None):
        """
        Save the catalog. If a filepath is specified that is different than the current
        filepath, update the catalogs settings.
        """
        # TODO: Change the following code to allow for more genral file types
        if filepath is None:
            connect_str = self.settings['file_info']['filepath']
        elif filepath != self.settings['file_info']['filepath']:
            connect_str = filepath
            self.settings['file_info']['filepath'] = connect_str
        engine = create_engine(connect_str) # connects to the db
        self.to_sql(self.cid, engine, if_exists='replace', index=False)
        
        # Save meta data and new log entries
        DBSession = sessionmaker(bind=engine)
        session = DBSession()
        # Encode settings dict as a json string
        meta_record = session.query(CatalogMeta).filter(CatalogMeta.cid==self.cid)
        if meta_record.first() is None:
            meta = CatalogMeta(cid=self.cid, name=self.name, 
                           settings=json.dumps(self.settings))
            session.add(meta)
        else:
            meta = meta_record
            meta.update({
                'cid': self.cid,
                'name': self.name,
                'settings': json.dumps(self.settings)
            })
        # Save the new log entries, then add them to the (old) log and clear the new log
        self.new_log.to_sql('log', engine, if_exists='append')
        self.log.append(self.new_log)
        self.new_log = pandas.DataFrame(columns=['action', 'cid', 'entry'])
        session.commit()
        Base.metadata.reflect(engine) # adds the table created by to_sql to the metadata
        Base.metadata.create_all(engine) # updates the metadata with the new tables
        return True
    
    def log(self, action, log):
        """
        Log changes to catalog
        """
        self.new_log.loc[self.new_log.shape[0]] = pandas.Series({
            'cid': self.cid,
            'action': action,
            'log': log
        })
    
    def get_log(self, include_new=True):
        """
        Get the full log for the catalog from the log file. If ``include_new`` is ``True``,
        the changes made since the last save are also stored.
        """
        # TODO: make this work for more general log file types
        engine = create_engine(self.settings['file_info']['filepath']) # connects to the db
        Base.metadata.bind = engine # binds the metadata to the engine
        DBSession = sessionmaker(bind=engine)
        session = DBSession()
        log = session.query(CatalogLog).filterby(cid=self.cid)
        log = [{l.action: l.log} for l in log]
        self.log = log
        if include_new:
            log.extend(self.new_log)
        return log    
    
    def get_min_sep(self):
        """
        Get the minimum separation for a point to be considered a new source
        """
        import astropy.units as u
        # Check to make sure that the source isn't already in the catalog
        if 'min_sep' in self.settings['data']:
            if 'wcs' in self.settings['data']['min_sep']:
                minsep = self.settings['data']['min_sep']['wcs']
                sep = minsep[0]*getattr(u,minsep[1])
            else:
                if 'px' in self.settings['data']['min_sep']:
                    sep = self.settings['data']['min_sep']['px']
                else:
                    sep = 1*u.m
        else:
            sep = 1*u.arcsec
        return sep
    
    def get_src_info(self, **kwargs):
        if (('ra' in kwargs and 'dec' in kwargs) or
                (self.settings['data']['ra_name'] in kwargs and 
                self.settings['data']['dec_name'] in kwargs)):
            src_info = kwargs
        else:
            import astrotoyz.viewer
            import copy
            params = copy.deepcopy(kwargs)
            if 'fit_type' not in params:
                params['fit_type'] = 'elliptical_moffat'
            if 'width' not in params:
                params['width'] = 10
            if 'height' not in params:
                params['height'] = 10
            fit = astrotoyz.viewer.get_2d_fit(**params)
            if fit['status'] == 'success':
                src_info = fit['fit']
            else:
                raise astrotoyz.core.AstroToyzError("Fit did not converge")
        return src_info
    
    def select_src(self, **kwargs):
        """
        Find the object in the catalog the is the nearest neighbor to the current source.
        If the object is within Catalog.settings['minsep'] (``px`` or ``wcs`` depending
        on the coords given) then it is selected
        """
        src_info = self.get_src_info(**kwargs)
        sep = self.get_min_sep()
        idx, d2d, src = self.get_nearest_neighbors(self, coords=src_info)
        if d2d<sep:
            src = {s: src[n] for n,s in enumerate(src.keys())}
        else:
            src = {}
        return src
    
    def add_src(self, src_info, file_info, **kwargs):
        """
        Add a source to to the current catalog if it hasn't already been added.
        Note: ``min_sep`` describes the minimum distance for a point to be considered
        a new source (as opposed to a rounding error). The current default is 5 pixels or 1 arcsec.
        """
        kwargs.update(src_info)
        src_info.update(self.get_src_info(file_info=file_info, **kwargs))
        sep = self.get_min_sep()
        if self.shape[0]>0:
            idx, d2d, src = self.get_nearest_neighbors(self, coords=src_info)
        
        if self.shape[0]==0 or d2d>sep:
            import importlib
            # Call a function to configure the source for the current catalog
            # (this can be a user specified function specified when the catalog
            # was created)
            build_func = self.settings['data']['build_src_info']['func']
            build_module = importlib.import_module(
                self.settings['data']['build_src_info']['module'])
            src_info = getattr(build_module, build_func)(self, src_info, file_info)
            self.loc[self.shape[0]] = pandas.Series(src_info)
            self.log('add_src', src_info)
            return src_info
        return {}
    
    def delete_src(self, src_info):
        """
        Delete a source from the catalog.
        """
        cid_name = self.settings['data']['cid_name']
        row = self[self[cid_name]==src_info[cid_name]]
        self.drop(row.index.values, inplace=True)
        # Notify the user if no matching sources were found
        if len(row)==0:
            return False
        return True
    
    def get_nearest_neighbors(self, coord1=None, coord2=None, coord_type=None, 
            coord_unit=None, coords=None):
        """
        Calls astrotoyz.catalog.get_nearest_neighbors. Since this method is called from
        the catalog object, it allows the user to only specify a 'coords' dictionary that
        contains either 'ra' and 'dec', 'x' and 'y', or the catalogs 'ra_name' and 'dec_name'
        pairs of coordinates and automatically calculates the other fields necessary.
        """
        from astropy.coordinates import SkyCoord
        if coords is None:
            if coord1 is None or coord2 is None or coord_type is None:
                raise astrotoyz.core.AstroToyzError(
                    "Must supply either 'coords' or 'coord1' and 'coord2' and 'coord_type")
        else:
            if (
                self.settings['data']['ra_name'] in coords and 
                self.settings['data']['dec_name'] in coords
            ):
                coord1 = coords[self.settings['data']['ra_name']]
                coord2 = coords[self.settings['data']['dec_name']]
                coord_type = 'wcs'
            elif ('ra' in src_info and 'dec' in src_info and 
                    (coord_type is None or coord_type=='wcs')):
                coord1 = src_info['ra']
                coord2 = src_info['dec']
                coord_type = 'wcs'
            elif ('x' in src_info and 'y' in src_info and
                    (coord_type is None or coord_type=='px')):
                coord1 = src_info['x']
                coord2 = src_info['y']
                coord_type = 'px'
            else:
                raise astrotoyz.core.AstroToyzError(
                    "Adding a source requires a pair of coordinates from 'ra' and 'dec', " +
                    "'x' and 'y', or the catlogs 'ra' and 'dec' fields")
        if coord_type=='wcs':
            if coord_unit is None:
                coord_unit = 'deg'
            cat1 = self[self.settings['data']['ra_name']]
            cat2 = self[self.settings['data']['dec_name']]
            c1 = SkyCoord(ra=coord1, dec=coord2, unit=coord_unit)
            cat_coords = SkyCoord(ra=cat1, dec=cat2, unit=coord_unit)
        elif coord_type=='px':
            coord_unit = 'm' # a unit of length is needed to use astropy's matching function
            cat1 = self['x'].values
            cat2 = self['y'].values
            c1 = SkyCoord(x=coord1, y=coord2, z=0, unit='m', representation='cartesian')
            cat_coords = SkyCoord(x=cat1, y=cat2, z=0, unit= 'm', representation='cartesian')
        else:
            raise astrotoyz.core.AstroToyzError("Unrecognized coord_type")
        idx, d2d, d3d = c1.match_to_catalog_sky(cat_coords)
        # Since there is no consistent way to deal with numpy scalars, we 
        # take the max of the scalar to get its value (ugh)
        # Good discussion on this at
# http://stackoverflow.com/questions/773030/why-are-0d-arrays-in-numpy-not-considered-scalar
        if idx.shape==():
            idx = idx.max()
        return idx, d2d, self.loc[idx]