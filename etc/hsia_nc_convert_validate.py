# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 
# functions to aid in the conversion, testing, and aggregation of 
# the sea ice atlas data from Bill Chapman. 
# 
# Author: Michael Lindgren ( malindgren@alaska.edu ) - Spatial Analyst
#     Scenarios Network for Alaska & Arctic Planning.  Fairbanks, AK 
#
#  v1.0 - 7/24/2013 - ML
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

# hardwired stuff
nc_path = '/workspace/Shared/Tech_Projects/Sea_Ice_Atlas/project_data/Outputs_From_Bill/SIC_Weekly/netcdf/version2_from_bill/alaska.observed.seaice.weekly.nc'

# modules
from scipy.io import netcdf
import numpy as np
import rasterio, os

# read in the data using scipy
nc = netcdf.netcdf_file('/workspace/Shared/Tech_Projects/Sea_Ice_Atlas/project_data/Outputs_From_Bill/SIC_Weekly/netcdf/version2_from_bill/alaska.observed.seaice.weekly.nc')

# we know the variable names are 'seaice_conc' and 'seaice_source'
conc = nc.variables[ 'seaice_conc' ]
source = nc.variables[ 'seaice_source' ]

# we need to do something with the metadata of the output new GTiffs here
# --> for the time-being I am just reading in an old version of the GTiff to use as a template
template = rasterio.open( '/workspace/Shared/Tech_Projects/Sea_Ice_Atlas/project_data/Outputs_From_Bill/SIC_Weekly/tif/sic_mean_pct_weekly_ak_01_01_1953.tif' ) 
meta = template.meta
meta.update( compress='lzw', nodata=255 )

# some functions to be used in the script
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



# to get a filename generator we need the darn filenames or dates from Bills non-compliant NetCDF
#  this is how I have done it for the current iteration <-- this will most-likely need to change if inputs change
# ->>> currently records 0-5 are meta, and the last record (2935) is the overall filename
names = nc.history.split() 
names = names[ 6:2934 ]
dates = [ i.split('.')[2] for i in names ]

# set some output filename contants to pass tp the generator
output_path = '/workspace/Shared/Tech_Projects/Sea_Ice_Atlas/project_data/Outputs_From_Bill/HSIA_Prep_July2014'
output_prefix = 'sic_mean_pct_weekly_ak_' 

# generator for the list comprehension to do the conversion
input_generator = ( ( os.path.join( output_path, 'weekly', output_prefix + '_'.join([ d[4:6], d[6:8], d[:4] ]) + '.tif' ), c.astype(np.uint8), s.astype(np.uint8) ) \
						for d, c, s in zip( dates, conc, source ) )

# run it with a list comprehension
gtiff_out = [ arr2d_to_gtiff( (cnc, src), fn, meta ) for fn, cnc, src in input_generator ]

# # SOURCE TEST
# what are the unique acceptable values allowed in the seaice_source layer?
value_list = list('acceptable unique values list') # <-- NEED TO GET THIS INFORMATION
# and now test against that list.  if there are errors it will return False, if not True
False not in [ False not in [ e in np.unique( src ) for e in value_list ] for fn, cnc, src in input_generator ] # this may require a flip-flop

# # CONC TEST
# are the values of the dataset seaice_conc only within the range of 0-100?
cnc_range_list = [ (np.min(cnc), np.max(cnc)) for fn, cnc, src in input_generator ]
# now write a test to be sure the range is right
cnc_test_list = [ 1 for min, max in cnc_range_list if min >= 0 and max <= 100 ]
# diffenence between the length input list and the sum of the cnc_test_list
cnc_final_test = len( cnc_range_list ) - sum( cnc_test_list )

# # GRAB AND COPY "MONTHLY" TIMESERIES 
# grab the week of the 15th of the month for the "Monthly" dataset
monthly_folder = os.path.join( output_path, 'monthly' )
[ os.system( 'cp ' + fn + ' ' + os.path.join( monthly_folder, os.path.basename(fn)).replace('weekly', 'monthly') ) \
					for fn, cnc, src in input_generator if int(fn[ -6:-4 ]) == 15 ]







