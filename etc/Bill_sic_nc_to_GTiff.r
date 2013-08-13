# this script snippet will take in Bill Chapmans sea ice data and will convert it to the GTiff format that SNAP desires
# this first portion of the file is a hardwired working example, the second portion is the
# conversion in a function and the final part shows how to call the function

# Required libraries (perhaps there are more, but I had to explicitly install these)
library(raster)
library(parallel)
library(ncdf)
library(rgdal)

# set an output directory
outDir = '/tmp/seaiceatlas'

# set a working directory
setwd('.')

# read in the NetCDF file from Bill as a RasterBrick()
b <- brick('~/Downloads/alaska.seaice.allweeks.nc')

# make the sequence of dates to identify the layers in the new RasterBrick() and pass those new identifiers to the names()
dates=seq(as.Date('1953/1/1'), as.Date('2012/12/31'), length.out=nlayers(b))
names(b) <- gsub('-','_',as.character(dates))

# write out the rasters
writeRaster(b, format='GTiff', filename=paste(outDir,'sic_mean_pct_weekly_ak',sep="/"), datatype='INT1S',options='COMPRESS=LZW', bylayer=T, suffix=substring(names(b),2,nchar(names(b))))

#########################################################################################################################################################################################################

# a function that does the same thing as above, only funtionally
seaIceConvert <- function(ncFilePath, outDirPath, outFormat, beginDate, endDate, outPrefix){
	if('package:raster' %in% search() == FALSE) require(raster)

	# read in the NetCDF file from Bill as a RasterBrick()
	b <- brick(ncFilePath)

	# make the sequence of dates to identify the layers in the new RasterBrick() and pass those new identifiers to the names()
	dates=seq(as.Date(beginDate), as.Date(endDate), length.out=nlayers(b))
	names(b) <- gsub('-','_',as.character(dates))

	# write out the rasters
	writeRaster(b, format=outFormat, filename=paste(outDirPath,outPrefix,sep="/"), datatype='INT1S',options='COMPRESS=LZW', bylayer=T, suffix=substring(names(b),2,nchar(names(b))))
}

#########################################################################################################################################################################################################

# an example of how to call the function if that is an easier way to convert it
# seaIceConvert(ncFilePath='/workspace/UA/malindgren/projects/Tracy_SeaIce/weekly_from_bill/Weekly_SeaIce_Bill_061113/alaska.seaice.quarter.by.quarter.nc', 
	outDirPath='/workspace/UA/malindgren/projects/Tracy_SeaIce/weekly_from_bill/test', outFormat='GTiff',
	beginDate='1953/1/1', endDate='2012/12/31', outPrefix='sic_mean_pct_weekly_ak')