Shutdown2013.BEGIN_DATE = new Date(2013, 9, 1); // shutdown began midnight Oct. 1. Todo: sync with time server for real stats
Shutdown2013.AVG_SALARY = 78673; // avg of base salary column from Asbury Park datset http://php.app.com/fed_employees12/search.php
Shutdown2013.WIC_FOOD_COST_2012 = 4808604963; // http://web.archive.org/web/20130705090557/http://www.fns.usda.gov/pd/24wicfood$.htm

Shutdown2013.SERVICES = [ // Sourced from various media outlets and USA.gov shutdown FAQ site
    { 'name': "WIC Food Program", 'status': "halted",
        'description': "WIC Program is not distributing food or formula vouchers for low-income mothers and infants. WIC normally provides supplemental food to 8.9 million mothers and children in the lowest income brackets."
    },
    { 'name': "Small Business Loans", 'status': "halted",
        'description': "U.S. Small Business Administration is not processing new loan requests."
    },
    { 'name': "NIH Research", 'status': "halted",
        'description': "The National Institutes of Health will continue to treat patients at its hospital center, but no new clinical trials will begin."
    },
    { 'name': "Parks & Monuments", 'status': "halted",
        'description': "National parks and monuments are closed, including the Grand Canyon, Yosemite, the National Mall and the Statue of Liberty."
    },
    { 'name': "Museums", 'status': "halted",
        'description': "The animals at the National Zoo are being cared for, but the zoo, like all Smithsonian museums, is closed to the public."
    },

    { 'name': "Courts", 'status': "risk",
        'description': "Federal courts will operate normally for around 10 business days. After that the judiciary would begin furloughs of some employees. Cases would be heard, but at a slower rate."
    },
    { 'name': "Disease Control", 'status': "risk",
        'description': "The Centers for Disease Control and Prevention are facing a reduced ability to detect and investigate disease outbreaks. Flu shot program has been halted."
    },
    { 'name': "Space Program", 'status': "risk",
        'description': "NASA Mission Control will continue supporting astronauts serving on the Space Station. But 97% of NASA employees have been furloughed without pay."
    },

    { 'name': "Active Military", 'status': "ok",
        'description': "Active military will continue serving."
    },
    { 'name': "Postal Service", 'status': "ok",
        'description': "The U.S. Postal Service will keep delivering mail."
    },
    { 'name': "Social Security", 'status': "ok",
        'description': "Social Security beneficiaries will continue receiving checks."
    },
    { 'name': "Air Traffic", 'status': "ok",
        'description': "Air traffic controllers, prison guards, and border patrol agents will remain on the job."
    },
    { 'name': "Prisons", 'status': "ok",
        'description': "Air traffic controllers, prison guards, and border patrol agents will remain on the job."
    },
    { 'name': "Border Patrol", 'status': "ok",
        'description': "Air traffic controllers, prison guards, and border patrol agents will remain on the job."
    }
];

String.prototype.commafy = function () {
    return this.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
        return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,");
    });
};
Number.prototype.commafy = function () {
    return String(this).commafy();
};