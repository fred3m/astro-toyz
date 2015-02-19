
import os
import sys
import glob
from toyz import version
from setuptools import setup
from setuptools import find_packages

# Package info
PACKAGE_NAME = "astro_toyz"
DESCRIPTION = "Astronomy tools built on the Toyz framework"
LONG_DESC = "GUI built on toyz framework to use astropy and more"
AUTHOR = "Fred Moolekamp"
AUTHOR_EMAIL = "fred.moolekamp@gmail.com"
LICENSE = "LGPLv3"
URL = "http://fred3m.github.io/toyz/"

# VERSION should be PEP386 compatible (http://www.python.org/dev/peps/pep-0386)
VERSION = '0.0.dev'

if 'dev' not in VERSION:
    VERSION += version.get_git_devstr(False)

scripts = [fname for fname in glob.glob(os.path.join('scripts', '*'))
           if os.path.basename(fname) != 'README.rst']

packages = find_packages()

setup(name=PACKAGE_NAME,
    version=VERSION,
    description=DESCRIPTION,
    packages=packages,
    scripts=scripts,
    requires=[
        'tornado',
        'toyz',
        'numpy',
        'astropy',
        'scipy'
    ],
    install_requires=[
        'tornado',
        'toyz',
        'numpy',
        'astropy',
        'scipy'
    ],
    #provides=[PACKAGE_NAME],
    author=AUTHOR,
    author_email=AUTHOR_EMAIL,
    license=LICENSE,
    url=URL,
    long_description=LONG_DESC,
    zip_safe=False,
    use_2to3=True,
    include_package_data=True
)