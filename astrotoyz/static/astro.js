// Copyright 2015 by Fred Moolekamp
// License: LGPLv3

// Define namespace to avoid collisions
Toyz.namespace('Toyz.Astro.Utils');

// Base 10 logarithm
Toyz.Astro.Utils.log10=function(x){
    return Math.log(x)/Math.log(10);
};
// Gaussian function
Toyz.Astro.Utils.gaussian=function(x,amplitude,mean,stdDev, floor){
    var gaussian=amplitude*Math.exp(-Math.pow((x-mean)/(2*stdDev),2));
    if(floor!==undefined){
        gaussian = gaussian+floor;
    };
    //console.log("gaussian:",x,amplitude,mean,stdDev,gaussian);
    return gaussian
};

// convert degrees to sexagesimal
Toyz.Astro.Utils.deg2sex=function(x){
    var y=Math.abs(x);
    var sign=x?x<0?-1:1:0;
    var sex={
        deg:Math.floor(y)
    };
    sex.min=Math.floor((y-sex.deg)*60);
    sex.sec=(y-sex.deg-sex.min/60)*3600;
    sex.deg=sex.deg*sign;
    return sex;
};
// convert sexagesimal to degrees
Toyz.Astro.Utils.sex2deg=function(sex){
    var sign=x?x<0?-1:1:0;
    return sign*(Math.abs(sex.deg)+sex.min/60+sex.sec/3600);
};
// convert sexagesimal to string
Toyz.Astro.Utils.sex2string=function(sex,precision){
    if(precision===undefined){
        precision = 3;
    };
    var pow10=Math.pow(10,precision);
    var sec=Math.round(sex.sec*pow10)/pow10
    return sex.deg.toString()+"\xB0  "+sex.min.toString()+"'  "+sec.toString()+'"';
};
// Initial a set of wcs RA and DEC
Toyz.Astro.Utils.World = function(ra,dec){
    if(isNaN(ra) || isNaN(dec)){
        throw Error('Tried to initialize world coords without numbers')
    };
    this.ra = ra;
    this.dec = dec;
    this.ra_sex = Toyz.Astro.Utils.deg2sex(ra/15);
    this.ra_sex.hours = this.ra_sex.deg;
    this.ra_sex.deg = this.ra_sex.hours * 15;
    this.dec_sex = Toyz.Astro.Utils.deg2sex(dec);
};
Toyz.Astro.Utils.World.prototype.get_ra = function(precision){
    if(precision===undefined){
        precision = 3;
    };
    var ra=this.ra_sex;
    var pow10=Math.pow(10,precision);
    var sec=Math.round(ra.sec*pow10)/pow10;
    return ra.hours.toString()+"h "+ra.min.toString()+'m '+sec.toString()+"s";
};
Toyz.Astro.Utils.World.prototype.get_dec = function(precision){
    if(precision===undefined){
        precision = 3;
    };
    return Toyz.Astro.Utils.sex2string(this.dec_sex,precision);
};

// I like to log a message when the script is loaded to help track bugs
console.log('Astro Toyz loaded');