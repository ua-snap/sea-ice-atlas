# Sea Ice Atlas

Web app for exploring arctic sea ice extent.

### Dependencies

#### Mac OS X

First install:

* Xcode (you may also need to install the "Command Line Tools" package from the Xcode -> Preferences -> Downloads window)
* Homebrew

Then install Ruby, Compass, Node, and the Grunt CLI tools with the following commands:

```bash
brew install ruby
gem install compass
brew install node
sudo npm install -g grunt-cli
```

The Grunt CLI tools are needed to support the application build cycle.

## Installation & configuration

```bash
git clone git@github.com:ua-snap/sea-ice-atlas.git
cd sea-ice-atlas
npm install
bower install
```

The application also needs a configuration file set up.  From a fresh checkout:

```
cp config.json.example config.json
```

Then, edit the ```config.json``` file to specify port & database connection.  The configuration file is documented below:

```javascript
{
	// Port on which the application will run.
	"port": 3000,

	// Database connection information.
	"database": {
		"user":"sea_ice_atlas_user",
		"password":"example",
		"database":"sea_ice_atlas",
		"host":"localhost",
		"port":30303,
		"table":"sea_ice_data_table"
	},

	// Analytics token.
	// If set to Boolean false, Google analytics is not attached,
	// otherwise should be set to a string with the property ID token.
	"google_analytics_token":false,

	// Start and end year ranges for the data.
	"startYear":1850,
	"endYear":2012,

	// Template string to define the name of individual map layers in
	// the corresponding Mapserver/Tilecache configuration files.
	// This is an underscore template.
	"mapLayerNameTemplate":"seaice_conc_sic_mean_pct_monthly_ak_<%= year %>_<%= month %>"

}
```

#### Handling source code updates

When updating from upstream code and/or various branches, you may need to ```npm install``` again if you get errors when running ```grunt```.

### Building the project

