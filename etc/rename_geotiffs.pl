#!/usr/bin/perl

use strict;
use warnings;

my $directory = '/home/craig/gtiff';

opendir(DIR, $directory) or die $!;

while(my $oldfile = readdir(DIR)) {
  if((my $newfile = $oldfile) =~ s/^sic_mean_pct_monthly_ak_([0-9]{2})_([0-9]{2})_([0-9]{4}).tif/seaice_conc_sic_mean_pct_monthly_ak_$3_$1.tif/) {
    my $oldpath = "$directory/$oldfile";
    my $newpath = "$directory/$newfile";
    rename($oldpath, $newpath);
  }
}

closedir(DIR);
