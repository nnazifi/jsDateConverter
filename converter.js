var GREGORIAN_EPOCH = 1721425.5;
var PERSIAN_EPOCH = 1948320.5;

var PERSIAN_WEEKDAYS = new Array("یکشنبه", "دوشنبه",
    "سه شنبه", "چهارشنبه",
    "پنج شنبه", "جمعه", "شنبه");

/**
 * Determine Julian day and fraction of the March equinox at
 * the Tehran meridian in a given Gregorian year.
 * @param year
 * @returns {number}
 */
function tehran_equinox(year){
    var equJED, equJD, equAPP, equTehran, dtTehran;

    //  March equinox in dynamical time
    equJED = equinox(year, 0);

    //  Correct for delta T to obtain Universal time
    equJD = equJED - (deltat(year) / (24 * 60 * 60));

    //  Apply the equation of time to yield the apparent time at Greenwich
    equAPP = equJD + equationOfTime(equJED);

    /*  Finally, we must correct for the constant difference between
     the Greenwich meridian andthe time zone standard for
     Iran Standard time, 52�30' to the East.  */

    dtTehran = (52 + (30 / 60.0) + (0 / (60.0 * 60.0))) / 360;
    equTehran = equAPP + dtTehran;

    return equTehran;
}

/**
 * Calculate Julian day during which the March equinox,
 * reckoned from the Tehran meridian, occurred for a given Gregorian year.
 * @param year
 * @returns {number}
 */
function tehran_equinox_jd(year){
    var ep, epg;

    ep = tehran_equinox(year);
    epg = Math.floor(ep);

    return epg;
}

/**
 * Determine the year in the Persian astronomical calendar in which a
 * given Julian day falls.  Returns an array of two elements:
 *  [0]  Persian year
 *  [1]  Julian day number containing equinox for this year.
 * @param jd
 * @returns {Array}
 */
function persianAstronomicalYear(jd){
    var guess = jdToGregorian(jd)[0] - 2,
        lasteq, nexteq, adr;

    lasteq = tehran_equinox_jd(guess);
    while (lasteq > jd) {
        guess--;
        lasteq = tehran_equinox_jd(guess);
    }
    nexteq = lasteq - 1;
    while (!((lasteq <= jd) && (jd < nexteq))) {
        lasteq = nexteq;
        guess++;
        nexteq = tehran_equinox_jd(guess);
    }
    adr = Math.round((lasteq - PERSIAN_EPOCH) / TropicalYear) + 1;

    return new Array(adr, lasteq);
}

/**
 * Is a given year in the Gregorian calendar a leap year ?
 * @param year
 * @returns {boolean}
 */
function leapGregorian(year){
    return ((year % 4) == 0) &&
        (!(((year % 100) == 0) && ((year % 400) != 0)));
}

/**
 * Is a given year a leap year in the Persian astronomical calendar ?
 * @param year
 * @returns {boolean}
 */
function leapPersianAstronomical(year){
    return (persianAstronomicalToJd(year + 1, 1, 1) -
        persianAstronomicalToJd(year, 1, 1)) > 365;
}

/**
 * Is a given year a leap year in the Persian calendar ?
 * @param year
 * @returns {boolean}
 */
function leapPersian(year){
    return ((((((year - ((year > 0) ? 474 : 473)) % 2820) + 474) + 38) * 682) % 2816) < 682;
}

/**
 * Determine Julian day number from Gregorian calendar date
 * @param year
 * @param month
 * @param day
 * @returns {number}
 */
function gregorianToJd(year, month, day){
    return (GREGORIAN_EPOCH - 1) +
        (365 * (year - 1)) +
        Math.floor((year - 1) / 4) +
        (-Math.floor((year - 1) / 100)) +
        Math.floor((year - 1) / 400) +
        Math.floor((((367 * month) - 362) / 12) +
            ((month <= 2) ? 0 :
                (leapGregorian(year) ? -1 : -2)
                ) +
            day);
}

/**
 * Calculate Gregorian calendar date from Julian day
 * @param jd
 * @returns {Array}
 */