*Building the project* means being able to "compile" all the source into a web app you can use and run.  To run a development environment for the first time, the OpenLayers build process needs to run, so use: ```grunt build```.  Afterwards (unless you've updated OpenLayers through Bower) you can just use ```grunt```.

Important stuff grunt is doing for us:

 * Takes all the javascript code and turns it into a single optimized file,
 * Takes all LESS code (ours and others) and compiles it to a single file.

*One nice but flaky thing* is that when you save changes to files, the build system will try and reload your current browser page.  When this works, it's wicked magic because it's like "live editing."  The sad news is that sometimes it's late/slow and won't work.  In some cases, you need to manually retrigger Grunt so it is _definitely_ rebuilding all the styles + code.

### Deploying

```forever``` is used to run the process, roughly along these lines:

```bash
cd /path/to/project
forever start --append -l /var/log/hsia/forever.log -o /var/log/hsia/out.log -e /var/log/hsia/error.log ./app.js 
```

To update the server:

```bash
cd /path/to/project
git pull
npm install
grunt build
forever restart 0
```

...where 0 is the number corresponding to the associated process to restart.  ```forever list``` first if there are multiple processes running on this server to ensure you've got the right number.

#### Database and map layer deployment / data updates

Source data will probably be provided in GeoTIFF format. If the source data is provided in NetCDF format, this procedure will first convert the NetCDF file into GeoTIFFs. The GeoTIFF files will be used by MapServer, but they are also used to generate an SQL raster file to import into PostGIS. In other words, on the HSIA Explore page, the map layers are served from the GeoTIFFs through MapServer, whereas the Sea Ice Concentration and Ice Open and Close Dates charts are generated from the SQL raster data through PostGIS. The data is duplicated and served up through these two different channels independently.

To deploy data for this application, the steps are:

 1. Obtain the updated data file, and be aware that if the file has structural changes some coding may be needed to support it. Double check that the bounding box is consistent with our existing infrastructure with the ```gdalinfo``` command. The bounding box should look like this:

     ```
     $ gdalinfo <filename>
     ...
     Corner Coordinates:
     Upper Left  (-180.0000000,  80.2500000) (180d 0' 0.00"W, 80d15' 0.00"N)
     Lower Left  (-180.0000000,  40.0000000) (180d 0' 0.00"W, 40d 0' 0.00"N)
     Upper Right (-119.7500000,  80.2500000) (119d45' 0.00"W, 80d15' 0.00"N)
     Lower Right (-119.7500000,  40.0000000) (119d45' 0.00"W, 40d 0' 0.00"N)
     Center      (-149.8750000,  60.1250000) (149d52'30.00"W, 60d 7'30.00"N)
     ...
     ```

     If the bounding box does not look like this, talk to whomever generated data. Or, you may be able to correct the data bounding box with the ```etc/reproject.sh``` script as a last resort.

 1. If you starting with GeoTIFF files, not a NetCDF file, the GeoTIFF file names need to be in the format ```seaice_conc_sic_mean_pct_monthly_ak_YYYY_MM.tif``` before you can continue. If the GeoTIFF files are not named like this, you can modify the ```etc/rename_geotiffs.pl``` script to rename them.
 1. Update the ```etc/netcdf2raster.r``` script as required to change paths/configuration. If you are starting with a NetCDF file, set ```doNetCDF = TRUE``` and make sure to set the ```ncFilePath``` variable. If you are starting with GeoTIFFs, set ```doNetCDF = FALSE``` and set ```outDirPath``` to your GeoTIFF directory (```ncFilePath``` will be ignored).

   Then run the file and it will eventually emit ~1,968 GeoTIFFs as well as an SQL file.  (*Note*, there will likely be a huge number of warnings when this script runs, but it should be OK.)
 1. Generate the mapfile.
 	* Update the ```etc/mapfile-generator/generateMapfile.pl``` tile with the correct date span (near line 46), then execute to yield the "hsia.map" and "hsia-tilecache.cfg".
 	* Check the config files and note the directories where the GeoTIFFs should go, as well as making sure the layer names / filenames line up correctly.
 	* Check the templates for the mapfile and layer if you need to edit URLs or file locations.
 1. Move the mapfile and the GeoTIFFs up to the production mapserver, copy to production directory.
 1. Move the tilecache configuration file up to the production mapserver, then merge it into the giant tilecache configuration file (Tilecache doesn't support multiple configs). 
 1. Regenerate the tilecache.  Delete all previous cache items, then run the ```etc/seedTilecache.sh``` script.  After generating the cache, ensure that permissions are correctly set on the individual directories such that Apache can read them.
 1. Load the generated raster SQL file into PostGIS.  It may be wise to do this with a new table, not reusing the previous one.
 1. Update configurations on the application as appropriate, and restart the app as outlined above.

## Development

### Important files, locations

For *GUI development*, here's how things roll:

 * Server-side Jade templates.  Layout + "pages" live in the ```views/*.jade``` files.  For changing static text or layout, this is probably the right place to start.
 * Client-side JST templates.  These only currently lurk in the Explore page, and they're small chunks of HTML that get assembled for the "application" behavior.  These files dwell in ```src/scripts/templates``` directory. 
 * Styling is done by taking the Bootstrap 3.0 source LESS files, then adding/overriding the styling to build a single final CSS file.  Our custom LESS files live in ```src/less```.
 * The public web root is ```/public```.  This means, if you want to add an image, you'd add the file in the repository to ```/public/img/photo.jpg``` then reference it with this path: ```/img/photo.jpg```.  Jade code: ```img(src='/img/photo.jpg')```.  
 * Adding a new "page" means that you have to tell Express (the web framework) how to wire things up.  For "normal static pages" this can be made a lot more awesome + straightforward, but what we've got is OK for this small site.

#### Some normal types of changes as examples

*Scenario*: I want to change some text and an image on the Glossary page.  I'd open ```/views/glossary.jade``` and update content there, adding any images to ```/public/img```.

*Scenario*: I need to change the footer text.  This text is in the layout, since it's included in every page.  I'd open ```views/layout.jade``` and make changes as required.

*Scenario*: I want to override or change some styling choice site-wide.  I'd start by seeing if Bootstrap has this set up as a "variable" by checking in the Bootstrap source code, which will be in ```bower_components/bootstrap/less/variables.less```.  Bootstrap's set up to apply the effects of these variables globally, which is why I start by looking at what they've got.  I may fiddle around with them inside that file, but when I confirm I've found the right thing, I'd open ```src/less/variables.less``` and make my changes there, so I'm not changing anything in the Bootstrap original source.

*Scenario*: I want to apply specific styles to one section of a page.  I'd identify how to write LESS rules that target that section (maybe wrap it in a div with a specific ID or class), then I'd add my LESS code to ```/src/less/style.less```.
