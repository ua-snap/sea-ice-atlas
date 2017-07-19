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

### Database and map layer deployment / data updates

Other folks will provide the updated GeoTIFF files.  The GeoTIFF files will be used by MapServer, but they are also used to generate an SQL raster file to import into PostGIS. On the HSIA Explore page, the map layers are served from the GeoTIFFs through MapServer, whereas the Sea Ice Concentration and Ice Open and Close Dates charts are generated from the SQL raster data through PostGIS. The data is duplicated and served up through these two different channels independently.

Since the data is updated for the prior year, there's a mix in the instructions below of 2016-2017 for filenames and paths, since these directions were written for the 2017 update which includes 2016 data.

Outcomes, with server names and data locations identified below:

 * All (existing & updated) GeoTIFF images are located on `hades` (`tiles.snap.uaf.edu`) at `/var/www/html/hsia`.
 * New mapfile configuration `/var/www/html/hsia.map`.
 * Updated tilecache configuration `/var/www/tilecache/tilecache.cfg`.
 * New PostGIS table created named `sql_raster_seaice_rev_2017_07_19`.
 * Application configuration updated to point at new locations for data.

#### Warning & apologies!

You should assume that once you've modified the main production tilecache configuration file, *the production site will be broken* until you complete the entire update process.

These directions aren't peer-tested.  There are probably mistakes.  Sorry!

There's a lot of paths that need to be carefully aligned between the mapfile, tilecache, and filesystem.  You can look at the generated mapfile/tilecache configurations and ensure that the paths match what you're actually deploying on `hades`.  If you need to modify paths, it's easy to do so by editing the template files in this repo in `etc/mapfile-generator/templates`.

#### Obtain and verify updated GeoTIFF files

 1. Obtain the updated data file, and be aware that if the file has structural changes some coding may be needed to support it. Double check that the bounding box and nodata value(s) are consistent with our existing infrastructure with the ```gdalinfo``` command. The bounding box should look like this:

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

     If the bounding box does not look like this, talk to whoever generated the data. Or, you may be able to correct the data bounding box with the ```etc/reproject.sh``` script as a last resort.
 1. If you are starting with GeoTIFF files, not a NetCDF file, the GeoTIFF file names need to be in the format ```seaice_conc_sic_mean_pct_monthly_ak_YYYY_MM.tif``` before you can continue. If the GeoTIFF files are not named like this, you can modify and run the ```etc/rename_geotiffs.pl``` script to rename them.

#### Generate updated mapfile and tilecache config files

 1. On your local machine, clone this repository to some location (here, `~/repos`).
 1. Install Perl dependencies if needed.
    ```
    cpan App::cpanminus
    cpanm Template JSON
    ```
 1. Update script to generate configs for the most recent data year. `cd ~/sea-ice-atlas/etc/mapfile-generator` then edit the script as follows:
    ```
    line 10: my $mapfile = "hsia.map";
    line 11: my $cachefile = "hsia-cache-2017.cfg";
    line 46: change end year to most current data available (here, 2016)
    ```
 1. Generate new mapfile and tilecache configurations.
    ```
    ./generateMapfile.pl
    ```

#### Update data in MapServer

