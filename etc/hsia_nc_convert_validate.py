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

os.chdir( '/workspace/Shared/Tech_Projects/Sea_Ice_Atlas/project_data' )

# source NetCDF file, found here (http://igloo.atmos.uiuc.edu/SNAP/alaska.observed.seaice.weekly.nc)
# DAILIES (JULY 2014)
# nc_path = './Outputs_From_Bill/SIC_Weekly/netcdf/version2_from_bill/alaska.observed.seaice.weekly.nc'
# monthlies (AUGUST 2014)
nc_path = './Outputs_From_Bill/Bill_monthly_outputs_Aug2014/alaska.monthly.ice.concentration.sources.1850-2013.nc'
# read in the data using scipy
nc = netcdf.netcdf_file( nc_path )

# set the  timestep for the output filename as a string
timestep = 'monthly' # 'weekly'

# set some output filename constants to pass to the generator
output_path = './Outputs_From_Bill/Bill_monthly_outputs_Aug2014'
output_prefix = 'sic_mean_pct_' + timestep + '_ak_' 

# we know the variable names are 'seaice_conc' and 'seaice_source'
conc = nc.variables[ 'seaice_conc' ]
source = nc.variables[ 'seaice_source' ]

# we need to do something with the metadata of the output new GTiffs here
# --> for the time-being I am just reading in an old version of the GTiff to use as a template
template = rasterio.open( './CODE/sea-ice-atlas/etc/raster_template_Bill.tif' ) 
meta = template.meta
meta.update( compress='lzw', nodata=-1, dtype=rasterio.float32 ) # -1 nodata is land in this map

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


# Goal here is to generate filenames.
# For the version of the data with MD5 sum 845d2ee0953fcd5f8e977d0cfb023f3d,
# the structure of this data has metadata in records 0-5 and the last record (2935) is the overall filename.
names = nc.history.split()
names = names[ 6:len(names)-1 ]
dates = [ i.split('.')[len(i.split('.'))-2] for i in names ]

# generator for the list comprehension to do the conversion
input_generator = ( ( os.path.join( output_path, timestep, output_prefix + '_'.join([ d[4:6], d[6:8], d[:4] ]) + '.tif' ), c.astype(meta['dtype']), s.astype(meta['dtype']) ) \
						for d, c, s in zip( dates, conc, source ) )

# run it with a list comprehension
gtiff_out = [ arr2d_to_gtiff( (cnc, src), fn, meta ) for fn, cnc, src in input_generator ]

# # SOURCE TEST
# what are the unique acceptable values allowed in the seaice_source layer?
value_list = [ -1,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20,21 ]

# re-instantiate the generator
input_generator = ( ( os.path.join( output_path, 'weekly', output_prefix + '_'.join([ d[4:6], d[6:8], d[:4] ]) + '.tif' ), c.astype(meta['dtype']), s.astype(meta['dtype']) ) \
						for d, c, s in zip( dates, conc, source ) )

# get all of the unique values for each source layer as a dict
out = {num:np.unique(src).tolist() for num, src in enumerate(source) }
all_vals = [j for i in out.values() for j in i ]
all_unique_vals = np.unique(np.array(all_unique_vals))

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

# old code for creating monthlies from weeklies before Bill sent the Monthly outputs in August 2014
# # # GRAB AND COPY "MONTHLY" TIMESERIES 
# # grab the week of the 15th of the month for the "Monthly" dataset
# [ os.system( 'cp ' + fn + ' ' + fn.replace('weekly', 'monthly') ) for fn in gtiff_out if '_15_' is in fn ]
