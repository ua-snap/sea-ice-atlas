# this script snippet will take in Bill Chapmans sea ice data and will convert it to the GTiff format that SNAP desires
# this first portion of the file is a hardwired working example, the second portion is the
# conversion in a function and the final part shows how to call the function

# Required libraries (perhaps there are more, but I had to explicitly install these)
library(raster)
library(parallel)
library(ncdf)
library(rgdal)
library(stringr)

# a function that does the same thing as above, only funtionally
seaIceConvert <- function(ncFilePath, outDirPath, outFormat, beginDate, endDate, outPrefix, varName){
	if('package:raster' %in% search() == FALSE) require(raster)

	# read in the NetCDF file from Bill as a RasterBrick()
	b <- brick(ncFilePath, varname=varName)

	# make the sequence of dates to identify the layers in the new RasterBrick() and pass those new identifiers to the names()
	dates=seq(as.Date(beginDate), as.Date(endDate), length.out=nlayers(b))
	names(b) <- gsub('-','_',as.character(dates))

	# write out the rasters
	writeRaster(b, format=outFormat, filename=paste(outDirPath,outPrefix,sep="/"), datatype='INT1S',options='COMPRESS=LZW', bylayer=T, suffix=substring(names(b),2,nchar(names(b))))
}

ncFilePath = '~/alaska.seaice.allweeks.nc'
outDirPath = '~/tmp'
outFormat =  'GTiff'
beginDate = '1953/1/1'
endDate = '2012/12/31'

# we're going to create separate files for each of the two variables, for each date
varNames <- c('seaice_conc', 'seaice_source')

# set a working directory
setwd('.')

outputTiffs <-list.files(path=outDirPath, pattern='.*\\.tif$') 

for(outputTiff in outputTiffs) {
	print(outputTiff)
	
}

for(varName in varNames) {
	outPrefix = str_c(varName, '_sic_mean_pct_weekly_ak')
	seaIceConvert(ncFilePath, outDirPath, outFormat, beginDate, endDate, outPrefix, varName)
}

