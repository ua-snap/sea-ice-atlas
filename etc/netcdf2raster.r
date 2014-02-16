#!/usr/bin/env Rscript

# This script takes the netcdf file for the source sea ice atlas data, monthly spatial resolution, and outputs
# geotiff rasters and sql rasters.
# Outcomes: 
# /outDirPath/lots-of-tiff-files
# current-working-directory/tableName.sql     <- SQL file that can be ingested into PostGIS

# Environmental dependencies: a few programs need to be in your $PATH:
# raster2pgsql, gdal_translate, gdalwarp.

# Your shell also needs a fairly large number of open file descriptors; to set this, something
# like this is needed:
# ulimit -S -n 4096

# if these librares are not present, they will need to be installed.
library(raster)
library(ncdf)
library(stringr)

# When changing the script, change this back to warn=1.
# The system call that captures the output of the raster2sql system command
# throws warnings because those lines are being split, and from the R source code
# it looks like the fear is that line splitting may not be 
options(warn=0)

# Path to source NetCDF file
ncFilePath = './ice.concentrations.monthly.alaska.1850-2013.nc'

# Directory where geotiffs will be written
outDirPath = './output'

# start and end years
startYear = 1850
endYear = 2013

# table name for generated SQL, suggest something of the form:
# sql_raster_seaice_rev_x
tableName = 'sql_raster_seaice_rev_2014_2_14'

setwd('.')

# Read in the NetCDF file as a RasterBrick()
b <- brick(ncFilePath, varname='seaice_conc')

# make the sequence of dates to identify the layers in the new RasterBrick() and pass those new identifiers to the names()
years <- seq(startYear, endYear)
months <- seq(1, 12)
dates = c()

for(year in years) {
	for(month in months) {
			dates <- c(dates, sprintf("%04d-%02d-15", year, month))
	}
}

names(b) <- gsub('-','_',as.character(dates))

# Write out the rasters
writeRaster(b, format='GTiff', filename=paste(outDirPath,'seaice_conc_sic_mean_pct_monthly_ak',sep="/"), datatype='INT1S',options='COMPRESS=LZW', bylayer=T, suffix=substring(names(b),2,nchar(names(b))))

# Start generating the raster SQL.
sqlRasterStatement = paste('CREATE TABLE "', tableName, '" ("date" date PRIMARY KEY, "rid" serial, "rast" raster);', sep='')

# get a list of all the concentration GeoTIFFs that were created by the writeRaster() function
outputTiffs <-list.files(path=outDirPath, pattern='^seaice_conc.*\\.tif$') 

for(outputTiff in outputTiffs) {

	# get the date from the GeoTIFF filename
	pattern = '.*(\\d{4})_(\\d{2})_15.*'
	dateParts <- str_match(outputTiff, pattern)
	formattedDate = paste(dateParts[2], dateParts[3], '15', sep='-')
	filePath = paste(outDirPath, dateParts[1], sep='/')

	# convert this GeoTIFF into a PostGIS SQL script
	syscall = paste('raster2pgsql -r', filePath, '-s 4326 -I', sep=' ')
	sqlQuery <- paste0(system(syscall, intern = TRUE), collapse = '')

	# pull raster data out of the SQL script and throw away the rest
	pattern = 'VALUES \\(\'(.*?)\''
	queryParts <- str_match(sqlQuery, pattern)
	sqlRasterStatement = paste(sqlRasterStatement, 'INSERT INTO "', tableName, '" ("date", "rast") VALUES (\'', formattedDate, '\',\'', queryParts[2], '\'::raster);', sep='')
}

# the raster2pgsql command did this, so we're adding it back in;
# index names must be unique per-database, not per-table, so we either need to come up
# with a new index name each time, or remove the index from the previous version of the
# rasters table
sqlRasterStatement = paste(sqlRasterStatement, 'CREATE INDEX "', tableName, '_rast_gist" ON "', tableName, '" USING gist (st_convexhull("rast"));', sep='')

# the raster2pgsql command did this, so we're adding it back in
sqlRasterStatement = paste(sqlRasterStatement, 'ANALYZE "', tableName,  '";', sep='')

cat(sqlRasterStatement, file = paste(tableName, 'sql', sep='.'))