The data update on MapServer is done on `hades`.  These steps assume that the new GeoTIFFs to be added are in an archive named `~/seaice2016.bz2`.

 1. Copy needed files to `hades`.
    ```
    scp ~/seaice2016.bz2 user@hades:~
    scp ~/repos/sea-ice-atlas/etc/mapfile-generator/hsia-2017.map user@hades:~
    scp ~/repos/sea-ice-atlas/etc/mapfile-generator/hsia-cache-2017.cfg user@hades:~
    ```
 1. Move the old and new GeoTIFF files to the appropriate location on `hades`.
    ```
    ssh user@hades
    sudo mkdir /var/www/html/seaice-monthly # may not be needed
    tar -jxvf seaice2016.bz2
    cp seaice2016/*.tif /var/www/html/seaice-monthly
    sudo chown -R apache:apache /var/www/html/seaice-monthly
    ```
 1. Move the new mapfile into place.
    ```
    sudo cp hsia-2017.map /var/www/html
    sudo chown apache:apache /var/www/html/hsia-2017.map
    sudo ln -s /var/www/html/hsia-2017.map /var/www/html/hsia.map
    ```
 1. Edit the tilecache configuration file.  You may need to fuss around with permissions on these files.
    ```
    cp /var/www/tilecache/tilecache.cfg /var/www/tilecache/tilecache.cfg.bak # backup!
    cp /var/www/tilecache/tilecache.cfg /var/www/tilecache/tilecache.cfg.new # Working copy!
    vi /var/www/tilecache/tilecache.cfg.new
    [ edit the tile cache configuration file and remove all portions that reference sea ice atlas layers; leave other parts alone. Save. ]
    cat ~/hsia-tilecache.cfg >> /var/www/tilecache/tilecache.cfg.new
    [ verify that the file looks OK ]
    mv /var/www/tilecache/tilecache.cfg.new /var/www/tilecache/tilecache.cfg
    ```
 1. Restart apache.
    ```
    sudo service httpd restart
    ```
 1. Regenerate the tilecache.  We need a clone of this repo to assist with regenerating the cache.  By default, the tilecache configuration file the seed generator uses may be wrong; if you get lots of errors, check to see if the `tilecache_seed.py` is looking in the right spot for configuration (should be `/var/www/tilecache`).  Again, there may be some permission wiggles in the `/tmp/tilecache` directory.
    ```
    rm -rf /tmp/tilecache/seaice*
    git clone https://github.com/ua-snap/sea-ice-atlas.git
    screen # this runs a long time
    bash ./sea-ice-atlas/etc/seedTilecache.sh
    sudo chown -R apache:apache /tmp/tilecache
 1. Get an archive of all the data to move to `hermes`, copy to local machine then `hermes`.
    ```
    cd /var/www/html/seaice-monthly
    tar -cjvf seaice.bz2 *
    mv seaice.bz2 ~
    exit
    scp user@hades:seaice.bz2 .
    ```

#### Update data in PostGIS

The PostGIS data should be generated and manipulated on `hermes`.  These steps assume the archive of all (including updated) data is in a file named `seaice.bz2`.

 1. Prepare the data, clone this repo.
    ```
    scp seaice.bz2 user@hermes:~
    ssh user@hermes
    mkdir tifs && mv seaice.bz2 tifs
    cd tifs && tar -jxvf seaice.bz2 && cd ..
    git clone https://github.com/ua-snap/sea-ice-atlas.git

 1. Update the `sea-ice-atlas/etc/netcdf2raster.r` script as required to change paths/configuration.  Special note, we must change the `tableName` to something new/current:
    ```
    line 33: outDirPath = '~/tifs'
    line 37: endYear = 2016
    line 41: tableName = 'sql_raster_seaice_rev_2017_07_19'
    ```
    ...then run the file and it will eventually emit an SQL file.  (*Note*, there will likely be a huge number of warnings when this script runs, but it should be OK.)
 1. Double check that you are using a different table name than the production PostGIS table. The base name of the raster SQL file name will be used for the new table. I.e., the ```sql_raster_seaice_rev_YYYY_MM_DD``` in ```sql_raster_seaice_rev_YYYY_MM_DD.sql``` will be used as the new table name.
    ```
    sudo su - postgres
    psql -d sea_ice_atlas
    \dt
    ```
    ...and look for the table name.
 1. Then, load the generated raster SQL file into PostGIS.
    ```
    sudo -u postgres psql -d sea_ice_atlas < sql_raster_seaice_rev_YYYY_MM_DD.sql
    ```

#### Update the application configuration

Application configuration lives on `icarus`.

```
ssh user@icarus
sudo su - seaice
cd sea-ice-atlas && vi config.json
[edit configuration for `table` and `endYear` elements.  Save.]
forever restart 0
```

The server will be restarted and the update is complete!  Check out the Cleanup section below, too, for some optional housekeeping.

#### Cleanup

 * on `hades`, remove old files from prior deployments from `/var/www/html` and `/var/www/tilecache`.  Also remove any temporary files or directories from your home directory.
 * on `hermes`, remove temp/scratch files from your home directory.
 * on `hermes`, drop the old data table.
 * on `hermes`, clean up anything in `/var/lib/pgsql`

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
