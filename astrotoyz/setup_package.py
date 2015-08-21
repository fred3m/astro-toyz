# Licensed under a 3-clause BSD style license - see LICENSE.rst
from __future__ import absolute_import

from distutils.core import Extension
from os.path import join

def get_package_data():
    return {
        'astrotoyz': [
            'static/astro.css',
            'static/catalog.js',
            'static/sextractor.js',
            'static/spectrum.js',
            'static/astro.js',
            'static/spectrum.css',
            'static/viewer.js',
            'templates/*.*',
            'static/icons/*.*'],
        }


def requires_2to3():
    return False