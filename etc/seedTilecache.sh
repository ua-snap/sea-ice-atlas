#!/bin/bash

# this script should be run in the /var/www/tilecache directory on Hades;
# it'll force population around zoom level 4 of all sea ice atlas tiles in the cache.
cd /var/www/tilecache

for f in /var/www/html/seaice-monthly/*
do
	# Strip trailing file extension and leading file paths:
	y=${f%.tif}
	z=${y##*/}
	tilecache_seed.py $z 4	
done
