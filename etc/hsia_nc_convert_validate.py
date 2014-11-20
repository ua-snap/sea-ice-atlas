# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# functions to aid in the conversion, testing, and aggregation of 
# the sea ice atlas data from Bill Chapman. 
# 
# Author: Michael Lindgren ( malindgren@alaska.edu ) - Spatial Analyst
#     Scenarios Network for Alaska & Arctic Planning.  Fairbanks, AK 
#
#  7/25/2013
#  Notes:
# 	SOURCE IDs:
#		1.  Danish Meteorlogical Institute
#		2.  Japan Meteorological Agency
#		3.  Naval Oceanographic Office (NAVOCEANO)
#		4.  Kelly ice extent grids (based upon Danish Ice Charts)
#		5.  Walsh and Johnson/Navy-NOAA Joint Ice Center
#		6.  Navy-NOAA Joint Ice Center Climatology
#		7.  Temporal extension of Kelly data (see note below)
#		8.  Nimbus-7 SMMR Arctic Sea Ice Concentrations or DMSP SSM/I 
#				Sea Ice Concentrations using the NASA Team Algorithm
#		9.  AARI - Arctic and Antarctic Research Institute 
#		10. ACSYS
#		11.  Brian Hill - Newfoundland, Nova Scotia Data
#		12.  Bill Dehn Collection - mostly Alaska
#		13.  Danish Meteorological Institute (DMI)
#		14.  Whaling ship log books
#		15.  All conc. data climatology 1870-1977 (pre-satellite era)
#		16.  Whaling log books open water
#		17.  Whaling log books partial sea ice
#		18.  Whaling log books sea ice covered
#
#		20.  Analog filling of spatial gaps
#		21.  Analog filling of temporal gaps
#
# 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

# modules
from scipy.io import netcdf
import numpy as np
import rasterio, os
from itertools import izip
import pathos.multiprocessing as mp

os.chdir( '/workspace/Shared/Tech_Projects/Sea_Ice_Atlas/project_data' )

def arr2d_to_gtiff( arr_2d, output_filename, template_meta ):
	"""
	simple function to convert a numpy 2d_array to a GTiff, or if there
	are a list or tuple of numpy 2d_arrays in the arr_2d variable, it will write each array
	into a subsequent band in the order they are contained in that ( list/tuple ).

	inputs:
	arr_2d = a single or (list/tuple) of numpy ndarray 2d_arrays to be passed into a new gtiff
		* if list/tuple the layers will be placed into bands in the file in the order
		  they are received in the list/tuple
	output_filename = a string representation of the path to the new output file the 
			function will create.
	template_meta = a dict from rasterio derived from a call to dataset as follows:
			meta = ds.meta.  This can be easily updated with new entries as you would any
			python dict using meta.update( key=value )

	returns the name of the newly created GTiff

	depends:
		numpy
		rasterio

	"""
	import numpy as np
	import rasterio

	band_count = len( arr_2d ) # to update the metadata of the new file
	template_meta.update( count = band_count )
	if band_count == 1:
		arr_2d = list( arr_2d )
	gtiff = rasterio.open( output_filename, mode='w', **template_meta )
	[ gtiff.write_band( ( count + 1 ), lyr )  for count, lyr in enumerate( arr_2d ) ]
	gtiff.close()
	return gtiff.name

def zip_sea_ice( in_dir, output_filename ):
	'''
	zip up the sea ice data.

	arguments:
	in_dir = directory where the output GTiffs are stored
	output_filename = string filename of the new zip file to be 
		created by the function.

	depends:
		python standard library
	'''

	import zipfile, os, glob
	compression = zipfile.ZIP_DEFLATED
	os.chdir( in_dir )
	files = glob.glob( os.path.join( in_dir, '*.tif' ) )
	zf = zipfile.ZipFile( output_filename, mode='w' )
	for i,f in enumerate(files):
		zf.write( f, arcname=os.path.basename( f ), compress_type=compression )
	zf.close()
	return zf


input_path = '/workspace/Shared/Tech_Projects/Sea_Ice_Atlas/project_data/HSIA_SIC_Chapman'
version_num = 'v1_0'

# current source NetCDF files found here:
#	DAILIES (JULY 2014) (http://igloo.atmos.uiuc.edu/SNAP/alaska.observed.seaice.weekly.nc) MD5 sum 845d2ee0953fcd5f8e977d0cfb023f3d
#	MONTHLIES (AUGUST 2014) (http://www.atmos.uiuc.edu/~wlchapma/alaska.monthly.ice.concentration.sources.1850-2013.nc)	MD5 sum 6ac0e57ed1c0d6da8308ceeaec9c6700
nc_paths = [os.path.join( input_path, version_num, 'weekly', 'netcdf', 'alaska.observed.seaice.weekly.nc'),\
			os.path.join( input_path, version_num, 'monthly', 'netcdf', 'alaska.monthly.ice.concentration.sources.1850-2013.nc')]

# timesteps
timesteps = ['weekly', 'monthly']