function jdToGregorian(jd) {
    var wjd, depoch, quadricent, dqc, cent, dcent, quad, dquad,
        yindex, dyindex, year, yearday, leapadj;

    wjd = Math.floor(jd - 0.5) + 0.5;
    depoch = wjd - GREGORIAN_EPOCH;
    quadricent = Math.floor(depoch / 146097);
    dqc = mod(depoch, 146097);
    cent = Math.floor(dqc / 36524);
    dcent = mod(dqc, 36524);
    quad = Math.floor(dcent / 1461);
    dquad = mod(dcent, 1461);
    yindex = Math.floor(dquad / 365);
    year = (quadricent * 400) + (cent * 100) + (quad * 4) + yindex;
    if (!((cent == 4) || (yindex == 4))) {
        year++;
    }
    yearday = wjd - gregorianToJd(year, 1, 1);
    leapadj = ((wjd < gregorianToJd(year, 3, 1)) ? 0
        :
        (leapGregorian(year) ? 1 : 2)
        );
    month = Math.floor((((yearday + leapadj) * 12) + 373) / 367);
    day = (wjd - gregorianToJd(year, month, 1)) + 1;

    return new Array(year, month, day);
}

/**
 * Calculate date in the Persian astronomical calendar from Julian day.
 * @param jd
 * @returns {Array}
 */
function jdToPersianAstronomical(jd){
    var year, month, day,
        adr, equinox, yday;

    jd = Math.floor(jd) + 0.5;
    adr = persianAstronomicalYear(jd);
    year = adr[0];
    equinox = adr[1];
    day = Math.floor((jd - equinox) / 30) + 1;

    yday = (Math.floor(jd) - persianAstronomicalToJd(year, 1, 1)) + 1;
    month = (yday <= 186) ? Math.ceil(yday / 31) : Math.ceil((yday - 6) / 30);
    day = (Math.floor(jd) - persianAstronomicalToJd(year, month, 1)) + 1;

    return new Array(year, month, day);
}

/**
 * Obtain Julian day from a given Persian
 astronomical calendar date.
 * @param year
 * @param month
 * @param day
 * @returns {number}
 */
function persianAstronomicalToJd(year, month, day){
    var adr, equinox, guess, jd;

    guess = (PERSIAN_EPOCH - 1) + (TropicalYear * ((year - 1) - 1));
    adr = new Array(year - 1, 0);

    while (adr[0] < year) {
        adr = persianAstronomicalYear(guess);
        guess = adr[1] + (TropicalYear + 2);
    }
    equinox = adr[1];

    jd = equinox +
        ((month <= 7) ?
            ((month - 1) * 31) :
            (((month - 1) * 30) + 6)
            ) +
        (day - 1);
    return jd;
}

/**
 * Determine Julian day from Persian date
 * @param year
 * @param month
 * @param day
 * @returns {number}
 */
function persianToJd(year, month, day){
    var epbase, epyear;

    epbase = year - ((year >= 0) ? 474 : 473);
    epyear = 474 + mod(epbase, 2820);

    return day +
        ((month <= 7) ?
            ((month - 1) * 31) :
            (((month - 1) * 30) + 6)
            ) +
        Math.floor(((epyear * 682) - 110) / 2816) +
        (epyear - 1) * 365 +
        Math.floor(epbase / 2820) * 1029983 +
        (PERSIAN_EPOCH - 1);
}

/**
 * Calculate Persian date from Julian day
 * @param jd
 * @returns {Array}
 */
function jdToPersian(jd){
    var year, month, day, depoch, cycle, cyear, ycycle,
        aux1, aux2, yday;


    jd = Math.floor(jd) + 0.5;

    depoch = jd - persianToJd(475, 1, 1);
    cycle = Math.floor(depoch / 1029983);
    cyear = mod(depoch, 1029983);
    if (cyear == 1029982) {
        ycycle = 2820;
    } else {
        aux1 = Math.floor(cyear / 366);
        aux2 = mod(cyear, 366);
        ycycle = Math.floor(((2134 * aux1) + (2816 * aux2) + 2815) / 1028522) +
            aux1 + 1;
    }
    year = ycycle + (2820 * cycle) + 474;
    if (year <= 0) {
        year--;
    }
    yday = (jd - persianToJd(year, 1, 1)) + 1;
    month = (yday <= 186) ? Math.ceil(yday / 31) : Math.ceil((yday - 6) / 30);
    day = (jd - persianToJd(year, month, 1)) + 1;
    return new Array(year, month, day);
}

/**
 * Converts gregorian date to persian date
 * @param year
 * @param month
 * @param day
 * @returns {Array}
 */
function convertGregorianToPersian(year, month, day){
    var j;

    //  Update Julian day
    j = gregorianToJd(year, month, day);

    var perscal = jdToPersian(j);
    perscal[1] = perscal[1];
    return perscal
}

/**
 * Converts gregorian date to persian astronomical date
 * @param year
 * @param month
 * @param day
 * @returns {Array}
 */
function convertGregorianToPersianAstronomical(year, month, day){
    var j;

    //  Update Julian day
    j = gregorianToJd(year, month, day);

    var perscal = jdToPersianAstronomical(j);
    perscal[1] = perscal[1];
    return perscal
}
