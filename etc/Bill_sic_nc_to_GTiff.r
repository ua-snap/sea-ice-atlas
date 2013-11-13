# this script snippet will take in Bill Chapmans sea ice data and will convert it to the GTiff format that SNAP desires
# this first portion of the file is a hardwired working example, the second portion is the
# conversion in a function and the final part shows how to call the function

# Required libraries (perhaps there are more, but I had to explicitly install these)
library(raster)
library(parallel)
library(ncdf)
library(rgdal)
library(stringr)
library(RPostgreSQL)

# a function that does the same thing as above, only funtionally
seaIceConvert <- function(ncFilePath, outDirPath, outFormat, beginDate, endDate, outPrefix, varName){
	if('package:raster' %in% search() == FALSE) require(raster)

	# read in the NetCDF file from Bill as a RasterBrick()
	b <- brick(ncFilePath, varname=varName)

	# make the sequence of dates to identify the layers in the new RasterBrick() and pass those new identifiers to the names()
	years <- seq(1953, 2012)
	months <- seq(1, 12)
	days <- c(1, 8, 15, 23)
	dates = c()

	for(year in years) {
		for(month in months) {
			for(day in days) {
				dates <- c(dates, sprintf("%04d-%02d-%02d", year, month, day))
			}
		}
	}

	names(b) <- gsub('-','_',as.character(dates))

	# write out the rasters
	writeRaster(b, format=outFormat, filename=paste(outDirPath,outPrefix,sep="/"), datatype='INT1S',options='COMPRESS=LZW', bylayer=T, suffix=substring(names(b),2,nchar(names(b))))
}

ncFilePath = '~/alaska.seaice.allweeks.nc'
outDirPath = '~/output'
tmpDir = '~/tmp'
outFormat =  'GTiff'
beginDate = '1953/1/1'
endDate = '2012/12/31'

# we're going to create separate files for each of the two variables, for each date
# we might need to include "seaice_source" in this list in the future
varNames <- c('seaice_conc')

# set a working directory
setwd('.')

# create separate GeoTIFFs for sea ice concentration and sea ice source data
for(varName in varNames) {
	outPrefix = str_c(varName, '_sic_mean_pct_weekly_ak')
	#seaIceConvert(ncFilePath, outDirPath, outFormat, beginDate, endDate, outPrefix, varName)
}

# connect to PostgreSQL to populate PostGIS raster table
drv <- dbDriver('PostgreSQL')
con <- dbConnect(drv, host='localhost', port='30303', user='sea_ice_atlas_user', password='', dbname='sea_ice_atlas')

createStatement = 'CREATE TABLE "rasters" ("date" date PRIMARY KEY, "rid" serial, "rast" raster)'
dbGetQuery(con, createStatement)

# get a list of all the concentration GeoTIFFs that were created by the writeRaster() function
outputTiffs <-list.files(path=outDirPath, pattern='^seaice_conc.*\\.tif$') 

for(outputTiff in outputTiffs) {

	# get the date from the GeoTIFF filename
	pattern = '.*(\\d{4})_(\\d{2})_(\\d{2}).*'
	dateParts <- str_match(outputTiff, pattern)
	formattedDate = paste(dateParts[2], dateParts[3], dateParts[4], sep='-')
	filePath = paste(outDirPath, dateParts[1], sep='/')
	tifFilePath = paste(tmpDir, '/concentration_reproj.tif', sep='')
	sqlFilePath = paste(tmpDir, '/concentration_reproj.sql', sep='')

	# translate GeoTIFF into EPSG:3338
	syscall = paste('gdal_translate -of Gtiff -co tfw=yes -a_ullr -180 80.375 -120 40.125 -a_srs EPSG:3338', filePath, tifFilePath, sep=' ')
	system(syscall)

	# convert this GeoTIFF into a PostGIS SQL script
	syscall = paste('/usr/pgsql-9.2/bin/raster2pgsql -r', tifFilePath, '-s 3338 -I > ', sqlFilePath, sep=' ')
	system(syscall)

	# read the contents of this SQL script
	contents <- readLines(sqlFilePath)
	sqlQuery <- paste(contents, collapse='\n')

	# pull raster data out of the SQL script and throw away the rest
	pattern = 'VALUES \\(\'(.*?)\''
	queryParts <- str_match(sqlQuery, pattern)
	rasterData = queryParts[2]
	insertStatement = paste('INSERT INTO "rasters" ("date", "rast") VALUES (\'', formattedDate, '\',\'', rasterData, '\'::raster)', sep='')
	dbGetQuery(con, insertStatement)
}

# get a list of all the source GeoTIFFs that were created by the writeRaster() function
outputTiffs <-list.files(path=outDirPath, pattern='^seaice_source.*\\.tif$') 

# to do: add the data source rasters as secondary bands
for(outputTiff in outputTiffs) {
}

# the raster2pgsql command did this, so we're adding it back in
indexStatement = 'CREATE INDEX "rasters_rast_gist" ON "rasters" USING gist (st_convexhull("rast"))'
dbGetQuery(con, indexStatement)

# the raster2pgsql command did this, so we're adding it back in
analyzeStatement = 'ANALYZE "rasters"'
dbGetQuery(con, analyzeStatement)

dbDisconnect(con)
dbUnloadDriver(drv)