for timestep, nc_path in izip( timesteps, nc_paths ):
	print nc_path
	# read in the data using scipy
	nc = netcdf.netcdf_file( nc_path )
	# set some output filename constants to pass to the generator
	# output_path = './Outputs_From_Bill/Bill_monthly_outputs_Aug2014'
	output_path = os.path.join( input_path, version_num, timestep, 'gtiff' )
	output_prefix = 'seaice_conc_sic_mean_pct_' + timestep + '_ak_'

	# we know the variable names are 'seaice_conc' and 'seaice_source'
	conc = nc.variables[ 'seaice_conc' ]
	source = nc.variables[ 'seaice_source' ]

	# we need to do something with the metadata of the output new GTiffs here
	# --> for the time-being I am just reading in an old version of the GTiff to use as a template [ MD5 sum e3b146a17fdc29fa28b08753cc09031b ]
	template = rasterio.open( os.path.join( input_path, version_num, 'raster_template', 'seaice_conc_sic_mean_pct_monthly_ak_2013_01.tif' ) )
	meta = template.meta
	meta.update( compress='lzw', nodata=128, dtype=rasterio.uint8, count=2 ) # -1 nodata is land in this map

	# if it is the weekly data rescale it
	if timestep == 'weekly':
		conc = np.rint(conc.data*100.0).astype( np.int )
		conc[ conc == -100.0 ] = 128.0 # landmask
		conc = conc.astype( np.uint8 )
	if timestep == 'monthly':
		conc = np.rint( conc.data ).astype( np.int )
		conc[ conc == -1 ] = 128 # landmask
		conc = conc.astype( np.uint8 ) # change dtype

	source = np.trunc( source.data )
	source[ source == -1 ] = 128
	source = source.astype( np.uint8 ) # change dtype

	# make them into list objects using dimension 1 as time
	conc = [ conc[ i, ... ] for i in range( conc.shape[0] ) ]
	source = [ source[ i, ... ] for i in range( source.shape[0] ) ]

	# Goal here is to generate filenames.
	# For the version of the data with MD5 sum 845d2ee0953fcd5f8e977d0cfb023f3d,
	# the structure of this data has metadata in records 0-5 and the last record (2935) is the overall filename.
	names = nc.history.split()
	names = names[ 6:len(names)-1 ]
	dates = [ i.split('.')[len(i.split('.'))-2] for i in names ]

	if timestep == 'monthly':
		dates = [ i[:4] + '_' + i[4:-2] for i in dates ]
	elif timestep == 'weekly':
		dates = [ i[:4] + '_' + i[4:-2] + '_' + i[len(i)-2:] for i in dates ]
	else:
		BaseException( 'check your dates and timestep inputs' )

	# generator for the list comprehension to do the conversion
	input_generator = ( ( os.path.join( output_path, output_prefix + d + '.tif' ), c.astype(meta['dtype']), s.astype(meta['dtype']) ) for d, c, s in izip( dates, conc, source ) )

	# run it with a list comprehension
	p = mp.Pool( 3 )
	out = p.map( lambda x: arr2d_to_gtiff( (x[1], x[2]), x[0], meta ), input_generator ) 
	p.close()

	gtiff_out = [ arr2d_to_gtiff( (cnc, src), fn, meta ) for fn, cnc, src in input_generator ]

	# run the zipping procedure
	in_dir = os.path.join( input_path, version_num, timestep )
	output_filename = os.path.join( in_dir, 'seaice_conc_sic_mean_pct_' + timestep + '_ak_' + dates[0]+'_'+dates[len(dates)-1]+'.zip' )

	if os.path.exists( output_filename ):
		os.remove( output_filename )

	out = zip_sea_ice( in_dir, output_filename )
	out.close()


	# # # # # # # # # # # # # # # # # # # # # #
	# BELOW ARE SOME TESTS THAT CAN BE RUN ON THE DATA 
	# # SOURCE TEST
	# what are the unique acceptable values allowed in the seaice_source layer?
	value_list = [ 128,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20,21 ]

	# re-instantiate the generator
	input_generator = ( ( os.path.join( output_path, 'weekly', output_prefix + '_'.join([ d[4:6], d[6:8], d[:4] ]) + '.tif' ), c.astype(meta['dtype']), s.astype(meta['dtype']) ) \
							for d, c, s in zip( dates, conc, source ) )

	# get all of the unique values for each source layer as a dict
	out = {num:np.unique(src).tolist() for num, src in enumerate(source) }
	all_vals = [j for i in out.values() for j in i ]
	all_unique_vals = np.unique(np.array(all_vals))

	# if the output of the next line is True then there is no discrepancy between the unique source ids and what we should expect.
	False not in [ True for i in all_unique_vals if i in value_list ] 

	# # CONC TEST
	# re-instantiate the generator
	input_generator = ( ( os.path.join( output_path, 'weekly', output_prefix + '_'.join([ d[4:6], d[6:8], d[:4] ]) + '.tif' ), c.astype(meta['dtype']), s.astype(meta['dtype']) ) \
							for d, c, s in zip( dates, conc, source ) )
	# are the values of the dataset seaice_conc only within the range of 0-100?
	cnc_range_list = [ (np.min(cnc), np.max(cnc)) for fn, cnc, src in input_generator ]
	# now write a test to be sure the range is right
	cnc_test_list = [ 1 for min, max in cnc_range_list if min >= 0 and max <= 1 ]
	# diffenence between the length input list and the sum of the cnc_test_list
	cnc_final_test = len( cnc_range_list ) - sum( cnc_test_list )



